# BuddyAI Project Context

## Project Overview
- **Name**: BuddyAI - AI Learning Companion
- **Purpose**: An intelligent, student-focused learning platform
- **Tech Stack**:
  - **Frontend**: React, Tailwind CSS
  - **Backend**: Django, Django REST Framework
  - **AI/ML**: LangChain, ChromaDB, HuggingFace Embeddings
  - **Authentication**: Simple JWT
  - **Database**: SQLite (Development)

## Current Features
- User Authentication (Login/Signup)
- RAG-based Q&A System
- Dynamic Explanation Levels
- Vector Database Search

## Development Milestones
- [x] User Authentication
- [x] Basic UI Components
- [x] RAG System Implementation
- [ ] Voice Input Integration
- [ ] Advanced Image Extraction
- [ ] Multilingual Support

## Current Development Focus
- Refining RAG retrieval logic
- Improving UI/UX
- Implementing dynamic suggested topics

## Technical Architecture
### Frontend
- React with Tailwind CSS
- React Router for navigation
- Axios for API calls
- State management with React Hooks

### Backend
- Django REST Framework
- JWT Authentication
- LangChain for RAG
- ChromaDB for vector storage
- DeepSeek/Claude 3.5 Haiku for LLM

## Deployment Strategy
- Frontend: Vite, potential Vercel deployment
- Backend: Django, potential Heroku/AWS hosting

## Recent Major Updates
- Dynamic explanation type dropdown
- Improved LLM service with fallback handling
- Enhanced frontend routing and state management

## Project Setup
1. Clone repository
2. Setup backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. Setup frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Contribution Guidelines
- Follow PEP 8 for Python
- Use ESLint for React
- Comprehensive commit messages
- Feature branches for pull requests

## Contact
- Repository: https://github.com/mipedv/BuddyAI
- Primary Developer: Student
- Current LLM: Claude 3.5 Haiku 