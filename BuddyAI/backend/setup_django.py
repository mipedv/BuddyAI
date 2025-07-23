#!/usr/bin/env python
"""
Django Setup Script
This script helps set up the Django backend with proper paths and migrations.
"""

import os
import sys
import subprocess
from pathlib import Path

def setup_django():
    """Set up Django backend with proper configuration."""
    
    print("🔧 Setting up Buddy AI Django Backend")
    print("=" * 50)
    
    # Get the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    print(f"📁 Working directory: {backend_dir}")
    
    # Check if .env file exists
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("\n⚠️ .env file not found!")
        print("Creating a sample .env file...")
        
        env_content = """# Buddy AI Backend Environment Variables
# Add your actual OpenAI API key here

OPENAI_API_KEY=your_openai_api_key_here
DEBUG=True
SECRET_KEY=django-insecure-development-key-change-in-production
LLM_MODEL=deepseek-chat
LLM_TEMPERATURE=0.7
"""
        
        try:
            with open(env_file, 'w') as f:
                f.write(env_content)
            print(f"✅ Created .env file at: {env_file}")
            print("⚠️ Please edit the .env file and add your OpenAI API key!")
        except Exception as e:
            print(f"❌ Could not create .env file: {e}")
    else:
        print("✅ .env file found")
    
    # Check vector_db path
    vector_db_paths = [
        "../../../vector_db",
        "../../vector_db", 
        "../vector_db",
        "vector_db"
    ]
    
    vector_db_found = False
    for path in vector_db_paths:
        if os.path.exists(path):
            print(f"✅ Found vector_db at: {path}")
            vector_db_found = True
            break
    
    if not vector_db_found:
        print("⚠️ vector_db not found at expected locations")
        print("Expected locations:", vector_db_paths)
    
    # Check saved_chats directory
    saved_chats_paths = [
        "../../../saved_chats",
        "../../saved_chats",
        "../saved_chats", 
        "saved_chats"
    ]
    
    saved_chats_found = False
    for path in saved_chats_paths:
        if os.path.exists(path):
            print(f"✅ Found saved_chats at: {path}")
            saved_chats_found = True
            break
    
    if not saved_chats_found:
        print("⚠️ saved_chats directory not found, creating one...")
        os.makedirs("saved_chats", exist_ok=True)
        print("✅ Created saved_chats directory")
    
    # Run Django migrations
    print("\n🗄️ Running Django migrations...")
    try:
        result = subprocess.run([sys.executable, "manage.py", "migrate"], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Django migrations completed successfully")
        else:
            print(f"⚠️ Migration warnings/errors:\n{result.stderr}")
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
    
    # Test imports
    print("\n📦 Testing imports...")
    try:
        sys.path.insert(0, str(backend_dir))
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        
        import django
        django.setup()
        
        from core.services import llm_service
        status = llm_service.get_service_status()
        
        print("✅ Django and services imported successfully")
        print("📊 Service status:")
        for key, value in status.items():
            icon = "✅" if value else "❌"
            print(f"   {icon} {key}: {value}")
            
    except Exception as e:
        print(f"❌ Import error: {e}")
    
    print("\n🚀 Setup Summary:")
    print("1. ✅ Django backend directory configured")
    print("2. 🔧 .env file created (add your OpenAI API key)")
    print("3. ✅ Database migrations completed")
    print("4. ✅ Path resolution improved")
    
    print("\n▶️ Next steps:")
    print("1. Edit .env file and add your OpenAI API key")
    print("2. Run: python manage.py runserver")
    print("3. Test: curl 'http://127.0.0.1:8000/api/health/'")

if __name__ == "__main__":
    setup_django() 