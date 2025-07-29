#!/usr/bin/env python3
"""
Test script for Google Search API functionality
"""

import os
import sys
import django
import requests

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.services.google_search_service import GoogleSearchService

def test_google_api():
    """Test the Google Search API setup"""
    
    print("🧪 Testing Google Search API Setup\n")
    
    # Initialize the service
    search_service = GoogleSearchService()
    
    # Check if API credentials are configured
    if search_service.api_key and search_service.search_engine_id:
        print("✅ API credentials found!")
        print(f"📊 API Key: {search_service.api_key[:10]}...")
        print(f"🔍 Search Engine ID: {search_service.search_engine_id}")
        
        # Test image search
        print("\n🖼️  Testing Image Search...")
        images = search_service.search_images("solar system", 3)
        
        if images:
            print(f"✅ Found {len(images)} images!")
            for i, img in enumerate(images[:3], 1):
                print(f"  {i}. {img['title']} - {img['source']}")
        else:
            print("❌ No images found")
        
        # Test video search
        print("\n🎥 Testing Video Search...")
        videos = search_service.search_videos("solar system", 3)
        
        if videos:
            print(f"✅ Found {len(videos)} videos!")
            for i, vid in enumerate(videos[:3], 1):
                print(f"  {i}. {vid['title']} - {vid['source']}")
        else:
            print("❌ No videos found")
            
    else:
        print("❌ API credentials not configured")
        print("📝 Please update google_api_config.py with your credentials")
        
        # Test fallback functionality
        print("\n🔄 Testing Fallback Mode...")
        images = search_service.search_images("solar system", 3)
        videos = search_service.search_videos("solar system", 3)
        
        print(f"📸 Fallback images: {len(images)}")
        print(f"🎬 Fallback videos: {len(videos)}")

def test_api_endpoints():
    """Test the Django API endpoints"""
    
    print("\n🌐 Testing Django API Endpoints...")
    
    base_url = "http://localhost:8000/api/core"
    
    # Test image search endpoint
    try:
        response = requests.get(f"{base_url}/search-images/", 
                              params={'query': 'solar system', 'num_results': 3},
                              timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Image API: {data['total_results']} results")
        else:
            print(f"❌ Image API: HTTP {response.status_code}")
            
    except requests.RequestException as e:
        print(f"❌ Image API: Connection error - {e}")
        print("💡 Make sure Django server is running: python manage.py runserver")
    
    # Test video search endpoint
    try:
        response = requests.get(f"{base_url}/search-videos/", 
                              params={'query': 'solar system', 'num_results': 3},
                              timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Video API: {data['total_results']} results")
        else:
            print(f"❌ Video API: HTTP {response.status_code}")
            
    except requests.RequestException as e:
        print(f"❌ Video API: Connection error - {e}")

if __name__ == "__main__":
    test_google_api()
    test_api_endpoints() 