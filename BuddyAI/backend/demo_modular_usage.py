#!/usr/bin/env python
"""
Demo: Using the Modular LLM Service
This shows how the clean architecture and modular design makes it easy to use.
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import the service and convenience functions from the services package
from core.services import llm_service, get_answer, get_suggestions, search_knowledge


def demo_modular_usage():
    """Demonstrate the clean, modular usage patterns."""
    
    print("🧪 Demo: Modular LLM Service Usage")
    print("=" * 50)
    
    # Demo 1: Service status check
    print("\n1. 📊 Service Status Check")
    status = llm_service.get_service_status()
    for key, value in status.items():
        icon = "✅" if value else "❌"
        print(f"   {icon} {key}: {value}")
    
    # Demo 2: Different answer levels using the service directly
    print("\n2. 🎯 Different Answer Levels")
    question = "What is the solar system?"
    
    for level in ["textbook", "detailed", "advanced"]:
        print(f"\n   📚 {level.upper()} Level:")
        answer = llm_service.generate_answer(question, level)
        print(f"   Answer: {answer[:100]}...")
    
    # Demo 3: Using convenience functions
    print("\n3. 🚀 Using Convenience Functions")
    
    # Quick answer
    simple_answer = get_answer("What are stars?", "textbook")
    print(f"   Quick answer: {simple_answer[:80]}...")
    
    # Quick suggestions
    suggestions = get_suggestions(simple_answer)
    print(f"   Follow-up questions:")
    for i, suggestion in enumerate(suggestions, 1):
        if suggestion:
            print(f"     {i}. {suggestion}")
    
    # Demo 4: Knowledge search
    print("\n4. 🔍 Knowledge Base Search")
    chunks = search_knowledge("planets in solar system")
    print(f"   Found {len(chunks)} relevant chunks")
    if chunks:
        print(f"   Sample chunk: {chunks[0].page_content[:100]}..." if chunks[0].page_content else "No content")
    
    # Demo 5: Complete chat response
    print("\n5. 💬 Complete Chat Response")
    chat_response = llm_service.get_chat_response(
        message="How many planets are there?",
        level="detailed"
    )
    
    print(f"   Answer: {chat_response['answer'][:100]}...")
    print(f"   Suggestions: {[s for s in chat_response['suggested_questions'] if s]}")
    
    # Demo 6: Modular components
    print("\n6. 🔧 Using Individual Components")
    
    # Build custom prompt
    custom_prompt = llm_service.build_prompt("Explain gravity", "advanced")
    print(f"   Custom prompt: {custom_prompt[:80]}...")
    
    # Generate specific type of answer
    textbook_answer = llm_service.generate_textbook_answer("What is gravity?")
    print(f"   Textbook answer: {textbook_answer[:80]}...")
    
    detailed_answer = llm_service.generate_detailed_answer("What is gravity?", textbook_answer)
    print(f"   Detailed answer: {detailed_answer[:80]}...")
    
    print("\n🎉 Demo completed! The modular design allows:")
    print("   ✅ Easy access to individual components")
    print("   ✅ Convenience functions for quick usage")
    print("   ✅ Full control over the pipeline")
    print("   ✅ Clean separation of concerns")
    print("   ✅ Easy testing and debugging")


def demo_error_handling():
    """Demonstrate robust error handling."""
    print("\n🛡️ Error Handling Demo")
    print("=" * 30)
    
    # Test with invalid inputs
    print("\n1. Testing with invalid inputs:")
    
    # Empty question
    result = llm_service.generate_answer("")
    print(f"   Empty question: {result}")
    
    # Invalid level
    result = llm_service.generate_answer("Test question", "invalid_level")
    print(f"   Invalid level: {result[:50]}...")
    
    # Service gracefully handles errors
    print("\n✅ Service handles errors gracefully without crashing!")


if __name__ == "__main__":
    demo_modular_usage()
    demo_error_handling() 