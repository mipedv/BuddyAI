from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from core.services import llm_service

# Chat-related views

@csrf_exempt
@require_http_methods(["POST"])
def chat_view(request):
    """
    Handle chat requests and return AI responses.
    """
    try:
        data = json.loads(request.body)
        message = data.get('message', '')
        level = data.get('level', 'textbook')
        history = data.get('history', [])
        
        if not message or len(message.strip()) < 4:
            return JsonResponse({
                'success': False,
                'error': 'Please provide a valid question (at least 4 characters).'
            })
        
        # Get response from LLM service
        response = llm_service.get_chat_response(message, level, history)
        
        return JsonResponse({
            'success': True,
            'answer': response['answer'],
            'suggested_questions': response['suggested_questions'],
            'level': response['level']
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def save_chat_view(request):
    """
    Save chat history to a file.
    """
    try:
        data = json.loads(request.body)
        history = data.get('history', [])
        
        if not history:
            return JsonResponse({
                'success': False,
                'error': 'No chat history provided.'
            })
        
        filepath = llm_service.save_chat_to_file(history)
        
        if filepath:
            return JsonResponse({
                'success': True,
                'filepath': filepath,
                'message': f'Chat saved successfully to {filepath}'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Failed to save chat.'
            })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        })

@csrf_exempt
@require_http_methods(["POST"])
def load_chat_view(request):
    """
    Load chat history from a file.
    """
    try:
        data = json.loads(request.body)
        filepath = data.get('filepath', '')
        
        if not filepath:
            return JsonResponse({
                'success': False,
                'error': 'No filepath provided.'
            })
        
        history = llm_service.load_chat_from_file(filepath)
        
        return JsonResponse({
            'success': True,
            'history': history
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data.'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        })

@require_http_methods(["GET"])
def health_check_view(request):
    """
    Health check endpoint to verify the service is running.
    """
    return JsonResponse({
        'success': True,
        'message': 'Buddy AI service is running!',
        'status': 'healthy'
    })

def index_view(request):
    """
    Main page view (for future web interface).
    """
    return render(request, 'core/index.html', {
        'title': 'Buddy AI - Your Learning Companion'
    }) 