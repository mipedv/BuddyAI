from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from core.services.google_search_service import GoogleSearchService

# Initialize the search service
search_service = GoogleSearchService()

@csrf_exempt
@require_http_methods(["GET"])
def search_images(request):
    """
    Search for images related to a query
    
    Query Parameters:
        - query: The search query
        - num_results: Number of results (default: 12, max: 20)
    """
    try:
        query = request.GET.get('query')
        num_results = int(request.GET.get('num_results', 12))
        
        if not query:
            return JsonResponse({
                'success': False,
                'error': 'Query parameter is required'
            }, status=400)
        
        if num_results > 20:
            num_results = 20
        
        # Search for images
        images = search_service.search_images(query, num_results)
        
        return JsonResponse({
            'success': True,
            'query': query,
            'total_results': len(images),
            'images': images
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred while searching images: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def search_videos(request):
    """
    Search for videos related to a query
    
    Query Parameters:
        - query: The search query
        - num_results: Number of results (default: 10, max: 15)
    """
    try:
        query = request.GET.get('query')
        num_results = int(request.GET.get('num_results', 10))
        
        if not query:
            return JsonResponse({
                'success': False,
                'error': 'Query parameter is required'
            }, status=400)
        
        if num_results > 15:
            num_results = 15
        
        # Search for videos
        videos = search_service.search_videos(query, num_results)
        
        return JsonResponse({
            'success': True,
            'query': query,
            'total_results': len(videos),
            'videos': videos
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'An error occurred while searching videos: {str(e)}'
        }, status=500) 