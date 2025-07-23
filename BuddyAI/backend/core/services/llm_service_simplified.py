"""
Simplified LLM Service - Demonstrates Clean Architecture and Best Practices
"""

import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# LangChain imports
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings

# Load environment variables
load_dotenv()


class LLMService:
    """
    Clean, modular LLM service following best practices.
    Each method has a single responsibility.
    """
    
    def __init__(self):
        """Initialize all components and dependencies."""
        # Validate environment
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment!")
        
        # Initialize core components
        self._initialize_llm()
        self._initialize_embeddings()
        self._initialize_vectorstore()
        
        # Configuration
        self.chunk_retrieval_limit = 5
        self.temperature = 0.7
        
    def _initialize_llm(self):
        """Initialize the language model."""
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            temperature=self.temperature,
            openai_api_key=self.openai_api_key
        )
        
    def _initialize_embeddings(self):
        """Initialize the embedding model."""
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
    def _initialize_vectorstore(self):
        """Initialize the vector store."""
        try:
            self.vectorstore = Chroma(
                persist_directory="./vector_db",
                embedding_function=self.embeddings
            )
            print("✅ Vector store initialized successfully")
        except Exception as e:
            print(f"⚠️ Vector store not available: {e}")
            self.vectorstore = None
    
    # Core functionality methods
    
    def retrieve_chunks(self, query: str, k: int = None) -> List[Document]:
        """
        Retrieve relevant chunks from the vector store.
        
        Args:
            query: The user's question
            k: Number of chunks to retrieve (default: self.chunk_retrieval_limit)
            
        Returns:
            List of relevant document chunks
        """
        if not self.vectorstore:
            print("⚠️ Vector store not available")
            return []
            
        k = k or self.chunk_retrieval_limit
        
        try:
            chunks = self.vectorstore.similarity_search(query, k=k)
            print(f"📚 Retrieved {len(chunks)} chunks for query: {query[:50]}...")
            return chunks
        except Exception as e:
            print(f"❌ Error retrieving chunks: {e}")
            return []
    
    def generate_answer(self, query: str, level: str = "textbook", context_chunks: List[Document] = None) -> str:
        """
        Generate an answer based on the query and level.
        
        Args:
            query: The user's question
            level: Answer complexity level (textbook, detailed, advanced)
            context_chunks: Optional pre-retrieved chunks
            
        Returns:
            Generated answer string
        """
        print(f"🤖 Generating {level} answer for: {query}")
        
        # Retrieve context if not provided
        if context_chunks is None and level == "textbook":
            context_chunks = self.retrieve_chunks(query)
        
        # Build prompt based on level
        prompt = self._build_prompt(query, level, context_chunks)
        
        try:
            # Generate response
            response = self.llm.invoke(prompt)
            answer = response.content.strip()
            
            print(f"✅ Generated {len(answer)} character answer")
            return answer
            
        except Exception as e:
            print(f"❌ Error generating answer: {e}")
            return f"Sorry, I encountered an error: {str(e)}"
    
    def suggest_questions(self, previous_answer: str, count: int = 3) -> List[str]:
        """
        Generate follow-up questions based on the previous answer.
        
        Args:
            previous_answer: The AI's previous response
            count: Number of questions to generate
            
        Returns:
            List of suggested questions
        """
        print(f"💡 Generating {count} follow-up questions")
        
        prompt = f"""
        Based on this answer, suggest {count} interesting follow-up questions a student might ask:
        
        Answer: "{previous_answer[:500]}..."
        
        Return exactly {count} questions, one per line, without numbering.
        """
        
        try:
            response = self.llm.invoke(prompt)
            questions = [
                q.strip().strip("123456789.-• ") 
                for q in response.content.strip().split('\n') 
                if q.strip() and len(q.strip()) > 10
            ]
            
            # Ensure we have exactly the requested count
            while len(questions) < count:
                questions.append("")
            
            result = questions[:count]
            print(f"✅ Generated {len([q for q in result if q])} valid questions")
            return result
            
        except Exception as e:
            print(f"❌ Error generating questions: {e}")
            return [""] * count
    
    # Helper methods
    
    def _build_prompt(self, query: str, level: str, context_chunks: List[Document] = None) -> str:
        """Build the appropriate prompt based on level and context."""
        
        # Level-specific instruction templates
        level_instructions = {
            "textbook": "Answer strictly based on the provided textbook content. Keep it simple and accurate.",
            "detailed": "Explain clearly with examples and analogies. Assume middle school level.",
            "advanced": "Provide deep analysis with scientific reasoning and real-world applications."
        }
        
        instruction = level_instructions.get(level, level_instructions["textbook"])
        
        # Add context if available
        if context_chunks and level == "textbook":
            context = "\n".join([chunk.page_content for chunk in context_chunks])
            return f"""
            {instruction}
            
            Context from textbook:
            {context[:2000]}...
            
            Question: {query}
            """
        else:
            return f"{instruction}\n\nQuestion: {query}"
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get the current status of the service components."""
        return {
            "llm_initialized": self.llm is not None,
            "vectorstore_available": self.vectorstore is not None,
            "embeddings_initialized": self.embeddings is not None,
            "api_key_configured": bool(self.openai_api_key),
        }


# Create singleton instance
llm_service = LLMService()


# Convenience functions for easy access
def get_answer(query: str, level: str = "textbook") -> str:
    """Convenience function to get an answer."""
    return llm_service.generate_answer(query, level)

def get_suggestions(answer: str) -> List[str]:
    """Convenience function to get follow-up questions."""
    return llm_service.suggest_questions(answer)

def search_knowledge(query: str) -> List[Document]:
    """Convenience function to search the knowledge base."""
    return llm_service.retrieve_chunks(query) 