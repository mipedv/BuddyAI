"""
Configuration for textbook-only RAG system.
Updated to use the new textbook vector database.
"""

# Vector database path for textbook content
TEXTBOOK_VECTOR_DB_PATH = "../../textbook_vector_db"

# Mode configurations
MODE_CONFIG = {
    "textbook": {
        "description": "Uses ONLY content from textbook.pdf",
        "max_chunks": 3,
        "temperature": 0.1,  # Very low for accuracy
        "strict_mode": True
    },
    "detailed": {
        "description": "Uses textbook content + LLM enhancement", 
        "max_chunks": 4,
        "temperature": 0.3,
        "strict_mode": False
    },
    "advanced": {
        "description": "Uses primarily LLM knowledge",
        "max_chunks": 2,
        "temperature": 0.7,
        "strict_mode": False
    }
}

# Validation rules
TEXTBOOK_MODE_RULES = [
    "Use ONLY information from retrieved textbook chunks",
    "Do not add external knowledge",
    "If textbook content is insufficient, state so clearly",
    "Keep answers simple and textbook-accurate",
    "Use exact terminology from the textbook"
]
