from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpRequest
import json
import uuid


def _bad_request(message: str, status: int = 400):
    return JsonResponse({"error": message}, status=status)


@csrf_exempt
def generate_questions(request: HttpRequest, chapter_id: str):
    if request.method != 'POST':
        return _bad_request('Method not allowed', 405)
    try:
        payload = json.loads(request.body.decode('utf-8')) if request.body else {}
        section = payload.get('section')
        mix = payload.get('mix') or {"written": 1, "mcq": 0}
        difficulty = payload.get('difficulty', 'moderate')
        if not isinstance(mix, dict) or not all(k in mix for k in ('written', 'mcq')):
            return _bad_request('Invalid mix')

        total = int(mix.get('written', 0)) + int(mix.get('mcq', 0))
        items = []
        # Minimal placeholder generation to unblock frontend; replace with llm_service backed RAG.
        for i in range(int(mix.get('written', 0))):
            items.append({
                "id": str(uuid.uuid4()),
                "chapterId": chapter_id,
                "section": section,
                "type": "written",
                "prompt": "Explain why day and night happen on Earth.",
                "modelAnswer": "Day and night occur because the Earth rotates on its axis, causing different areas to face the Sun or be in shadow.",
                "rubric": {
                    "keyPoints": ["Earth rotates", "24 hours", "Sunlit side", "Night in shadow"],
                    "keywords": ["rotation", "axis", "day", "night", "Sun"],
                    "misconceptions": ["Sun moves around Earth"]
                },
                "difficulty": difficulty if difficulty in ("easy","moderate","hard") else "moderate"
            })
        for i in range(int(mix.get('mcq', 0))):
            items.append({
                "id": str(uuid.uuid4()),
                "chapterId": chapter_id,
                "section": section,
                "type": "mcq",
                "prompt": "What causes day and night on Earth?",
                "options": [
                    "The Earth rotates on its axis",
                    "The Sun moves around the Earth",
                    "The Moon blocks sunlight every night",
                    "Clouds cover the Sun at night"
                ],
                "correctOptionIndex": 0,
                "modelAnswer": "Because the Earth rotates on its axis, the side facing the Sun has day and the opposite side has night.",
                "rubric": {
                    "keyPoints": ["Rotation on axis", "Day = facing Sun", "Night = opposite side"],
                    "keywords": ["rotation", "axis", "day", "night"],
                    "misconceptions": ["Sun orbits Earth"]
                },
                "difficulty": difficulty if difficulty in ("easy","moderate","hard") else "moderate"
            })
        return JsonResponse({"items": items})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def score_question(request: HttpRequest, question_id: str):
    if request.method != 'POST':
        return _bad_request('Method not allowed', 405)
    try:
        payload = json.loads(request.body.decode('utf-8')) if request.body else {}
        qtype = payload.get('type')
        if qtype == 'mcq':
            selected = payload.get('selectedIndex')
            # For placeholder MCQ sample above, index 0 is correct
            score = 100 if selected == 0 else 40
            feedback = {
                "recommendations": [
                    {"id": "r1", "text": "Remember: the Earth rotates on its axis.", "why": "Core concept from the textbook"}
                ],
                "correctParts": []
            }
            return JsonResponse({"score": score, "feedback": feedback})
        elif qtype == 'written':
            answer = (payload.get('answer') or '').strip()
            # Extremely simple heuristic placeholder; real impl will call LLM grader
            score = 40
            if 'rotate' in answer.lower() or 'rotation' in answer.lower():
                score = 80
            if 'axis' in answer.lower():
                score = 95
            feedback = {
                "recommendations": [
                    {"id": "kp1", "text": "Mention that Earth rotates once every ~24 hours.", "why": "Adds precision"}
                ],
                "correctParts": ["You noted the role of Earth's rotation."] if score >= 80 else []
            }
            return JsonResponse({"score": score, "feedback": feedback})
        else:
            return _bad_request('Invalid type')
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


