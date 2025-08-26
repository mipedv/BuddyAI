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
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from openai import OpenAI

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
        # Predefine routing/config to avoid attribute errors if init partially fails
        self.mode_config: Dict[str, Any] = {}
        self.task_router: Dict[str, Any] = {}
        self._validate_environment()
        self._initialize_core_components()
        self._initialize_prompts()
        self._initialize_textbook_vector_store()
    
    def _validate_environment(self):
        """Validate required environment variables (OpenAI only)."""
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not set.")
    
    def _initialize_core_components(self):
        """Initialize LLM, embeddings, and memory components."""
        # Initialize embeddings (OpenAI only)
        oa_embed_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        self.embeddings = OpenAIEmbeddings(model=oa_embed_model, openai_api_key=self.openai_api_key)
        
        # Initialize LLM with different temperatures for different modes
        base_url = os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1"
        self.llm_textbook = ChatOpenAI(
            temperature=0.1,
            model=os.getenv("LLM_MODEL_TEXTBOOK") or "gpt-4o-mini",
            openai_api_key=self.openai_api_key,
            base_url=base_url,
        )
        self.llm_detailed = ChatOpenAI(
            temperature=0.3,
            model=os.getenv("LLM_MODEL_DETAILED") or "gpt-4o-mini",
            openai_api_key=self.openai_api_key,
            base_url=base_url,
        )
        self.llm_advanced = ChatOpenAI(
            temperature=0.7, 
            model=os.getenv("LLM_MODEL_ADVANCED") or "gpt-4o",
            openai_api_key=self.openai_api_key,
            base_url=base_url,
        )
        
        # Task routing for providers/models per feature (using real OpenAI models)
        self.task_router = {
            "chat": {
                "textbook": {"provider": "openai", "model": os.getenv("LLM_MODEL_TEXTBOOK") or "gpt-4o-mini"},
                "detailed": {"provider": "openai", "model": os.getenv("LLM_MODEL_DETAILED") or "gpt-4o-mini"},
                "advanced": {"provider": "openai", "model": os.getenv("LLM_MODEL_ADVANCED") or "gpt-4o"},
            },
            "practice": {
                "generation": {"provider": "openai", "model": os.getenv("LLM_MODEL_PRACTICE_GEN") or "gpt-4o-mini"},
                "scoring": {"provider": "openai", "model": os.getenv("LLM_MODEL_PRACTICE_SCORE") or "gpt-4o-mini"},
            },
        }
        
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
        
        # Mode-specific configurations (used for chunk limits and status)
        self.mode_config = {
            "textbook": {
                "max_chunks": 3,
                "llm": self.llm_textbook,
                "strict_textbook_only": True,
                "description": "Uses ONLY textbook.pdf content",
            },
            "detailed": {
                "max_chunks": 4,
                "llm": self.llm_detailed,
                "strict_textbook_only": False,
                "description": "Uses textbook + LLM enhancement",
            },
            "advanced": {
                "max_chunks": 2,
                "llm": self.llm_advanced,
                "strict_textbook_only": False,
                "description": "Uses primarily LLM knowledge",
            },
        }

    def _openai_client(self) -> OpenAI:
        """Create OpenAI client (OpenAI only)."""
        api_key = self.openai_api_key
        base_url = os.getenv("OPENAI_API_BASE") or "https://api.openai.com/v1"
        return OpenAI(api_key=api_key, base_url=base_url)

    def _openai_chat(self, model: str, system: str, messages: list[dict], *, max_output_tokens: int, temperature: float = 0.2, top_p: float = 1.0) -> str:
        """Unified chat call with retry and fallback from gpt-4o → gpt-4o-mini.
        Uses max_tokens for all current OpenAI models.
        """
        client = self._openai_client()
        attempt_models = [model]
        if model == "gpt-4o":
            attempt_models.append("gpt-4o-mini")
        last_err: Optional[Exception] = None
        for m in attempt_models:
            for attempt in range(3):
                try:
                    token_key = "max_tokens"  # Standard for all current OpenAI models
                    payload = {
                        "model": m,
                        "messages": ([{"role": "system", "content": system}] + messages),
                        "temperature": temperature,
                        "top_p": top_p,
                        token_key: max_output_tokens,
                    }
                    print(f"LLM call → provider=openai model={m} mtok={max_output_tokens}")
                    resp = client.chat.completions.create(**payload)
                    return (resp.choices[0].message.content or "").strip()
                except Exception as e:
                    last_err = e
                    msg = str(e)
                    # Fallback for providers that don't accept max_tokens (e.g., some OpenRouter models)
                    if "Unsupported parameter" in msg and ("max_tokens" in msg or "max_completion_tokens" in msg):
                        try:
                            payload_no_max = {
                                "model": m,
                                "messages": ([{"role": "system", "content": system}] + messages),
                                "temperature": temperature,
                                "top_p": top_p,
                            }
                            print(f"LLM call → retry without max_tokens provider=openai model={m}")
                            resp = client.chat.completions.create(**payload_no_max)
                            return (resp.choices[0].message.content or "").strip()
                        except Exception as e2:
                            last_err = e2
                    if any(code in msg for code in ["429", "500", "502", "503", "504"]):
                        import time
                        time.sleep(0.5 * (attempt + 1))
                        continue
                    break
        raise RuntimeError(f"LLM chat failed for model {model}: {last_err}")
    
    def _initialize_prompts(self):
        """Initialize strict prompt templates for different answer levels."""
        self.PROMPTS = {
            "textbook": """
You are a teaching assistant. Give a short, precise, structured answer using only the textbook content provided.
Output format (plain text, no Markdown) exactly as follows:

Answer:
[one-line definition]

Key Points:
1. First fact (short sentence).
2. Second fact (short sentence).
3. Third fact (short sentence).

Rules:
- Do NOT use Markdown symbols like ##, ###, or **bold**.
- Always use "Answer:" and "Key Points:" as plain text headings.
- Keep answers short and factual; no long paragraphs.

Context (use only this):
{context}

Question: {question}
""",
            "detailed": """
You are a teacher explaining to middle school students. Expand on the textbook content in a clear and engaging way.
Output format (plain text, no Markdown) exactly as follows:

Answer:
[2–3 sentences introduction]

Key Components:
1. Concept 1 → explained simply in 2–3 lines.
2. Concept 2 → explained simply in 2–3 lines.
3. Concept 3 → add a fun fact or real-life example.

How It Works:
- Bullet 1
- Bullet 2
- Bullet 3

Rules:
- Do NOT use Markdown symbols like ##, ###, or **bold**.
- Use plain headings like "Answer:", "Key Components:", "How It Works:".
- Keep paragraphs max 3 lines.

Context (use only this):
{context}

Question: {question}
""",
            "advanced": """
You are an expert science explainer. Provide a deep, structured answer while still keeping it readable.
Output format (plain text, no Markdown) exactly as follows:

Advanced Explanation:

Scientific View:
- Point 1
- Point 2

Historical Context:
- Point 1
- Point 2

Real-World Applications:
- Point 1
- Point 2

Conclusion:
[2 short sentences]

Rules:
- Do NOT use Markdown symbols like ##, ###, or **bold**.
- Always use plain headings exactly as shown: "Scientific View:", "Historical Context:", etc.
- Keep content structured with bullets; avoid long paragraphs.

Context (use only this):
{context}

Question: {question}
"""
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
            model = self.task_router["chat"]["textbook"]["model"]
            answer = self._openai_chat(
                model=model,
                system="You are a strict textbook assistant.",
                messages=[{"role": "user", "content": prompt}],
                max_output_tokens=int(os.getenv("LLM_MAX_TOKENS_ANSWER", "850")),
            )
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
            
            model = self.task_router["chat"]["detailed"]["model"]
            return self._openai_chat(
                model=model,
                system="You improve textbook explanations for students.",
                messages=[{"role": "user", "content": prompt}],
                max_output_tokens=int(os.getenv("LLM_MAX_TOKENS_ANSWER", "850")),
            )
            
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
            
            model = self.task_router["chat"]["advanced"]["model"]
            return self._openai_chat(
                model=model,
                system="You are an advanced science educator.",
                messages=[{"role": "user", "content": prompt}],
                max_output_tokens=int(os.getenv("LLM_MAX_TOKENS_ANSWER", "900")),
            )
            
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
                raise ValueError(f"Invalid level '{level}'. Please use 'textbook', 'detailed', or 'advanced'.")
                
        except Exception as e:
            print(f"❌ ERROR in {level} mode: {e}")
            return f"Error generating {level} explanation. Please try again."
    
    def generate_suggested_questions(self, context: str) -> List[str]:
        """Generate suggested questions using OpenAI with smart fallback."""
        try:
            if not context or len(context) < 30:
                return self._get_fallback_questions()

            system = "You generate concise, specific follow-up questions for students. Output strict JSON array of 3 strings."
            prompt = (
                "Given this educational content, produce exactly 3 follow-up questions a middle school student might ask to learn more. "
                "- Keep each under 120 characters. - End with a question mark. - Be specific to the content.\n\n"
                f"Content:\n{context[:800]}\n\nReturn JSON array only, e.g., [\"Q1?\", \"Q2?\", \"Q3?\"]."
            )
            print(f"🔍 Generating suggested questions for context: {context[:100]}...")
            response = self.llm_detailed.invoke(prompt)
            raw = response.content
            print(f"📝 Raw response: {raw[:200]}...")
            try:
                data = json.loads(raw)
                questions = [q.strip() for q in data if isinstance(q, str)]
            except Exception:
                lines = [line.strip() for line in raw.split('\n') if line.strip()]
                questions = []
                for line in lines:
                    clean = line
                    for prefix in ['1.', '2.', '3.', '-', '•', '*']:
                        if clean.startswith(prefix):
                            clean = clean[len(prefix):].strip()
                    if clean and not clean.endswith('?'):
                        clean += '?'
                    if 10 < len(clean) < 150:
                        questions.append(clean)
            if len(questions) >= 3:
                return questions[:3]
            # Heuristic fallback: build context-specific questions from keywords
            import re
            words = [w.lower() for w in re.findall(r"[A-Za-z][A-Za-z\-]{2,}", context)][:400]
            stop = {
                "the","and","that","with","from","this","these","those","into","about","which","their","there","have","has","will","would","could","should","for","are","was","were","been","being","than","then","also","such","other","more","most","very","over","under","between","within","without","using","use","used","based","including","example","examples","because","while","when","where","what","why","how"
            }
            keywords = [w for w in words if w not in stop]
            topic = keywords[0] if keywords else "this topic"
            rel = keywords[1] if len(keywords) > 1 else topic
            extra = keywords[2] if len(keywords) > 2 else rel
            heuristic = [
                f"Can you explain {topic} in more detail?",
                f"How does {topic} relate to {rel}?",
                f"What are the key factors that influence {extra}?",
            ]
            while len(heuristic) < 3:
                heuristic.append(self._get_fallback_questions()[len(heuristic)])
            return heuristic[:3]
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
            "routing": self.task_router,
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