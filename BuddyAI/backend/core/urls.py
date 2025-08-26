from django.urls import path
from .views import llm_view, translate_view
from .views import practice_view
from .views import curiosity_view
from .views import test_api
from .views import media_search_views

urlpatterns = [
    path('get-answer/', llm_view.get_answer, name='get_answer'),
    path('chat/', llm_view.chat, name='chat'),
    path('translate/status/', translate_view.translate_status_view, name='translate_status'),
    path('translate/', translate_view.translate_view, name='translate'),
    path('rewrite-answer/', llm_view.rewrite_answer, name='rewrite_answer'),
    path('chapters/<str:chapter_id>/generate-questions', practice_view.generate_questions, name='generate_questions'),
    path('questions/<str:question_id>/score', practice_view.score_question, name='score_question'),
    # Curiosity
    path('curiosity/discover', curiosity_view.discover, name='curiosity_discover'),
    # Media search (Google CSE)
    path('search-images/', media_search_views.search_images, name='search_images'),
    path('search-videos/', media_search_views.search_videos, name='search_videos'),
    # Test Mode endpoints under /api/core/ for proxy compatibility
    path('tests/start/', test_api.start_test, name='tests_start'),
    path('tests/<uuid:test_id>/save/', test_api.save_answer, name='tests_save'),
    path('tests/<uuid:test_id>/submit/', test_api.submit_test, name='tests_submit'),
    path('tests/<uuid:test_id>/summary/', test_api.summary, name='tests_summary'),
]
