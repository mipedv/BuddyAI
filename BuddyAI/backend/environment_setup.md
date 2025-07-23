# Environment Setup for Buddy AI Backend

## 🔧 Required Environment Variables

Create a `.env` file in the `BuddyAI/backend/` directory with the following content:

```bash
# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=your_actual_openai_api_key_here

# Django Settings
DEBUG=True
SECRET_KEY=django-insecure-development-key-change-in-production

# LLM Service Configuration
LLM_MODEL=deepseek-chat
LLM_TEMPERATURE=0.7
```

## 📁 Path Configuration Fixed

The Django backend has been updated to correctly find the `vector_db` at the root level:

- **Vector DB Path**: `../../../vector_db` (relative to backend directory)
- **Knowledge Base**: `../../../knowledge-base`
- **Saved Chats**: `../../../saved_chats`

## 🚀 Setup Steps

1. **Create .env file**:
   ```bash
   cd BuddyAI/backend
   # Create .env file with your OpenAI API key
   ```

2. **Run Django migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Start the server**:
   ```bash
   python manage.py runserver
   ```

4. **Test the API**:
   ```bash
   curl "http://127.0.0.1:8000/api/get-answer/?query=What is solar system&level=textbook"
   ```

## ⚠️ Current Issues Fixed

- ✅ **Vector DB path corrected** - Now points to `../../../vector_db`
- ✅ **Path resolution improved** - Uses relative paths from backend directory
- 🔧 **Environment variables** - Need to create .env file manually
- 🔧 **Database migrations** - Run `python manage.py migrate`

## 📝 Notes

- The vector_db contains existing data and should work once the path is correct
- The Django backend will automatically find and load the vector store
- Make sure your OpenAI API key is valid for the LLM to work properly 