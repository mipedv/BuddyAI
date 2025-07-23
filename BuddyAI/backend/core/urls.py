from django.urls import path
from core.views import llm_view, chat_views

urlpatterns = [
    # LLM specific endpoints
    path("api/get-answer/", llm_view.get_answer, name="get_answer"),
    path("api/get-answer-post/", llm_view.get_answer_post, name="get_answer_post"),
    
    # Chat endpoints
    path("api/chat/", chat_views.chat_view, name="chat"),
    path("api/save-chat/", chat_views.save_chat_view, name="save_chat"),
    path("api/load-chat/", chat_views.load_chat_view, name="load_chat"),
    
    # Health check
    path("api/health/", chat_views.health_check_view, name="health_check"),
    
    # Main page
    path("", chat_views.index_view, name="index"),
]
