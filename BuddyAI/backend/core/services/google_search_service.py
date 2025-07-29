import os
import requests
from typing import List, Dict, Any
from django.conf import settings

class GoogleSearchService:
    """
    Service for searching images and videos using Google Custom Search API
    """
    
    def __init__(self):
        # You'll need to get these from Google Cloud Console
        self.api_key = os.getenv('GOOGLE_SEARCH_API_KEY', settings.GOOGLE_SEARCH_API_KEY if hasattr(settings, 'GOOGLE_SEARCH_API_KEY') else None)
        self.search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID', settings.GOOGLE_SEARCH_ENGINE_ID if hasattr(settings, 'GOOGLE_SEARCH_ENGINE_ID') else None)
        self.base_url = "https://www.googleapis.com/customsearch/v1"
    
    def search_images(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search for images related to the query
        
        Args:
            query: The search query
            num_results: Number of results to return (max 10 per request)
            
        Returns:
            List of image results with metadata
        """
        if not self.api_key or not self.search_engine_id:
            return self._get_fallback_images(query)
        
        try:
            params = {
                'key': self.api_key,
                'cx': self.search_engine_id,
                'q': query,
                'searchType': 'image',
                'num': min(num_results, 10),
                'safe': 'active',  # Safe search
                'imgSize': 'medium',  # Medium sized images
                'imgType': 'photo',  # Photo type images
                'rights': 'cc_publicdomain,cc_attribute,cc_sharealike'  # Creative commons
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'items' not in data:
                return self._get_fallback_images(query)
            
            images = []
            for item in data['items']:
                image_data = {
                    'title': item.get('title', 'No title'),
                    'link': item.get('link', ''),
                    'thumbnail': item.get('image', {}).get('thumbnailLink', ''),
                    'context_link': item.get('image', {}).get('contextLink', ''),
                    'width': item.get('image', {}).get('width', 0),
                    'height': item.get('image', {}).get('height', 0),
                    'size': item.get('image', {}).get('byteSize', 0),
                    'source': item.get('displayLink', '')
                }
                images.append(image_data)
            
            return images
            
        except Exception as e:
            print(f"❌ Error searching images: {e}")
            return self._get_fallback_images(query)
    
    def search_videos(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search for videos related to the query (YouTube)
        
        Args:
            query: The search query
            num_results: Number of results to return
            
        Returns:
            List of video results with metadata
        """
        try:
            # For videos, we'll use YouTube Data API or search for YouTube links
            youtube_query = f"{query} site:youtube.com"
            
            params = {
                'key': self.api_key,
                'cx': self.search_engine_id,
                'q': youtube_query,
                'num': min(num_results, 10),
                'safe': 'active'
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'items' not in data:
                return self._get_fallback_videos(query)
            
            videos = []
            for item in data['items']:
                if 'youtube.com/watch' in item.get('link', ''):
                    video_data = {
                        'title': item.get('title', 'No title'),
                        'link': item.get('link', ''),
                        'description': item.get('snippet', 'No description'),
                        'thumbnail': self._extract_youtube_thumbnail(item.get('link', '')),
                        'source': 'YouTube',
                        'duration': 'Unknown'  # Would need YouTube API for actual duration
                    }
                    videos.append(video_data)
            
            return videos
            
        except Exception as e:
            print(f"❌ Error searching videos: {e}")
            return self._get_fallback_videos(query)
    
    def _extract_youtube_thumbnail(self, youtube_url: str) -> str:
        """Extract YouTube thumbnail from URL"""
        try:
            if 'v=' in youtube_url:
                video_id = youtube_url.split('v=')[1].split('&')[0]
                return f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg"
        except:
            pass
        return ""
    
    def _get_fallback_images(self, query: str) -> List[Dict[str, Any]]:
        """
        Fallback images when API is not available
        """
        # Static fallback images based on common educational topics
        fallback_images = {
            'solar system': [
                {
                    'title': 'Solar System Overview',
                    'link': '/media/main.png',
                    'thumbnail': '/media/thumbnail1.png',
                    'context_link': '',
                    'width': 800,
                    'height': 600,
                    'size': 0,
                    'source': 'Local Assets'
                },
                {
                    'title': 'Planets in Solar System',
                    'link': '/media/thumbnail2.png',
                    'thumbnail': '/media/thumbnail2.png',
                    'context_link': '',
                    'width': 400,
                    'height': 300,
                    'size': 0,
                    'source': 'Local Assets'
                }
            ]
        }
        
        query_lower = query.lower()
        for key in fallback_images:
            if key in query_lower:
                return fallback_images[key]
        
        return fallback_images['solar system']  # Default fallback
    
    def _get_fallback_videos(self, query: str) -> List[Dict[str, Any]]:
        """
        Fallback videos when API is not available
        """
        return [
            {
                'title': f'Educational Video about {query}',
                'link': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',  # Placeholder
                'description': f'Learn more about {query} in this educational video',
                'thumbnail': 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                'source': 'YouTube',
                'duration': '5:30'
            }
        ] 