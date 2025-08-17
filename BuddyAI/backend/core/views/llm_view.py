# llm_view.py
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from core.services.llm_service import llm_service

def get_answer(request):
    """
    Get an answer for a given query with optional explanation level.
    """
    query = request.GET.get('query', '')
    level = request.GET.get('level', 'textbook')

    if not query:
        return JsonResponse({
            'success': False,
            'error': 'No query provided'
        }, status=400)

    try:
        # Use LLM service to generate answer
        
        # Add detailed logging
        print(f"🔍 Generating answer for query: '{query}'")
        print(f"🎯 Explanation level: {level}")
        
        response = llm_service.get_chat_response(message=query, level=level)

        # Add logging for response
        print(f"✅ Answer generated successfully")
        print(f"📝 Answer length: {len(response['answer'])} characters")
        print(f"❓ Suggested questions: {response.get('suggested_questions', [])}")

        return JsonResponse({
            'success': True,
            'answer': response['answer'],
            'suggested_questions': response.get('suggested_questions', []),
            'level': level
        })

    except Exception as e:
        # Detailed error logging
        import traceback
        print(f"❌ Error in get_answer: {e}")
        print("🔍 Detailed error traceback:")
        traceback.print_exc()
        
        return JsonResponse({
            'success': False,
            'error': f"An error occurred while processing your request: {str(e)}",
            'details': traceback.format_exc()
        }, status=500)


def get_service_status(request):
    """
    Get the current status of the LLM service.
    """
    try:
        status = llm_service.get_service_status()
        return JsonResponse(status)
    except Exception as e:
        print(f"❌ Error in get_service_status: {e}")
        return JsonResponse({
            'success': False,
            'error': f"An error occurred while fetching service status: {str(e)}"
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def chat(request):
    """
    Handle conversational chat with context preservation.
    """
    try:
        data = json.loads(request.body)
        message = data.get('message', '')
        history = data.get('history', [])
        level = data.get('level', 'detailed')

        if not message:
            return JsonResponse({
                'success': False,
                'error': 'No message provided'
            }, status=400)

        # Use LLM service to generate chat response
        response = llm_service.get_chat_response(
            message=message, 
            level=level, 
            history=history
        )

        return JsonResponse({
            'success': True,
            'answer': response['answer'],
            'suggested_questions': response.get('suggested_questions', []),
            'level': level
        })

    except Exception as e:
        print(f"❌ Error in chat: {e}")
        return JsonResponse({
            'success': False,
            'error': f"An error occurred while processing your request: {str(e)}"
        }, status=500) 

@require_http_methods(["POST"])
@csrf_exempt
def rewrite_answer(request):
    """
    Rewrite a previous answer with a specific mode.
    Supports regenerating the last answer or a specific turn's answer.
    """
    try:
        data = json.loads(request.body)
        user_prompt = data.get('user_prompt')
        mode = data.get('mode', 'textbook')
        conversation_context = data.get('conversation_context', [])
        turn_index = data.get('turn_index', -1)  # -1 means last turn

        # Validate inputs
        if not user_prompt:
            return JsonResponse({
                'success': False, 
                'error': 'User prompt is required'
            }, status=400)

        # Use LLM service to generate answer
        
        # If turn_index is specified, use that context
        if turn_index != -1 and turn_index < len(conversation_context):
            context_for_turn = conversation_context[:turn_index+1]
        else:
            context_for_turn = conversation_context

        # Generate new answer
        response = llm_service.get_chat_response(
            message=user_prompt, 
            level=mode, 
            history=context_for_turn
        )

        return JsonResponse({
            'success': True,
            'answer': response['answer'],
            'suggested_questions': response.get('suggested_questions', []),
            'mode': mode,
            'turn_index': turn_index
        })

    except Exception as e:
        print(f"❌ Error in rewrite_answer: {e}")
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=500) 