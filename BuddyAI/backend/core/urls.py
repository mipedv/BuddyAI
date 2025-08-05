from django.urls import path
from core.views import llm_view, chat_views, media_search_views, chapter_view

urlpatterns = [
    # LLM specific endpoints
    path("get-answer/", llm_view.get_answer, name="get_answer"),
    path("get-answer-post/", llm_view.get_answer_post, name="get_answer_post"),
    path("get-chapter-content/", chapter_view.get_chapter_content, name="get_chapter_content"),
    
    # Chat endpoints
    path("chat/", chat_views.chat_view, name="chat"),
    path("save-chat/", chat_views.save_chat_view, name="save_chat"),
    path("load-chat/", chat_views.load_chat_view, name="load_chat"),
    
    # Media search endpoints
    path("search-images/", media_search_views.search_images, name="search_images"),
    path("search-videos/", media_search_views.search_videos, name="search_videos"),

    
    # Health check
    path("health/", chat_views.health_check_view, name="health_check"),
    
    # Main page
    path("", chat_views.index_view, name="index"),
]
