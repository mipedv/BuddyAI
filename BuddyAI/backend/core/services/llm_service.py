"""
Updated LLM Service with strict textbook mode enforcement.
This version uses the new textbook vector database and implements strict mode separation.
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# LangChain imports
from langchain.schema import Document, HumanMessage
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# Load environment variables
load_dotenv()


class LLMService:
    """
    Enhanced LLM service with strict mode enforcement for textbook-based RAG system.
    
    Three modes:
    1. Textbook: ONLY textbook.pdf content
    2. Detailed: Textbook content + LLM enhancement  
    3. Advanced: Primarily LLM knowledge
    """
    
    def __init__(self):
        """Initialize all service components."""
        self._validate_environment()
        self._initialize_core_components()
        self._initialize_prompts()
        self._initialize_textbook_vector_store()
    
    def _validate_environment(self):
        """Validate required environment variables."""
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment!")
    
    def _initialize_core_components(self):
        """Initialize LLM, embeddings, and memory components."""
        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Initialize LLM with different temperatures for different modes
        self.llm_textbook = ChatOpenAI(
            temperature=0.1,  # Very low for textbook accuracy
            model="deepseek-chat",
            openai_api_key=self.openai_api_key
        )
        
        self.llm_detailed = ChatOpenAI(
            temperature=0.3,  # Medium for detailed explanations
            model="deepseek-chat", 
            openai_api_key=self.openai_api_key
        )
        
        self.llm_advanced = ChatOpenAI(
            temperature=0.7,  # Higher for creative advanced explanations
            model="deepseek-chat",
            openai_api_key=self.openai_api_key
        )
        
        # Default LLM (for backward compatibility)
        self.llm = self.llm_textbook
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key='chat_history', 
            return_messages=True
        )
        
        # Initialize placeholders
        self.textbook_vectorstore = None
        self.conversation_chain = None
        
        # Mode-specific configurations
        self.mode_config = {
            "textbook": {
                "max_chunks": 3,
                "llm": self.llm_textbook,
                "strict_textbook_only": True,
                "description": "Uses ONLY textbook.pdf content"
            },
            "detailed": {
                "max_chunks": 4,
                "llm": self.llm_detailed,
                "strict_textbook_only": False,
                "description": "Uses textbook + LLM enhancement"
            },
            "advanced": {
                "max_chunks": 2,
                "llm": self.llm_advanced,
                "strict_textbook_only": False,
                "description": "Uses primarily LLM knowledge"
            }
        }
    
    def _initialize_prompts(self):
        """Initialize strict prompt templates for different answer levels."""
        self.PROMPTS = {
            "textbook": """You are a strict textbook assistant. You must follow these rules exactly:

STRICT RULES:
1. Use ONLY the information provided in the textbook content below
2. Do not add any external knowledge, examples, or explanations not in the textbook
3. If the textbook content doesn't fully answer the question, say "The textbook doesn't provide enough information to fully answer this question"
4. Use the exact terminology and explanations from the textbook
5. Keep answers simple and directly based on the textbook text

TEXTBOOK CONTENT:
{context}

QUESTION: {question}

ANSWER (using only the textbook content above):""",
            
            "detailed": """You are an educational assistant helping students understand textbook concepts better.

TASK:
1. Use the textbook content below as your primary and main source
2. Explain the concept in a clearer, more detailed way
3. Add simple analogies or examples that help understanding (but don't contradict the textbook)
4. Enhance the textbook explanation to make it more accessible
5. Target middle school students

TEXTBOOK CONTENT:
{context}

QUESTION: {question}

DETAILED EXPLANATION (based on textbook with helpful enhancements):""",
            
            "advanced": """You are an advanced science educator providing comprehensive explanations.

TASK:
1. Provide a deep, structured explanation using your scientific knowledge
2. Include scientific reasoning, historical context, and real-world applications
3. Go beyond basic textbook explanations with advanced concepts
4. Target high school level or above
5. Use textbook content as minimal reference only

REFERENCE CONTENT (if available):
{context}

QUESTION: {question}

ADVANCED COMPREHENSIVE EXPLANATION:"""
        }
    
    def _initialize_textbook_vector_store(self):
        """Initialize the textbook-specific vector store."""
        try:
            # Use the new textbook vector database
            textbook_db_paths = [
                "../../textbook_vector_db",  # New textbook database
                "../../../textbook_vector_db",
                "../textbook_vector_db",
                "textbook_vector_db"
            ]
            
            textbook_db_path = None
            for path in textbook_db_paths:
                if os.path.exists(path):
                    textbook_db_path = path
                    print(f"✅ Found textbook vector database at: {path}")
                    break
            
            if textbook_db_path:
                self.textbook_vectorstore = Chroma(
                    persist_directory=textbook_db_path,
                    embedding_function=self.embeddings
                )
                print("✅ Textbook vector store initialized successfully!")
                
                # Test the database
                test_results = self.textbook_vectorstore.similarity_search("solar system", k=1)
                print(f"🧪 Test query found {len(test_results)} textbook chunks")
                
            else:
                print("⚠️ Textbook vector store not found. Please run create_fresh_textbook_db.py first.")
                
        except Exception as e:
            print(f"❌ Error initializing textbook vector store: {e}")
    
    def retrieve_textbook_chunks(self, query: str, k: int = 3) -> List[Document]:
        """
        Retrieve chunks specifically from textbook content with validation.
        """
        if not self.textbook_vectorstore:
            print("⚠️ Textbook vector store not available")
            return []
        
        try:
            # Retrieve chunks from textbook database
            chunks = self.textbook_vectorstore.similarity_search(query, k=k)
            
            print(f"📚 Retrieved {len(chunks)} textbook chunks for: '{query}'")
            
            # Validate that all chunks are from textbook
            textbook_chunks = []
            for chunk in chunks:
                if chunk.metadata.get('source') == 'textbook.pdf':
                    textbook_chunks.append(chunk)
                else:
                    print(f"⚠️ Non-textbook chunk found: {chunk.metadata}")
            
            print(f"✅ Validated {len(textbook_chunks)} pure textbook chunks")
            return textbook_chunks
            
        except Exception as e:
            print(f"❌ Error retrieving textbook chunks: {e}")
            return []
    
    def generate_textbook_answer(self, message: str, history: List[Dict] = None) -> Dict[str, Any]:
        """
        Generate answer using ONLY textbook content with strict validation.
        """
        print("📘 TEXTBOOK MODE: Strict textbook-only mode activated")
        
        # Get configuration
        config = self.mode_config["textbook"]
        
        # Retrieve textbook chunks
        chunks = self.retrieve_textbook_chunks(message, k=config["max_chunks"])
        
        if not chunks:
            return {
                "success": False,
                "answer": f"I couldn't find information about '{message}' in the textbook. This topic may not be covered in your science textbook, or you might need to rephrase your question.",
                "suggested_questions": self._get_topic_specific_questions(message),
                "source": "textbook_only"
            }
        
        # Build context from textbook chunks only
        context = "\n\n".join([
            f"[Textbook Page {chunk.metadata.get('page_number', '?')}]: {chunk.page_content}"
            for chunk in chunks
        ])
        
        try:
            # Use strict textbook prompt with textbook-specific LLM
            prompt = self.PROMPTS["textbook"].format(
                context=context,
                question=message
            )
            
            response = config["llm"].invoke(prompt)
            answer = response.content.strip()
            
            # Validate answer quality
            if any(phrase in answer.lower() for phrase in [
                "i don't have information", 
                "not in the textbook", 
                "cannot be answered",
                "insufficient information"
            ]):
                return {
                    "success": False,
                    "answer": f"The textbook doesn't contain enough information to answer: '{message}'. Please try asking about topics that are covered in your science textbook.",
                    "suggested_questions": self._get_topic_specific_questions(message),
                    "source": "textbook_only",
                    "used_mode": "textbook",
                    "mode_notes": "Insufficient textbook chunks found to confidently answer."
                }

            # Successful textbook answer
            return {
                "success": True,
                "answer": answer,
                "suggested_questions": self.generate_suggested_questions(answer),
                "source": "textbook_only",
                "chunks_used": len(chunks),
                "used_mode": "textbook",
                "mode_notes": "Answer generated strictly from retrieved textbook chunks."
            }

        except Exception as e:
            print(f"❌ Error generating textbook answer: {e}")
            return {
                "success": False,
                "answer": "Error generating textbook explanation. Please try again.",
                "suggested_questions": self._get_topic_specific_questions(message),
                "source": "textbook_only",
                "used_mode": "textbook",
                "mode_notes": "Exception occurred during textbook generation"
            }
    
    def generate_detailed_answer(self, message: str) -> str:
        """
        Generate detailed explanation using textbook + LLM enhancement.
        """
        print("📗 DETAILED MODE: Textbook + LLM enhancement mode")
        
        # Get configuration
        config = self.mode_config["detailed"]
        
        # Retrieve textbook chunks as primary source
        chunks = self.retrieve_textbook_chunks(message, k=config["max_chunks"])
        
        if not chunks:
            return "I couldn't find enough textbook content to provide a detailed explanation. Please try asking about topics covered in your science textbook."
        
        # Build context from textbook chunks
        context = "\n\n".join([
            f"[Textbook Page {chunk.metadata.get('page_number', '?')}]: {chunk.page_content}"
            for chunk in chunks
        ])
        
        try:
            # Use detailed prompt with enhanced LLM
            prompt = self.PROMPTS["detailed"].format(
                context=context,
                question=message
            )
            
            response = config["llm"].invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"❌ Error generating detailed answer: {e}")
            return "Error generating detailed explanation. Please try again."
    
    def generate_advanced_answer(self, message: str) -> str:
        """
        Generate advanced explanation using primarily LLM knowledge.
        """
        print("📕 ADVANCED MODE: Primarily LLM knowledge mode")
        
        # Get configuration
        config = self.mode_config["advanced"]
        
        # Optionally retrieve minimal textbook chunks as reference
        chunks = self.retrieve_textbook_chunks(message, k=config["max_chunks"])
        
        # Build minimal context (textbook is just reference, not primary source)
        context = ""
        if chunks:
            context = "\n\n".join([chunk.page_content for chunk in chunks[:2]])  # Only first 2 chunks
        else:
            context = "No specific textbook reference available for this topic."
        
        try:
            # Use advanced prompt with advanced LLM
            prompt = self.PROMPTS["advanced"].format(
                context=context,
                question=message
            )
            
            response = config["llm"].invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"❌ Error generating advanced answer: {e}")
            return "Error generating advanced explanation. Please try again."
    
    def generate_answer(self, message: str, level: str = "textbook", history: List[Dict] = None) -> str:
        """
        Main method to generate answers based on level with strict mode enforcement.
        """
        if not message or len(message.strip()) < 3:
            return "Please provide a valid question."
        
        print(f"📩 Question: {message}")
        print(f"🎯 Mode: {level.upper()}")
        print(f"📋 Mode description: {self.mode_config.get(level, {}).get('description', 'Unknown')}")
        
        try:
            if level == "textbook":
                result = self.generate_textbook_answer(message, history)
                return result["answer"]
            
            elif level == "detailed":
                return self.generate_detailed_answer(message)
            
            elif level == "advanced":
                return self.generate_advanced_answer(message)
            
            else:
                return f"Invalid level '{level}'. Please use 'textbook', 'detailed', or 'advanced'."
                
        except Exception as e:
            print(f"❌ ERROR in {level} mode: {e}")
            return f"Error generating {level} explanation. Please try again."
    
    def generate_suggested_questions(self, context: str) -> List[str]:
        """Generate suggested questions based on the context."""
        try:
            if len(context) < 30:
                return self._get_fallback_questions()
            
            prompt = f"""Based on this educational content about science, suggest exactly 3 follow-up questions that a student might ask to learn more.

Content: {context[:400]}

Requirements:
- Questions should be directly related to the content
- Suitable for middle school students  
- End with question marks
- Be specific and clear

Provide only the 3 questions, one per line:"""
            
            response = self.llm_detailed.invoke(prompt)
            
            # Parse response
            lines = [line.strip() for line in response.content.split('\n') if line.strip()]
            
            questions = []
            for line in lines:
                # Clean the line
                clean_line = line.strip()
                # Remove numbering
                for prefix in ['1.', '2.', '3.', '-', '•', '*']:
                    if clean_line.startswith(prefix):
                        clean_line = clean_line[len(prefix):].strip()
                
                # Ensure question mark
                if clean_line and not clean_line.endswith('?'):
                    clean_line += '?'
                
                if clean_line and 10 < len(clean_line) < 150:
                    questions.append(clean_line)
            
            # Return exactly 3 questions
            if len(questions) >= 3:
                return questions[:3]
            else:
                # Pad with fallbacks if needed
                fallbacks = self._get_fallback_questions()
                while len(questions) < 3:
                    questions.append(fallbacks[len(questions)])
                return questions[:3]
            
        except Exception as e:
            print(f"❌ Error generating questions: {e}")
            return self._get_fallback_questions()
    
    def _get_fallback_questions(self) -> List[str]:
        """Get fallback questions."""
        return [
            "Can you explain more about this topic?",
            "What are the key points to remember?", 
            "How does this relate to other concepts?"
        ]
    
    def _get_topic_specific_questions(self, context: str) -> List[str]:
        """Generate topic-specific questions based on context."""
        context_lower = context.lower()
        
        if 'solar system' in context_lower or 'planet' in context_lower:
            return [
                "What are the eight planets in our solar system?",
                "How do planets orbit around the Sun?",
                "What makes Earth special compared to other planets?"
            ]
        elif 'sun' in context_lower or 'star' in context_lower:
            return [
                "How does the Sun produce light and heat?",
                "Why does the Sun appear bigger than other stars?",
                "What would happen to Earth without the Sun?"
            ]
        elif 'moon' in context_lower:
            return [
                "Why does the Moon have different phases?",
                "How does the Moon affect Earth's oceans?",
                "How far away is the Moon from Earth?"
            ]
        else:
            return self._get_fallback_questions()
    
    def get_chat_response(self, message: str, level: str = "textbook", history: List[Dict] = None) -> Dict[str, Any]:
        """
        Get complete chat response with mode-specific handling.
        """
        if level == "textbook":
            # For textbook mode, use the structured response
            result = self.generate_textbook_answer(message, history)
            return {
                "answer": result["answer"],
                "suggested_questions": result.get("suggested_questions", []),
                "level": level,
                "success": result.get("success", True),
                "source": result.get("source", "textbook_only"),
                "used_mode": result.get("used_mode", "textbook"),
                "mode_notes": result.get("mode_notes")
            }
        
        # For other modes
        answer = self.generate_answer(message, level, history)
        used_mode = level if level in ("textbook", "detailed", "advanced") else "textbook"
        mode_notes = (
            "Detailed mode: textbook grounded with light elaboration" if used_mode == "detailed"
            else "Advanced mode: allows deeper reasoning beyond textbook"
        )
        suggested_questions = self.generate_suggested_questions(answer)
        
        return {
            "answer": answer,
            "suggested_questions": suggested_questions,
            "level": level,
            "success": True,
            "source": f"{level}_mode",
            "used_mode": used_mode,
            "mode_notes": mode_notes
        }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get service status with textbook database info."""
        return {
            "textbook_vectorstore_available": self.textbook_vectorstore is not None,
            "llm_modes_initialized": all(
                self.mode_config[mode]["llm"] is not None 
                for mode in ["textbook", "detailed", "advanced"]
            ),
            "api_key_configured": bool(self.openai_api_key),
            "mode_configurations": {
                mode: {
                    "max_chunks": config["max_chunks"],
                    "description": config["description"],
                    "strict_textbook_only": config.get("strict_textbook_only", False)
                }
                for mode, config in self.mode_config.items()
            }
        }


# Create singleton instance
llm_service = LLMService()


# Convenience functions
def get_answer(query: str, level: str = "textbook") -> str:
    """Get answer with specified explanation level."""
    return llm_service.generate_answer(query, level)

def get_suggestions(answer: str) -> List[str]:
    """Get suggested follow-up questions."""
    return llm_service.generate_suggested_questions(answer)

def get_textbook_chunks(query: str, k: int = 3) -> List[Document]:
    """Get textbook chunks for a query."""
    return llm_service.retrieve_textbook_chunks(query, k)