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
    Modular LLM service for handling chat operations, answer generation,
    and question suggestions following clean architecture principles.
    """
    
    def __init__(self):
        """Initialize all service components."""
        self._validate_environment()
        self._initialize_core_components()
        self._initialize_prompts()
        self._initialize_vector_store()
    
    # Initialization methods
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
            temperature=0.7, 
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
            "textbook": 2,
            "detailed": 3,
            "advanced": 4
        }
    
    def _initialize_prompts(self):
        """Initialize prompt templates for different answer levels."""
        self.PROMPTS = {
            "textbook": "Generate the answer strictly using the most relevant retrieved chunks from the textbook PDF. Do not include any additional explanation or information not found in the retrieved content, Keep the answer simple, accurate",
            
            "detailed": "Using the retrieved textbook content as the main source, explain this in a clearer and slightly more detailed way. Use simple analogies or real-world examples if helpful, but stay close to the textbook content. Assume the reader is a middle school student.",
            
            "advanced": "Now go beyond the textbook. Provide a deeper, structured explanation using your knowledge. Include scientific reasoning, historical context, and real-world applications where relevant. Assume the reader is curious and intelligent, like a high school student or above."
        }
        
        self.SUGGEST_QUESTIONS_PROMPT = """
        Based on the following response, suggest 3 interesting follow-up questions a student might ask to understand more:

        Response:
        "{content}"

        Respond with each question on a new line.
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
                print("⚠️ Vector store not found. Please initialize with documents first.")
                
        except Exception as e:
            print(f"❌ Error initializing vector store: {e}")
    
    def _setup_retrievers(self):
        """Set up BM25 and hybrid retrievers."""
        try:
            # Create a simple vector retriever for now
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
    
    # ✅ NEW: Modular retrieval logic with dynamic chunk control
    def get_retriever(self, level: str, query: str):
        """
        Get a configured retriever based on the answer level and query.
        
        Args:
            level: The answer level (textbook, detailed, advanced)
            query: The user's query
            
        Returns:
            Configured retriever with appropriate k value
        """
        if not self.vectorstore:
            return None
            
        # Get dynamic k value based on level
        k = self.k_values.get(level, 3)
        
        # Create retriever with dynamic k
        retriever = self.vectorstore.as_retriever(
            search_kwargs={
                "k": k,
                # Future: metadata-based filtering
                # "filter": {"chapter": "Solar System"}  # uncomment when metadata is available
            }
        )
        
        print(f"📊 Using k={k} chunks for level: {level}")
        return retriever
    
    # ✅ UPDATED: Enhanced retrieve_chunks with level-aware logic
    def retrieve_chunks(self, query: str, level: str = "textbook") -> List[Document]:
        """
        Retrieve relevant chunks from the vector store with level-aware logic.
        
        Args:
            query: The user's question
            level: The answer level (textbook, detailed, advanced)
            
        Returns:
            List of relevant document chunks
        """
        if not self.vectorstore:
            print("⚠️ Vector store not available")
            return []
        
        try:
            # Get dynamic k value based on level
            k = self.k_values.get(level, 3)
            
            # Retrieve chunks
            chunks = self.vectorstore.similarity_search(query, k=k)
            print(f"📚 Retrieved {len(chunks)} chunks for: {query[:50]}... (level: {level})")
            
            # ✅ Early check for textbook mode: content must be present
            if level == "textbook" and chunks:
                if not any(query.lower() in chunk.page_content.lower() for chunk in chunks):
                    print("⚠️ No relevant textbook content found for query")
                    return []  # This will trigger fallback handling
            
            return chunks
            
        except Exception as e:
            print(f"❌ Error retrieving chunks: {e}")
            return []
    
    def build_prompt(self, question: str, level: str = "textbook") -> str:
        """
        Build a prompt based on the question and level.
        
        Args:
            question: The user's question
            level: The answer level (textbook, detailed, advanced)
            
        Returns:
            The complete prompt string
        """
        question = str(question).strip()
        prompt_prefix = self.PROMPTS.get(level, self.PROMPTS["textbook"])
        return f"{prompt_prefix} {question}"
    
    # ✅ UPDATED: Enhanced textbook answer generation with fallback handling
    def generate_textbook_answer(self, message: str, history: List[Dict] = None) -> Dict[str, Any]:
        """Generate answer using textbook retrieval with enhanced validation."""
        # Retrieve chunks with level-aware logic
        chunks = self.retrieve_chunks(message, "textbook")
        
        # ✅ Fallback handling: If no chunks returned at all
        if not chunks:
            return {
                "success": False,
                "answer": f"Sorry, I couldn't find any relevant content in the textbook for: {message}",
                "suggested_questions": []
            }
        
        # ✅ Early check for textbook mode: content must be present
        if not any(message.lower() in chunk.page_content.lower() for chunk in chunks):
            return {
                "success": False,
                "answer": f"No relevant textbook content found for: {message}",
                "suggested_questions": []
            }
        
        # Generate answer using conversation chain if available
        if self.conversation_chain:
            try:
                result = self.conversation_chain.invoke({
                    "question": message,
                    "chat_history": history or []
                })
                return {
                    "success": True,
                    "answer": result["answer"],
                    "suggested_questions": self.generate_suggested_questions(result["answer"])
                }
            except Exception as e:
                print(f"❌ Error with conversation chain: {e}")
                return {
                    "success": False,
                    "answer": "Error processing your question with the textbook content.",
                    "suggested_questions": []
                }
        else:
            # Fallback: construct answer from chunks directly
            context = "\n\n".join([chunk.page_content for chunk in chunks])
            prompt = f"{self.PROMPTS['textbook']}\n\nContext: {context}\n\nQuestion: {message}"
            
            try:
                response = self.llm.invoke(prompt)
                answer = response.content.strip()
                return {
                    "success": True,
                    "answer": answer,
                    "suggested_questions": self.generate_suggested_questions(answer)
                }
            except Exception as e:
                print(f"❌ Error generating textbook answer: {e}")
                return {
                    "success": False,
                    "answer": "Error generating answer from textbook content.",
                    "suggested_questions": []
                }
    
    def generate_detailed_answer(self, message: str, base_answer: str = None) -> str:
        """Generate a more detailed explanation."""
        # Retrieve chunks for detailed level
        chunks = self.retrieve_chunks(message, "detailed")
        
        if not chunks:
            return "Sorry, I couldn't find enough content to provide a detailed explanation."
        
        # Use chunks as context for detailed explanation
        context = "\n\n".join([chunk.page_content for chunk in chunks])
        
        try:
            detailed_prompt = f"""{self.PROMPTS['detailed']}

Context from textbook:
{context}

Question: {message}"""
            
            response = self.llm.invoke(detailed_prompt)
            return response.content.strip()
        except Exception as e:
            print(f"❌ Error generating detailed answer: {e}")
            return "Error generating detailed explanation."
    
    def generate_advanced_answer(self, message: str) -> str:
        """Generate an advanced explanation with deep context."""
        # Retrieve chunks for advanced level
        chunks = self.retrieve_chunks(message, "advanced")
        
        # For advanced level, we can work with or without chunks
        context = ""
        if chunks:
            context = f"\n\nTextbook reference:\n" + "\n\n".join([chunk.page_content for chunk in chunks])
        
        try:
            advanced_prompt = f"""{self.PROMPTS['advanced']}

Question: {message}{context}"""
            
            response = self.llm.invoke(advanced_prompt)
            return response.content.strip()
        except Exception as e:
            print(f"❌ Error generating advanced answer: {e}")
            return "Error generating advanced explanation."
    
    # ✅ UPDATED: Main answer generation with enhanced error handling
    def generate_answer(self, message: str, level: str = "textbook", history: List[Dict] = None) -> str:
        """
        Main method to generate answers based on level.
        
        Args:
            message: The user's question
            level: The answer level (textbook, detailed, advanced)
            history: Chat history
            
        Returns:
            The generated answer
        """
        if not message or len(message.strip()) < 4:
            return "Please provide a valid question."
        
        print(f"📩 User question: {message}")
        print(f"🎯 Level: {level}")
        
        try:
            if level == "textbook":
                print("📘 Using textbook retriever with validation")
                result = self.generate_textbook_answer(message, history)
                if not result.get("success", True):
                    return result["answer"]  # Return error message
                return result["answer"]
            
            elif level == "detailed":
                print("📗 Generating detailed explanation")
                return self.generate_detailed_answer(message)
            
            elif level == "advanced":
                print("📕 Generating advanced explanation")
                return self.generate_advanced_answer(message)
            
            else:
                return "Invalid level specified. Please use 'textbook', 'detailed', or 'advanced'."
                
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return f"⚠️ Something went wrong: {str(e)}"
    
    def generate_suggested_questions(self, content: str, count: int = 3) -> List[str]:
        """
        Generate suggested follow-up questions based on the content.
        
        Args:
            content: The content to base suggestions on
            count: Number of questions to generate
            
        Returns:
            List of suggested questions
        """
        try:
            prompt = self.SUGGEST_QUESTIONS_PROMPT.format(content=str(content).strip())
            
            response = self.llm.invoke(prompt)
            suggestions = response.content.strip().split("\n")
            cleaned = [s.strip(" -•123.").strip() for s in suggestions if s.strip() and len(s.strip()) > 5]
            
            # Ensure we have exactly the requested count
            while len(cleaned) < count:
                cleaned.append("")
            
            return cleaned[:count]
            
        except Exception as e:
            print(f"Error generating suggestions: {str(e)}")
            return [""] * count
    
    # File operations
    def save_chat_to_file(self, history: List[Dict]) -> str:
        """Save chat history to a JSON file."""
        try:
            # Try multiple possible paths for saved_chats directory
            possible_paths = [
                "../../../saved_chats",  # From backend/core/services/
                "../../saved_chats",     # From backend/core/
                "../saved_chats",        # From backend/
                "saved_chats"            # From root/current directory
            ]
            
            output_dir = "saved_chats"  # Default fallback
            for path in possible_paths:
                parent_dir = os.path.dirname(path) if os.path.dirname(path) else "."
                if os.path.exists(parent_dir):
                    output_dir = path
                    break
            os.makedirs(output_dir, exist_ok=True)
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"Buddy_Chat_{timestamp}.json"
            filepath = os.path.join(output_dir, filename)
            
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
            
            print("📁 Saved file to:", filepath)
            return filepath
            
        except Exception as e:
            print(f"❌ Error saving chat: {e}")
            return ""
    
    def load_chat_from_file(self, filepath: str) -> List[Dict]:
        """Load chat history from a JSON file."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                history = json.load(f)
            
            if isinstance(history, list):
                if all(isinstance(pair, list) and len(pair) == 2 for pair in history):
                    # Convert from [user, assistant] format to dict format
                    message_format = []
                    for pair in history:
                        message_format.append({"role": "user", "content": pair[0]})
                        message_format.append({"role": "assistant", "content": pair[1]})
                    return message_format
                elif all(isinstance(m, dict) and "role" in m and "content" in m for m in history):
                    return history
            
            print("⚠️ Unsupported format in loaded chat")
            return []
            
        except Exception as e:
            print(f"❌ Error loading chat file: {e}")
            return []
    
    # ✅ UPDATED: Enhanced main interface method
    def get_chat_response(self, message: str, level: str = "textbook", history: List[Dict] = None) -> Dict[str, Any]:
        """
        Get a complete chat response including answer and suggested questions.
        
        Args:
            message: The user's question
            level: The answer level
            history: Chat history
            
        Returns:
            Dictionary containing answer and suggested questions
        """
        # For textbook level, use the enhanced method that returns structured response
        if level == "textbook":
            result = self.generate_textbook_answer(message, history)
            if not result.get("success", True):
                return {
                    "answer": result["answer"],
                    "suggested_questions": [],
                    "level": level,
                    "success": False
                }
            return {
                "answer": result["answer"],
                "suggested_questions": result["suggested_questions"],
                "level": level,
                "success": True
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
    
    # Utility methods
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
    """Convenience function to search the knowledge base."""
    return llm_service.retrieve_chunks(query, level)
