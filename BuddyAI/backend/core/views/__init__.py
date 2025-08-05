"""
Views package for Buddy AI backend.

This package contains view functions and classes that handle HTTP requests
and responses for the Django application.
"""

from .llm_view import get_answer
from .chat_views import chat_view, save_chat_view, load_chat_view, health_check_view, index_view
from .chapter_view import get_chapter_content


__all__ = [
    'get_answer',
    'chat_view',
    'save_chat_view', 
    'load_chat_view',
    'health_check_view',
    'index_view',
    'get_chapter_content',
    'extract_text_from_image',
    'extract_text_from_file'
] 