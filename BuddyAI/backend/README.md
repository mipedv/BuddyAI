# Buddy AI Django Backend

This Django backend provides API endpoints for the Buddy AI learning companion, handling LLM operations, chat functionality, and vector store interactions.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

5. **Test the service:**
   ```bash
   python test_llm_service.py
   ```

## 📡 API Endpoints

### Chat Endpoints

#### `POST /api/chat/`
Handle chat requests and return AI responses.

**Request Body:**
```json
{
    "message": "What is the solar system?",
    "level": "textbook",
    "history": []
}
```

**Response:**
```json
{
    "success": true,
    "answer": "The solar system consists of...",
    "suggested_questions": [
        "How many planets are there?",
        "What is the largest planet?",
        "How far is Earth from the Sun?"
    ],
    "level": "textbook"
}
```

#### `POST /api/save-chat/`
Save chat history to a JSON file.

**Request Body:**
```json
{
    "history": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"}
    ]
}
```

**Response:**
```json
{
    "success": true,
    "filepath": "saved_chats/Buddy_Chat_2025-01-04_12-34-56.json",
    "message": "Chat saved successfully to saved_chats/Buddy_Chat_2025-01-04_12-34-56.json"
}
```

#### `POST /api/load-chat/`
Load chat history from a JSON file.

**Request Body:**
```json
{
    "filepath": "saved_chats/Buddy_Chat_2025-01-04_12-34-56.json"
}
```

**Response:**
```json
{
    "success": true,
    "history": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"}
    ]
}
```

### Utility Endpoints

#### `GET /api/health/`
Health check endpoint.

**Response:**
```json
{
    "success": true,
    "message": "Buddy AI service is running!",
    "status": "healthy"
}
```

## 🧠 LLM Service Features

### Answer Levels

1. **Textbook** (`textbook`): Strict answers based on retrieved textbook content
2. **Detailed** (`detailed`): Enhanced explanations with examples and analogies
3. **Advanced** (`advanced`): Deep explanations with scientific reasoning and context

### Vector Store Integration

The service uses:
- **ChromaDB** for vector storage
- **HuggingFace embeddings** (sentence-transformers/all-MiniLM-L6-v2)
- **Hybrid retrieval** combining BM25 and vector similarity
- **Conversation memory** for context-aware responses

### Question Suggestions

The service automatically generates follow-up questions based on responses to encourage deeper learning.

## 📁 Project Structure

```
backend/
├── core/
│   ├── services/
│   │   └── llm_service.py      # Main LLM service
│   ├── views.py                 # Django views
│   ├── urls.py                  # URL routing
│   └── models.py                # Database models
├── backend/
│   ├── settings.py              # Django settings
│   └── urls.py                  # Main URL configuration
├── test_llm_service.py          # Service testing script
├── requirements.txt              # Python dependencies
└── README.md                    # This file
```

## 🔧 Development

### Testing the Service

Run the test script to verify the LLM service is working:

```bash
python test_llm_service.py
```

### Adding New Features

1. **New LLM functions**: Add to `core/services/llm_service.py`
2. **New API endpoints**: Add to `core/views.py` and `core/urls.py`
3. **Database models**: Add to `core/models.py`

### Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key for LLM operations

## 🚨 Notes

- The service currently uses mock responses for detailed and advanced levels
- Vector store initialization requires existing documents in the `vector_db` directory
- Chat history is saved as JSON files in the `saved_chats` directory
- CSRF protection is disabled for API endpoints (use proper authentication in production) 