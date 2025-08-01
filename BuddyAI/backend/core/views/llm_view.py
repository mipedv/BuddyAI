# llm_view.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from core.services import llm_service

def get_answer(request):
    """
    Handle GET requests to retrieve answers from the LLM service.
    
    Query Parameters:
    - query: The user's question (required)
    - level: Answer complexity level (textbook, detailed, advanced) - default: textbook
    
    Returns:
    JSON response with answer and retrieved chunks
    """
    # Get query parameters
    query = request.GET.get("query")
    level = request.GET.get("level", "textbook").strip()
    
    # Validate required parameters
    if not query:
        return JsonResponse({
            "success": False,
            "error": "Query parameter is required"
        }, status=400)
    
    if not query.strip() or len(query.strip()) < 4:
        return JsonResponse({
            "success": False,
            "error": "Query must be at least 4 characters long"
        }, status=400)
    
    # Validate level parameter
    valid_levels = ["textbook", "detailed", "advanced"]
    if level not in valid_levels:
        return JsonResponse({
            "success": False,
            "error": f"Invalid level. Must be one of: {', '.join(valid_levels)}"
        }, status=400)
    
    try:
        # Retrieve relevant chunks
        chunks = llm_service.retrieve_textbook_chunks(query)
        
        # Generate answer using the service
        answer = llm_service.generate_answer(query, level)
        
        # Generate suggested questions
        suggested_questions = llm_service.generate_suggested_questions(answer)
        
        # Prepare response
        response_data = {
            "success": True,
            "query": query,
            "level": level,
            "answer": answer,
            "chunks": [
                {
                    "content": chunk.page_content,
                    "metadata": chunk.metadata if hasattr(chunk, 'metadata') else {}
                }
                for chunk in chunks
            ],
            "suggested_questions": [q for q in suggested_questions if q.strip()],
            "num_chunks_retrieved": len(chunks)
        }
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": f"An error occurred while processing your request: {str(e)}"
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def get_answer_post(request):
    """
    Handle POST requests to retrieve answers from the LLM service.
    
    Request Body (JSON):
    {
        "query": "What is the solar system?",
        "level": "textbook",
        "history": []
    }
    
    Returns:
    JSON response with answer and retrieved chunks
    """
    try:
        import json
        data = json.loads(request.body)
        
        query = data.get("query")
        level = data.get("level", "textbook")
        history = data.get("history", [])
        
        # Validate required parameters
        if not query:
            return JsonResponse({
                "success": False,
                "error": "Query is required"
            }, status=400)
        
        if not query.strip() or len(query.strip()) < 4:
            return JsonResponse({
                "success": False,
                "error": "Query must be at least 4 characters long"
            }, status=400)
        
        # Validate level parameter
        valid_levels = ["textbook", "detailed", "advanced"]
        if level not in valid_levels:
            return JsonResponse({
                "success": False,
                "error": f"Invalid level. Must be one of: {', '.join(valid_levels)}"
            }, status=400)
        
        # Get complete chat response
        response = llm_service.get_chat_response(query, level, history)
        
        # Retrieve chunks for additional context
        chunks = llm_service.retrieve_textbook_chunks(query)
        
        # Prepare response
        response_data = {
            "success": True,
            "query": query,
            "level": level,
            "answer": response["answer"],
            "suggested_questions": response["suggested_questions"],
            "chunks": [
                {
                    "content": chunk.page_content,
                    "metadata": chunk.metadata if hasattr(chunk, 'metadata') else {}
                }
                for chunk in chunks
            ],
            "num_chunks_retrieved": len(chunks)
        }
        
        return JsonResponse(response_data)
        
    except json.JSONDecodeError:
        return JsonResponse({
            "success": False,
            "error": "Invalid JSON in request body"
        }, status=400)
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": f"An error occurred while processing your request: {str(e)}"
        }, status=500) 