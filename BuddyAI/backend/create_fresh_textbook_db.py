"""
Create a fresh vector database with textbook content only.
This will create a new database in a different location to avoid conflicts.
"""

import os
import sys
from pathlib import Path
from typing import List, Dict

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from PyPDF2 import PdfReader
from langchain.schema import Document
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

def extract_textbook_content():
    """Extract and process textbook content."""
    textbook_path = "../../knowledge-base/textbook.pdf"
    
    if not os.path.exists(textbook_path):
        print(f"❌ Textbook not found at: {textbook_path}")
        return []
    
    try:
        print("📚 Processing textbook...")
        reader = PdfReader(textbook_path)
        
        all_text = ""
        for page_num, page in enumerate(reader.pages, 1):
            page_text = page.extract_text() or ""
            if page_text.strip():
                all_text += f"\n\n--- Page {page_num} ---\n{page_text}"
        
        print(f"✅ Extracted {len(all_text)} characters from {len(reader.pages)} pages")
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=150,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        
        chunks = text_splitter.split_text(all_text)
        
        # Create documents with proper metadata
        documents = []
        for i, chunk in enumerate(chunks):
            # Extract page number
            page_num = 1
            if "--- Page " in chunk:
                try:
                    page_start = chunk.find("--- Page ") + 9
                    page_end = chunk.find(" ---", page_start)
                    page_num = int(chunk[page_start:page_end])
                except:
                    pass
            
            # Clean chunk (remove page markers)
            clean_chunk = chunk
            while "--- Page " in clean_chunk:
                start = clean_chunk.find("--- Page ")
                end = clean_chunk.find(" ---", start) + 4
                clean_chunk = clean_chunk[:start] + clean_chunk[end:]
            
            clean_chunk = clean_chunk.strip()
            
            if clean_chunk and len(clean_chunk) > 50:  # Only meaningful chunks
                doc = Document(
                    page_content=clean_chunk,
                    metadata={
                        "source": "textbook.pdf",
                        "chunk_id": i,
                        "page_number": page_num,
                        "content_type": "textbook",
                        "topic": "science"
                    }
                )
                documents.append(doc)
        
        print(f"✅ Created {len(documents)} textbook chunks")
        
        # Show sample chunks
        print("\n📖 Sample textbook chunks:")
        for i, doc in enumerate(documents[:3]):
            print(f"Chunk {i+1} (Page {doc.metadata['page_number']}):")
            print(f"  {doc.page_content[:100]}...")
            print()
        
        return documents
        
    except Exception as e:
        print(f"❌ Error processing textbook: {e}")
        return []

def create_textbook_vector_db():
    """Create a fresh vector database with textbook content."""
    
    # Get textbook documents
    documents = extract_textbook_content()
    if not documents:
        print("❌ No textbook content to process")
        return False
    
    # Create new vector database path
    new_db_path = "../../textbook_vector_db"
    
    # Remove existing if exists
    if os.path.exists(new_db_path):
        import shutil
        try:
            shutil.rmtree(new_db_path)
            print(f"🗑️ Removed existing database at {new_db_path}")
        except Exception as e:
            print(f"⚠️ Could not remove existing database: {e}")
    
    # Initialize embeddings
    print("🔧 Initializing embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    # Create vector database
    print("🔨 Creating textbook vector database...")
    try:
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=embeddings,
            persist_directory=new_db_path
        )
        
        print(f"✅ Textbook vector database created successfully!")
        print(f"📍 Location: {new_db_path}")
        print(f"📊 Documents: {len(documents)}")
        
        # Test the database
        print("\n🧪 Testing the database...")
        test_queries = ["solar system", "planets", "sun", "earth"]
        
        for query in test_queries:
            results = vectorstore.similarity_search(query, k=2)
            print(f"\nQuery: '{query}' -> {len(results)} results")
            for i, result in enumerate(results):
                print(f"  {i+1}. {result.page_content[:80]}...")
                print(f"      (Page {result.metadata['page_number']})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating vector database: {e}")
        return False

def update_llm_service_config():
    """Create a configuration file for the new textbook database."""
    
    config_content = '''"""
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
'''
    
    config_path = "textbook_config.py"
    
    with open(config_path, 'w') as f:
        f.write(config_content)
    
    print(f"✅ Created configuration file: {config_path}")

def main():
    """Main function to create fresh textbook database."""
    
    print("🚀 CREATING FRESH TEXTBOOK VECTOR DATABASE")
    print("="*60)
    
    # Step 1: Create textbook vector database
    success = create_textbook_vector_db()
    
    if success:
        # Step 2: Create configuration
        update_llm_service_config()
        
        print("\n🎉 SUCCESS!")
        print("="*40)
        print("✅ Fresh textbook vector database created")
        print("✅ Configuration file generated")
        print("\n📝 NEXT STEPS:")
        print("1. Update the LLM service to use the new database path")
        print("2. Implement strict mode enforcement for textbook mode")
        print("3. Test all three explanation modes")
        print("\n📍 New database location: ../../textbook_vector_db")
        print("📚 Content: 24 pages of science textbook about space/solar system")
        
    else:
        print("\n❌ Failed to create textbook database")

if __name__ == "__main__":
    main()