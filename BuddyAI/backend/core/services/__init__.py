"""
Services package for Buddy AI backend.

This package contains service classes that handle business logic,
including LLM operations, chat functionality, and data processing.
"""

from .llm_service import llm_service, get_answer, get_suggestions, search_knowledge

__all__ = [
    'llm_service',
    'get_answer', 
    'get_suggestions',
    'search_knowledge'
] 