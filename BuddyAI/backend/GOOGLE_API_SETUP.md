# Google Search API Setup Guide

This guide will help you set up Google Custom Search API for images and videos in the BuddyAI project.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

## Step 2: Enable Custom Search API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Custom Search API"
3. Click on it and press "Enable"

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to Custom Search API only for security

## Step 4: Create Custom Search Engine

1. Go to [Google Custom Search Engine](https://cse.google.com/cse/)
2. Click "Add" to create a new search engine
3. In "Sites to search", enter `www.example.com` (we'll modify this later)
4. Give your search engine a name
5. Click "Create"

## Step 5: Configure Search Engine

1. After creation, click on your search engine
2. Go to "Setup" > "Basics"
3. Delete `www.example.com` from "Sites to search"
4. Turn ON "Search the entire web"
5. Go to "Setup" > "Advanced" > "Image search" and turn it ON
6. Copy your "Search engine ID" from the "Setup" page

## Step 6: Set Environment Variables

Create a `.env` file in your backend directory or set environment variables:

```bash
# In your terminal or .env file
export GOOGLE_SEARCH_API_KEY="your_api_key_here"
export GOOGLE_SEARCH_ENGINE_ID="your_search_engine_id_here"
```

Or update `backend/settings.py`:

```python
GOOGLE_SEARCH_API_KEY = "your_api_key_here"
GOOGLE_SEARCH_ENGINE_ID = "your_search_engine_id_here"
```

## Step 7: Test the Setup

1. Start your Django server: `python manage.py runserver`
2. Test the API endpoints:
   - Images: `http://localhost:8000/api/core/search-images/?query=solar%20system`
   - Videos: `http://localhost:8000/api/core/search-videos/?query=solar%20system`

## API Limits

- Free tier: 100 search queries per day
- Paid tier: $5 per 1000 queries after free tier
- Consider implementing caching for production use

## Troubleshooting

1. **API Key Issues**: Make sure your API key has Custom Search API enabled
2. **Search Engine ID Issues**: Double-check the Search Engine ID from your CSE console
3. **No Results**: Ensure "Search the entire web" is enabled in your Custom Search Engine
4. **Image Search Not Working**: Make sure "Image search" is enabled in CSE Advanced settings

## Fallback Behavior

If the Google API is not configured or fails, the system will fall back to:
- Static local images for common topics like "solar system"
- Placeholder content to ensure the UI doesn't break

This ensures the application works even without Google API configuration during development. 