# chapter_view.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from core.services import llm_service


@require_http_methods(["GET"])
def get_chapter_content(request):
    """
    Retrieve full chapter content from the textbook based on query.
    
    Query Parameters:
    - query: The user's question to find relevant chapter
    - chunks_used: Number of chunks to retrieve (default: 5)
    
    Returns:
    JSON response with chapter content
    """
    query = request.GET.get("query")
    chunks_used = int(request.GET.get("chunks_used", 5))
    
    if not query:
        return JsonResponse({
            "success": False,
            "error": "Query parameter is required"
        }, status=400)
    
    try:
        # Get relevant chunks from the textbook
        chunks = llm_service.retrieve_textbook_chunks(query, k=max(chunks_used, 10))
        
        if not chunks:
            return JsonResponse({
                "success": True,
                "content": "No relevant chapter content found for this query.",
                "chunks_count": 0
            })
        
        # Combine chunks to form chapter content with better organization
        # Group chunks by similarity and add structure
        formatted_chunks = []
        
        for i, chunk in enumerate(chunks):
            content = chunk.page_content.strip()
            
            # Add some structure to the content
            if i == 0:
                # First chunk gets a main heading
                formatted_chunks.append(f"Chapter Introduction\n\n{content}")
            elif i == len(chunks) - 1:
                # Last chunk gets a conclusion heading
                formatted_chunks.append(f"Summary\n\n{content}")
            else:
                # Middle chunks get section headings
                formatted_chunks.append(f"Section {i}\n\n{content}")
        
        chapter_content = "\n\n\n".join(formatted_chunks)
        
        # Clean up the content for better presentation
        chapter_content = chapter_content.replace('\n\n\n\n', '\n\n\n')
        chapter_content = chapter_content.replace('  ', ' ')  # Remove double spaces
        
        return JsonResponse({
            "success": True,
            "content": chapter_content,
            "chunks_count": len(chunks),
            "chapter_title": f"Science Textbook Chapter",
            "metadata": {
                "total_chunks": len(chunks),
                "content_length": len(chapter_content),
                "query_processed": query
            }
        })
        
    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": f"Error retrieving chapter content: {str(e)}"
        }, status=500)