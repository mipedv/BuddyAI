"""
Updated LLM Service with strict mode enforcement:
- Textbook mode: ONLY textbook content
- Detailed mode: Textbook + LLM enhancement
- Advanced mode: Primarily LLM knowledge
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

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

# Load environment variables
load_dotenv()


class LLMService:
    """
    Enhanced LLM service with strict mode enforcement for textbook-based RAG system.
    """
    
    def __init__(self):
        """Initialize all service components."""
        self._validate_environment()
        self._initialize_core_components()
        self._initialize_prompts()
        self._initialize_vector_store()
    
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
        
        # Initialize LLM
        self.llm = ChatOpenAI(
            temperature=0.3,  # Lower temperature for textbook mode accuracy
            model="deepseek-chat",
            openai_api_key=self.openai_api_key
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key='chat_history', 
            return_messages=True
        )
        
        # Initialize placeholders
        self.vectorstore = None
        self.hybrid_retriever = None
        self.conversation_chain = None
        
        # Dynamic chunk control by level
        self.k_values = {
            "textbook": 3,    # More chunks for textbook mode
            "detailed": 4,    # More chunks for detailed explanation
            "advanced": 2     # Fewer chunks for advanced (more LLM knowledge)
        }
    
    def _initialize_prompts(self):
        """Initialize strict prompt templates for different answer levels."""
        self.PROMPTS = {
            "textbook": """
You are a textbook content assistant. Your task is to provide answers using ONLY the information found in the retrieved textbook chunks below.

STRICT RULES:
1. Use ONLY information from the provided textbook content
2. Do not add any external knowledge or explanations
3. If the textbook content doesn't contain enough information, say so
4. Keep the answer simple and directly based on the textbook text
5. Use the exact terminology and explanations from the textbook

Textbook Content:
{context}

Question: {question}

Answer based only on the textbook content above:""",
            
            "detailed": """
You are an educational assistant helping students understand textbook concepts better.

Your task:
1. Use the provided textbook content as your primary source
2. Explain the concept in a clearer, more detailed way
3. Add simple analogies or examples to help understanding
4. Enhance the textbook explanation but don't contradict it
5. Assume the reader is a middle school student

Textbook Content:
{context}

Question: {question}

Provide a detailed explanation based on the textbook content with helpful enhancements:""",
            
            "advanced": """
You are an advanced educational assistant providing comprehensive explanations.

Your task:
1. Provide a deep, structured explanation using your knowledge
2. Include scientific reasoning, historical context, and real-world applications
3. Go beyond basic textbook explanations
4. Use the textbook content as reference but expand significantly
5. Assume the reader is curious and intelligent (high school level or above)

Reference Content (if available):
{context}

Question: {question}

Provide an advanced, comprehensive explanation:"""
        }
        
        self.SUGGEST_QUESTIONS_PROMPT = """
Based on the following educational content, generate exactly 3 clear, specific follow-up questions that a student might ask to learn more.

The questions should be:
- Directly related to the content
- Easy to understand
- Encouraging further learning
- Complete sentences ending with question marks

Content: {content}

Please provide only the 3 questions, one per line, without numbering or bullet points.
"""
    
    def _initialize_vector_store(self):
        """Initialize the vector store and retrievers."""
        try:
            # Vector DB is at the root level - try multiple possible paths
            possible_paths = [
                "../../../vector_db",  # From backend/core/services/
                "../../vector_db",     # From backend/core/
                "../vector_db",        # From backend/
                "vector_db",           # From root
                "./vector_db"          # Current directory
            ]
            
            persist_directory = None
            for path in possible_paths:
                if os.path.exists(path):
                    persist_directory = path
                    print(f"✅ Found vector_db at: {path}")
                    break
            
            if persist_directory and os.path.exists(persist_directory):
                self.vectorstore = Chroma(
                    persist_directory=persist_directory,
                    embedding_function=self.embeddings
                )
                
                # Initialize retrievers and conversation chain
                self._setup_retrievers()
                print("✅ Vector store and retrievers initialized successfully!")
            else:
                print("⚠️ Vector store not found. Please rebuild with textbook content.")
                
        except Exception as e:
            print(f"❌ Error initializing vector store: {e}")
    
    def _setup_retrievers(self):
        """Set up retrievers."""
        try:
            if self.vectorstore:
                vector_retriever = self.vectorstore.as_retriever()
                vector_retriever.search_kwargs = {'k': 3}
                
                # Initialize conversation chain with vector retriever
                self.conversation_chain = ConversationalRetrievalChain.from_llm(
                    llm=self.llm,
                    retriever=vector_retriever,
                    memory=self.memory
                )
        except Exception as e:
            print(f"❌ Error setting up retrievers: {e}")
    
    def retrieve_textbook_chunks(self, query: str, k: int = 3) -> List[Document]:
        """
        Retrieve chunks specifically from textbook content.
        
        Args:
            query: The user's question
            k: Number of chunks to retrieve
            
        Returns:
            List of textbook document chunks
        """
        if not self.vectorstore:
            print("⚠️ Vector store not available")
            return []
        
        try:
            # Retrieve chunks with metadata filter for textbook content
            chunks = self.vectorstore.similarity_search(
                query, 
                k=k,
                filter={"source": "textbook.pdf"}  # Only textbook content
            )
            
            print(f"📚 Retrieved {len(chunks)} textbook chunks for: {query[:50]}...")
            
            # Verify all chunks are from textbook
            textbook_chunks = [c for c in chunks if c.metadata.get('source') == 'textbook.pdf']
            if len(textbook_chunks) != len(chunks):
                print(f"⚠️ Warning: {len(chunks) - len(textbook_chunks)} non-textbook chunks found")
            
            return textbook_chunks
            
        except Exception as e:
            print(f"❌ Error retrieving textbook chunks: {e}")
            # Fallback without filter
            try:
                chunks = self.vectorstore.similarity_search(query, k=k)
                return [c for c in chunks if c.metadata.get('source') == 'textbook.pdf']
            except:
                return []
    
    def generate_textbook_answer(self, message: str, history: List[Dict] = None) -> Dict[str, Any]:
        """
        Generate answer using ONLY textbook content.
        """
        print("📘 TEXTBOOK MODE: Using only textbook content")
        
        # Retrieve textbook chunks
        chunks = self.retrieve_textbook_chunks(message, k=self.k_values["textbook"])
        
        if not chunks:
            return {
                "success": False,
                "answer": f"I couldn't find information about '{message}' in the textbook. Please try a different question or check if this topic is covered in your textbook.",
                "suggested_questions": self._get_topic_specific_questions(message)
            }
        
        # Build context from textbook chunks only
        context = "\n\n".join([chunk.page_content for chunk in chunks])
        
        try:
            # Use strict textbook prompt
            prompt = self.PROMPTS["textbook"].format(
                context=context,
                question=message
            )
            
            response = self.llm.invoke(prompt)
            answer = response.content.strip()
            
            # Ensure answer is based on textbook
            if "I don't have information" in answer or "not found in the textbook" in answer.lower():
                return {
                    "success": False,
                    "answer": f"The textbook doesn't contain sufficient information to answer: {message}",
                    "suggested_questions": self._get_topic_specific_questions(message)
                }
            
            return {
                "success": True,
                "answer": answer,
                "suggested_questions": self.generate_suggested_questions(answer)
            }
            
        except Exception as e:
            print(f"❌ Error generating textbook answer: {e}")
            return {
                "success": False,
                "answer": "Error generating textbook explanation.",
                "suggested_questions": self._get_topic_specific_questions(message)
            }
    
    def generate_detailed_answer(self, message: str) -> str:
        """
        Generate detailed explanation using textbook + LLM enhancement.
        """
        print("📗 DETAILED MODE: Using textbook + LLM enhancement")
        
        # Retrieve textbook chunks
        chunks = self.retrieve_textbook_chunks(message, k=self.k_values["detailed"])
        
        if not chunks:
            return "I couldn't find enough textbook content to provide a detailed explanation. Please try a different question."
        
        # Build context from textbook chunks
        context = "\n\n".join([chunk.page_content for chunk in chunks])
        
        try:
            # Use detailed prompt with textbook context
            prompt = self.PROMPTS["detailed"].format(
                context=context,
                question=message
            )
            
            response = self.llm.invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"❌ Error generating detailed answer: {e}")
            return "Error generating detailed explanation."
    
    def generate_advanced_answer(self, message: str) -> str:
        """
        Generate advanced explanation using primarily LLM knowledge.
        """
        print("📕 ADVANCED MODE: Using primarily LLM knowledge")
        
        # Optionally retrieve some textbook chunks as reference
        chunks = self.retrieve_textbook_chunks(message, k=self.k_values["advanced"])
        
        # Build minimal context (optional reference)
        context = ""
        if chunks:
            context = "\n\n".join([chunk.page_content for chunk in chunks])
        else:
            context = "No specific textbook reference available."
        
        try:
            # Use advanced prompt with minimal textbook reference
            prompt = self.PROMPTS["advanced"].format(
                context=context,
                question=message
            )
            
            response = self.llm.invoke(prompt)
            return response.content.strip()
            
        except Exception as e:
            print(f"❌ Error generating advanced answer: {e}")
            return "Error generating advanced explanation."
    
    def generate_answer(self, message: str, level: str = "textbook", history: List[Dict] = None) -> str:
        """
        Main method to generate answers based on level with strict mode enforcement.
        """
        if not message or len(message.strip()) < 4:
            return "Please provide a valid question."
        
        print(f"📩 User question: {message}")
        print(f"🎯 Level: {level}")
        
        try:
            if level == "textbook":
                result = self.generate_textbook_answer(message, history)
                return result["answer"]
            
            elif level == "detailed":
                return self.generate_detailed_answer(message)
            
            elif level == "advanced":
                return self.generate_advanced_answer(message)
            
            else:
                return "Invalid level specified. Please use 'textbook', 'detailed', or 'advanced'."
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return f"⚠️ Something went wrong: {str(e)}"
    
    def generate_suggested_questions(self, context: str) -> List[str]:
        """Generate suggested questions based on the context."""
        try:
            if len(context) < 50:
                return [
                    "Can you explain more about this topic?",
                    "What are the key points?",
                    "Are there any related concepts?"
                ]
            
            response = self.llm.invoke(
                self.SUGGEST_QUESTIONS_PROMPT.format(content=context[:500])
            )
            
            # Parse the response
            response_text = response.content.strip()
            lines = [line.strip() for line in response_text.split('\n') if line.strip()]
            
            # Filter and clean questions
            questions = []
            for line in lines:
                cleaned = line.strip()
                # Remove common prefixes
                for prefix in ['1.', '2.', '3.', '-', '•', '*', 'Q:', 'Question:']:
                    if cleaned.startswith(prefix):
                        cleaned = cleaned[len(prefix):].strip()
                
                # Ensure it ends with a question mark
                if cleaned and not cleaned.endswith('?'):
                    cleaned += '?'
                
                if cleaned and len(cleaned) > 10 and len(cleaned) < 200:
                    questions.append(cleaned)
            
            # Ensure we have exactly 3 questions
            if len(questions) >= 3:
                return questions[:3]
            elif len(questions) > 0:
                default_questions = [
                    "What are the main components mentioned?",
                    "How does this relate to other topics?",
                    "Can you provide more details about this?"
                ]
                while len(questions) < 3:
                    questions.append(default_questions[len(questions) - 1])
                return questions
            else:
                return self._get_topic_specific_questions(context)
        
        except Exception as e:
            print(f"❌ Error generating suggested questions: {e}")
            return [
                "Can you explain more about this topic?",
                "What are the key points?",
                "Are there any related concepts?"
            ]
    
    def _get_topic_specific_questions(self, context: str) -> List[str]:
        """Generate topic-specific default questions based on context keywords."""
        context_lower = context.lower()
        
        if 'solar system' in context_lower or 'planet' in context_lower:
            return [
                "What are the main planets in our solar system?",
                "How do planets orbit around the Sun?",
                "What makes Earth different from other planets?"
            ]
        elif 'sun' in context_lower or 'star' in context_lower:
            return [
                "How does the Sun produce energy?",
                "What would happen if the Sun disappeared?",
                "How big is the Sun compared to Earth?"
            ]
        elif 'moon' in context_lower:
            return [
                "Why does the Moon have phases?",
                "How does the Moon affect Earth's tides?",
                "How far is the Moon from Earth?"
            ]
        else:
            return [
                "Can you explain more about this topic?",
                "What are the key points to remember?",
                "How does this connect to other concepts?"
            ]
    
    def get_chat_response(self, message: str, level: str = "textbook", history: List[Dict] = None) -> Dict[str, Any]:
        """
        Get a complete chat response including answer and suggested questions.
        """
        # For textbook level, use the enhanced method that returns structured response
        if level == "textbook":
            result = self.generate_textbook_answer(message, history)
            return {
                "answer": result["answer"],
                "suggested_questions": result.get("suggested_questions", []),
                "level": level,
                "success": result.get("success", True)
            }
        
        # For other levels, use the regular flow
        answer = self.generate_answer(message, level, history)
        suggested_questions = self.generate_suggested_questions(answer)
        
        return {
            "answer": answer,
            "suggested_questions": suggested_questions,
            "level": level,
            "success": True
        }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get the current status of the service."""
        return {
            "llm_initialized": self.llm is not None,
            "vectorstore_available": self.vectorstore is not None,
            "conversation_chain_ready": self.conversation_chain is not None,
            "api_key_configured": bool(self.openai_api_key),
            "k_values_configured": self.k_values,
        }


# Create a singleton instance
llm_service = LLMService()


# Convenience functions for easy access
def get_answer(query: str, level: str = "textbook") -> str:
    """Convenience function to get an answer."""
    return llm_service.generate_answer(query, level)

def get_suggestions(answer: str) -> List[str]:
    """Convenience function to get follow-up questions."""
    return llm_service.generate_suggested_questions(answer)

def search_knowledge(query: str, level: str = "textbook") -> List[Document]:
    """Convenience function to search the textbook knowledge base."""
    return llm_service.retrieve_textbook_chunks(query, llm_service.k_values.get(level, 3))