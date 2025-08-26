#!/usr/bin/env python3
"""
Rebuild textbook vector database with OpenAI embeddings.
This script creates a fresh vector database using the current OpenAI embeddings.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Load environment variables
load_dotenv()

def create_textbook_vector_db():
    """Create a fresh textbook vector database with OpenAI embeddings."""
    
    # Check for OpenAI API key
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        print("❌ OPENAI_API_KEY not found in environment!")
        return False
    
    # Find textbook PDF
    textbook_paths = [
        "../../knowledge-base/textbook.pdf",
        "../knowledge-base/textbook.pdf", 
        "knowledge-base/textbook.pdf",
        "../../../knowledge-base/textbook.pdf"
    ]
    
    textbook_path = None
    for path in textbook_paths:
        if os.path.exists(path):
            textbook_path = path
            print(f"✅ Found textbook at: {path}")
            break
    
    if not textbook_path:
        print("❌ Textbook PDF not found!")
        return False
    
    # Initialize OpenAI embeddings
    embed_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
    embeddings = OpenAIEmbeddings(model=embed_model, openai_api_key=openai_api_key)
    print(f"✅ Using OpenAI embeddings: {embed_model}")
    
    # Load and split textbook
    try:
        loader = PyPDFLoader(textbook_path)
        pages = loader.load()
        print(f"✅ Loaded {len(pages)} pages from textbook")
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        
        chunks = text_splitter.split_documents(pages)
        print(f"✅ Created {len(chunks)} chunks")
        
        # Add metadata
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                'source': 'textbook.pdf',
                'chunk_id': i,
                'page_number': chunk.metadata.get('page', 0) + 1
            })
        
        # Create vector database
        db_path = "../../textbook_vector_db"
        if os.path.exists(db_path):
            import shutil
            shutil.rmtree(db_path)
            print(f"🗑️ Removed old database at: {db_path}")
        
        # Create new database
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=db_path
        )
        
        # Persist the database
        vectorstore.persist()
        print(f"✅ Created new vector database at: {db_path}")
        print(f"✅ Database contains {len(chunks)} chunks with OpenAI embeddings")
        
        # Test the database
        test_results = vectorstore.similarity_search("solar system", k=1)
        print(f"🧪 Test query successful: found {len(test_results)} results")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating vector database: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Rebuilding textbook vector database with OpenAI embeddings...")
    success = create_textbook_vector_db()
    if success:
        print("✅ Vector database rebuild completed successfully!")
    else:
        print("❌ Vector database rebuild failed!")
        sys.exit(1)
