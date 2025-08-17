from django.urls import path
from .views import llm_view, translate_view

urlpatterns = [
    path('get-answer/', llm_view.get_answer, name='get_answer'),
    path('chat/', llm_view.chat, name='chat'),
    path('translate/status/', translate_view.translate_status_view, name='translate_status'),
    path('translate/', translate_view.translate_view, name='translate'),
    path('rewrite-answer/', llm_view.rewrite_answer, name='rewrite_answer'),
]
