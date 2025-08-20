from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
try:
    from core.services.llm_service import llm_service as _llm_service_instance  # optional LLM fallback
except Exception:  # noqa: BLE001 - safe optional import
    _llm_service_instance = None


def _stub_questions(chapter_slug: str, section, difficulty: str):
    return [
        {
            "id": "q-written-1",
            "chapterId": chapter_slug,
            "section": section,
            "type": "written",
            "prompt": "What causes day and night on Earth?",
            "modelAnswer": "Earth’s rotation on its axis causes day and night. As the Earth spins, different parts face the Sun (day) or away from it (night).",
            "rubric": {
                "keyPoints": ["Earth rotates", "axis", "24 hours", "Sun appears to move"],
                "keywords": ["rotation", "axis", "day", "night", "24h"],
                "misconceptions": ["Sun moves around Earth"],
            },
            "difficulty": difficulty if difficulty in ["easy", "moderate", "hard"] else "moderate",
        },
        {
            "id": "q-mcq-1",
            "chapterId": chapter_slug,
            "section": section,
            "type": "mcq",
            "prompt": "Which motion of Earth mainly causes day and night?",
            "options": [
                "Revolution around the Sun",
                "Rotation on its axis",
                "Tilt of axis",
                "Precession",
            ],
            "correctOptionIndex": 1,
            "modelAnswer": "Rotation on its axis.",
            "rubric": {
                "keyPoints": ["rotation"],
                "keywords": ["rotation"],
                "misconceptions": ["Sun’s revolution causes day/night"],
            },
            "difficulty": "easy",
        },
    ]


@method_decorator(csrf_exempt, name="dispatch")
class GenerateQuestionsView(APIView):
    def post(self, request, chapter_slug):
        payload = request.data or {}
        items = _stub_questions(
            chapter_slug=chapter_slug,
            section=payload.get("section"),
            difficulty=(payload.get("difficulty") or "moderate"),
        )
        return Response({"items": items}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class ScoreQuestionView(APIView):
    def post(self, request, question_id):
        payload = request.data or {}
        qtype = payload.get("type")
        if qtype == "mcq":
            selected = payload.get("selectedIndex")
            score = 100 if selected == 1 else 40
            feedback = {
                "recommendations": [
                    {"id": "r1", "text": "Remember: the Earth rotates on its axis.", "why": "Core concept"}
                ],
                "correctParts": [],
            }
            return Response({"score": score, "feedback": feedback}, status=status.HTTP_200_OK)
        if qtype == "written":
            answer = (payload.get("answer") or "").lower()
            score = 40
            if "rotation" in answer or "rotate" in answer:
                score = 80
            if "axis" in answer:
                score = 95
            feedback = {
                "recommendations": [
                    {"id": "kp1", "text": "Mention ~24-hour rotation for completeness.", "why": "Precision"}
                ],
                "correctParts": ["You noted Earth's rotation."] if score >= 80 else [],
            }
            return Response({"score": score, "feedback": feedback}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid type"}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class CorrectAnswerView(APIView):
    """Return the canonical correct answer. Falls back to model generation if needed."""
    def get(self, request, question_id):
        # In this stub stage, we derive by ID pattern; later fetch from DB
        if question_id == "q-written-1":
            return Response({
                "modelAnswer": "Earth rotates on its axis roughly once every 24 hours. The side facing the Sun experiences day while the opposite side has night.",
                "explanation": "This comes from the rotation of Earth, not the Sun moving around Earth."
            })
        if question_id == "q-mcq-1":
            return Response({
                "modelAnswer": "Rotation on its axis.",
                "correctOptionIndex": 1,
                "explanation": "As Earth spins, different regions face the Sun (day) or away (night)."
            })
        # Fallback: if llm_service has a method to derive/correct
        try:
            if _llm_service_instance and hasattr(_llm_service_instance, 'get_correct_answer'):
                data = _llm_service_instance.get_correct_answer(question_id)
                return Response(data)
        except Exception:
            pass
        return Response({"error": "Not found"}, status=404)


