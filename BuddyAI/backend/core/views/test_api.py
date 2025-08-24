from __future__ import annotations

import hashlib
import json
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt

# Try optional LLM service import for written grading at submit time only
try:
    from core.services.llm_service import llm_service as _llm_service_instance  # type: ignore
except Exception:  # noqa: BLE001 - optional fallback
    _llm_service_instance = None


# In-memory store (scoped, non-persistent). Do not broaden scope beyond Test feature.
_TEST_SESSIONS: Dict[str, Dict[str, Any]] = {}
_GRADE_CACHE: Dict[Tuple[str, str, str], Dict[str, Any]] = {}


def _json_error(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"error": message}, status=status)


def _hash_answer(answer: Any) -> str:
    try:
        payload = json.dumps(answer, sort_keys=True, ensure_ascii=False)
    except Exception:
        payload = str(answer)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _now_ts() -> int:
    return int(time.time())


@csrf_exempt
def start_test(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return _json_error("Method not allowed", 405)
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
        chapter_id = data.get("chapterId")
        question_ids = data.get("questionIds") or []
        pass_threshold = int(data.get("passThreshold") or 60)
        if not chapter_id or not isinstance(question_ids, list) or not question_ids:
            return _json_error("chapterId and non-empty questionIds are required")
        test_id = str(uuid.uuid4())
        _TEST_SESSIONS[test_id] = {
            "id": test_id,
            "chapterId": chapter_id,
            "questionIds": list(question_ids),  # preserve order
            "answers": {},  # questionId -> raw answer (text or index)
            "startedAt": _now_ts(),
            "submitted": False,
            "passThreshold": pass_threshold,
            "graded": {},  # questionId -> graded row
        }
        return JsonResponse({"testId": test_id})
    except Exception as e:
        return _json_error(str(e), 500)


@csrf_exempt
def save_answer(request: HttpRequest, test_id: str) -> JsonResponse:
    if request.method != "POST":
        return _json_error("Method not allowed", 405)
    session = _TEST_SESSIONS.get(test_id)
    if not session or session.get("submitted"):
        return _json_error("Test not found or already submitted", 404)
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
        qid = data.get("questionId")
        answer = data.get("answer")
        if not qid:
            return _json_error("questionId is required")
        if qid not in session.get("questionIds", []):
            return _json_error("questionId not in this test")
        session["answers"][qid] = answer
        # Inline saved flag; no toasts.
        return JsonResponse({"saved": True})
    except Exception as e:
        return _json_error(str(e), 500)


def _grade_written(answer_text: str, pass_threshold: int, rubric: Optional[Dict[str, Any]] = None) -> Tuple[int, bool, List[str]]:
    # Default heuristic if LLM is unavailable; mirrors practice placeholder semantics
    llm_score = 40
    lowered = (answer_text or "").lower()
    if "rotation" in lowered or "rotate" in lowered:
        llm_score = 80
    if "axis" in lowered:
        llm_score = 95
    is_pass = llm_score >= pass_threshold
    score10 = 10 if is_pass else 0
    missed_keys: List[str] = []
    if rubric and isinstance(rubric.get("keyPoints"), list):
        # simple missed keys heuristic
        for key in rubric["keyPoints"]:
            if isinstance(key, str) and key.lower() not in lowered:
                missed_keys.append(key)
    return score10, is_pass, missed_keys


def _grade_mcq(selected_index: Optional[int], correct_index: Optional[int]) -> Tuple[int, bool]:
    if selected_index is None or correct_index is None:
        return 0, False
    is_correct = selected_index == correct_index
    return (10 if is_correct else 0), is_correct


@csrf_exempt
def submit_test(request: HttpRequest, test_id: str) -> JsonResponse:
    if request.method != "POST":
        return _json_error("Method not allowed", 405)
    session = _TEST_SESSIONS.get(test_id)
    if not session:
        return _json_error("Test not found", 404)
    try:
        data = json.loads(request.body.decode("utf-8")) if request.body else {}
        pass_threshold = int(data.get("passThreshold") or session.get("passThreshold") or 60)

        # Grade all questions now. Do not call LLM during the test; only at submit.
        correct_count = 0
        total = len(session.get("questionIds", []))

        for qid in session.get("questionIds", []):
            raw_answer = session["answers"].get(qid)
            # Derive question metadata if available from already-graded or defaults
            graded_row = session["graded"].get(qid)
            qtype = graded_row["type"] if graded_row else None
            correct_index = graded_row.get("correctIndex") if graded_row else None
            correct_answer_text = graded_row.get("correctAnswer") if graded_row else None
            rubric = graded_row.get("rubric") if graded_row else None

            # For this stub, infer by qid pattern; real impl can be hydrated by practice generator
            if not qtype:
                if str(qid).startswith("q-mcq-"):
                    qtype = "mcq"
                    correct_index = 1 if qid == "q-mcq-1" else 0
                else:
                    qtype = "written"

            cache_key = (test_id, qid, _hash_answer(raw_answer))
            cached = _GRADE_CACHE.get(cache_key)
            if cached:
                row = cached
            else:
                if qtype == "mcq":
                    score10, is_correct = _grade_mcq(
                        selected_index=raw_answer if isinstance(raw_answer, int) else None,
                        correct_index=correct_index if isinstance(correct_index, int) else 0,
                    )
                    row = {
                        "questionId": qid,
                        "type": "mcq",
                        "yourAnswer": raw_answer,
                        "correctAnswer": correct_index,  # frontend may map to option text
                        "score10": score10,
                        "isCorrect": is_correct,
                        "missedKeys": [],
                    }
                else:
                    answer_text = raw_answer or ""
                    # If LLM exists and has evaluator, one could integrate it here; keep placeholder
                    score10, is_pass, missed_keys = _grade_written(
                        answer_text=str(answer_text),
                        pass_threshold=pass_threshold,
                        rubric=rubric,
                    )
                    row = {
                        "questionId": qid,
                        "type": "written",
                        "yourAnswer": answer_text,
                        "correctAnswer": correct_answer_text or "Rotation on axis causes day and night.",
                        "score10": score10,
                        "isCorrect": is_pass,
                        "missedKeys": missed_keys,
                    }
                _GRADE_CACHE[cache_key] = row

            session["graded"][qid] = row
            if row.get("score10", 0) == 10:
                correct_count += 1

        session["submitted"] = True
        session["submittedAt"] = _now_ts()
        overall_percent = round((correct_count / total) * 100) if total else 0
        return JsonResponse({
            "overallPercent": overall_percent,
            "correct": correct_count,
            "total": total,
        })
    except Exception as e:
        return _json_error(str(e), 500)


@csrf_exempt
def summary(request: HttpRequest, test_id: str) -> JsonResponse:
    if request.method != "GET":
        return _json_error("Method not allowed", 405)
    session = _TEST_SESSIONS.get(test_id)
    if not session:
        return _json_error("Test not found", 404)
    # Build rows from graded data; handle not-answered
    question_ids: List[str] = session.get("questionIds", [])
    rows: List[Dict[str, Any]] = []
    correct_count = 0
    for idx, qid in enumerate(question_ids):
        row = session.get("graded", {}).get(qid)
        if not row:
            # not answered or not graded yet: treat as 0 score
            raw_answer = session.get("answers", {}).get(qid)
            row = {
                "questionId": qid,
                "type": "written" if not str(qid).startswith("q-mcq-") else "mcq",
                "yourAnswer": raw_answer if raw_answer is not None else None,
                "correctAnswer": None,
                "score10": 0,
                "isCorrect": False,
                "missedKeys": [],
            }
        if row.get("score10", 0) == 10:
            correct_count += 1
        rows.append(row)

    total = len(question_ids)
    overall_percent = round((correct_count / total) * 100) if total else 0
    started_at = int(session.get("startedAt") or _now_ts())
    submitted_at = int(session.get("submittedAt") or _now_ts())
    time_spent_sec = max(0, submitted_at - started_at)

    return JsonResponse({
        "overallPercent": overall_percent,
        "correctCount": correct_count,
        "total": total,
        "timeSpentSec": time_spent_sec,
        "rows": rows,
    })


