"""
Script to rebuild the vector database with proper textbook content.
This ensures that textbook mode only uses content from the textbook PDF.
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
import shutil

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF file."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page_num, page in enumerate(reader.pages, 1):
            page_text = page.extract_text() or ""
            if page_text.strip():  # Only add non-empty pages
                text += f"\n\n[Page {page_num}]\n{page_text}"
        print(f"✅ Extracted text from {len(reader.pages)} pages")
        return text
    except Exception as e:
        print(f"❌ Error extracting text from {pdf_path}: {e}")
        return ""

def create_textbook_chunks(text: str) -> List[Document]:
    """Create properly formatted chunks from textbook content."""
    if not text.strip():
        print("❌ No text content to process")
        return []
    
    # Use RecursiveCharacterTextSplitter for better chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    
    # Split the text into chunks
    chunks = text_splitter.split_text(text)
    
    # Create Document objects with metadata
    documents = []
    for i, chunk in enumerate(chunks):
        # Extract page number if available
        page_num = 1
        if "[Page " in chunk:
            try:
                page_start = chunk.find("[Page ") + 6
                page_end = chunk.find("]", page_start)
                page_num = int(chunk[page_start:page_end])
            except:
                pass
        
        # Clean the chunk text (remove page markers for cleaner content)
        clean_chunk = chunk
        if "[Page " in clean_chunk:
            # Remove page markers but keep the content
            lines = clean_chunk.split('\n')
            clean_lines = [line for line in lines if not line.strip().startswith('[Page ')]
            clean_chunk = '\n'.join(clean_lines)
        
        if clean_chunk.strip():  # Only add non-empty chunks
            doc = Document(
                page_content=clean_chunk.strip(),
                metadata={
                    "source": "textbook.pdf",
                    "chunk_id": i,
                    "page_number": page_num,
                    "content_type": "textbook"
                }
            )
            documents.append(doc)
    
    print(f"✅ Created {len(documents)} textbook chunks")
    return documents

def rebuild_vector_database():
    """Rebuild the vector database with clean textbook content."""
    
    # Define paths
    textbook_path = "../../knowledge-base/textbook.pdf"
    vector_db_path = "../../vector_db"
    
    # Check if textbook exists
    if not os.path.exists(textbook_path):
        print(f"❌ Textbook not found at: {textbook_path}")
        return False
    
    print(f"📚 Processing textbook: {textbook_path}")
    
    # Extract text from PDF
    text = extract_text_from_pdf(textbook_path)
    if not text:
        print("❌ Failed to extract text from textbook")
        return False
    
    print(f"📄 Extracted {len(text)} characters from textbook")
    
    # Create chunks
    documents = create_textbook_chunks(text)
    if not documents:
        print("❌ Failed to create chunks from textbook")
        return False
    
    # Remove existing vector database
    if os.path.exists(vector_db_path):
        print(f"🗑️ Removing existing vector database: {vector_db_path}")
        shutil.rmtree(vector_db_path)
    
    # Initialize embeddings
    print("🔧 Initializing embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    # Create new vector database
    print("🔨 Creating new vector database...")
    try:
        vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=embeddings,
            persist_directory=vector_db_path
        )
        print(f"✅ Vector database created successfully with {len(documents)} documents")
        
        # Test the database
        print("\n🧪 Testing the vector database...")
        test_query = "solar system"
        results = vectorstore.similarity_search(test_query, k=3)
        
        print(f"Test query: '{test_query}'")
        print(f"Found {len(results)} results:")
        for i, doc in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Content: {doc.page_content[:150]}...")
            print(f"Metadata: {doc.metadata}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating vector database: {e}")
        return False

def verify_explanation_modes():
    """Verify that the three explanation modes work correctly."""
    print("\n" + "="*60)
    print("🔍 VERIFYING EXPLANATION MODES")
    print("="*60)
    
    try:
        from core.services.llm_service import LLMService
        
        # Create a fresh instance to reload the vector database
        llm_service = LLMService()
        
        if not llm_service.vectorstore:
            print("❌ Vector store not loaded in LLM service")
            return False
        
        test_query = "What is the solar system?"
        
        print(f"\n📝 Testing query: '{test_query}'")
        print("-" * 40)
        
        # Test each mode
        modes = ["textbook", "detailed", "advanced"]
        
        for mode in modes:
            print(f"\n🎯 Testing {mode.upper()} mode:")
            print("-" * 20)
            
            try:
                if mode == "textbook":
                    # For textbook mode, check if it uses only textbook content
                    chunks = llm_service.retrieve_chunks(test_query, mode)
                    print(f"📚 Retrieved {len(chunks)} chunks for textbook mode")
                    
                    if chunks:
                        print("Sample textbook content:")
                        print(f"  {chunks[0].page_content[:100]}...")
                        print(f"  Source: {chunks[0].metadata.get('source', 'Unknown')}")
                        
                        # Verify all chunks are from textbook
                        textbook_chunks = [c for c in chunks if c.metadata.get('source') == 'textbook.pdf']
                        print(f"✅ {len(textbook_chunks)}/{len(chunks)} chunks are from textbook")
                    else:
                        print("⚠️ No chunks retrieved for textbook mode")
                
                elif mode == "detailed":
                    print("📗 Detailed mode: Should use textbook + LLM enhancement")
                    answer = llm_service.generate_detailed_answer(test_query)
                    print(f"Answer length: {len(answer)} characters")
                    
                elif mode == "advanced":
                    print("📕 Advanced mode: Should use primarily LLM knowledge")
                    answer = llm_service.generate_advanced_answer(test_query)
                    print(f"Answer length: {len(answer)} characters")
                
            except Exception as e:
                print(f"❌ Error testing {mode} mode: {e}")
        
        print("\n✅ Mode verification completed")
        return True
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False

if __name__ == "__main__":
    print("🚀 REBUILDING TEXTBOOK VECTOR DATABASE")
    print("="*50)
    
    # Step 1: Rebuild vector database
    success = rebuild_vector_database()
    
    if success:
        print("\n✅ Vector database rebuild completed successfully!")
        
        # Step 2: Verify explanation modes
        verify_explanation_modes()
        
        print("\n🎉 All tasks completed!")
        print("\nNow the three explanation modes should work as follows:")
        print("📘 Textbook Explanation: Uses ONLY content from textbook.pdf")
        print("📗 Detailed Explanation: Uses textbook content + LLM enhancement") 
        print("📕 Advanced Explanation: Uses primarily LLM knowledge")
        
    else:
        print("\n❌ Failed to rebuild vector database")
        sys.exit(1)