"""
Script to ensure textbook RAG is working properly with the existing vector database.
Instead of rebuilding, we'll verify and enhance the current setup.
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

def analyze_textbook_content():
    """Analyze the textbook PDF to understand its content."""
    textbook_path = "../../knowledge-base/textbook.pdf"
    
    if not os.path.exists(textbook_path):
        print(f"❌ Textbook not found at: {textbook_path}")
        return None
    
    try:
        reader = PdfReader(textbook_path)
        print(f"📚 TEXTBOOK ANALYSIS")
        print("="*50)
        print(f"📄 Total pages: {len(reader.pages)}")
        
        # Extract some sample content
        sample_content = []
        for page_num in range(min(3, len(reader.pages))):
            page_text = reader.pages[page_num].extract_text() or ""
            if page_text.strip():
                sample_content.append(f"Page {page_num + 1}: {page_text[:200]}...")
        
        print("📖 Sample content from first few pages:")
        for content in sample_content:
            print(f"  {content}")
        
        # Look for key topics
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""
        
        key_topics = ["solar system", "planet", "sun", "moon", "earth", "mars", "jupiter"]
        found_topics = [topic for topic in key_topics if topic.lower() in full_text.lower()]
        
        print(f"\n🔍 Found topics in textbook: {', '.join(found_topics)}")
        
        return {
            "pages": len(reader.pages),
            "content_length": len(full_text),
            "found_topics": found_topics,
            "sample_text": full_text[:1000]
        }
        
    except Exception as e:
        print(f"❌ Error analyzing textbook: {e}")
        return None

def check_current_vector_database():
    """Check what's currently in the vector database."""
    print(f"\n📊 VECTOR DATABASE ANALYSIS")
    print("="*50)
    
    vector_db_path = "../../vector_db"
    
    if not os.path.exists(vector_db_path):
        print("❌ Vector database not found")
        return None
    
    try:
        # Initialize embeddings
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        # Load existing vector store
        vectorstore = Chroma(
            persist_directory=vector_db_path,
            embedding_function=embeddings
        )
        
        # Get basic info
        try:
            collection = vectorstore._collection
            doc_count = collection.count()
            print(f"📈 Total documents in vector database: {doc_count}")
        except Exception as e:
            print(f"⚠️ Could not get document count: {e}")
        
        # Test queries related to textbook content
        test_queries = [
            "solar system",
            "planets",
            "sun",
            "earth"
        ]
        
        print("\n🧪 Testing retrieval with textbook-related queries:")
        
        results_summary = {}
        for query in test_queries:
            try:
                results = vectorstore.similarity_search(query, k=3)
                print(f"\n📝 Query: '{query}'")
                print(f"   Found {len(results)} results")
                
                for i, doc in enumerate(results):
                    source = doc.metadata.get('source', 'Unknown')
                    content_preview = doc.page_content[:100].replace('\n', ' ')
                    print(f"   Result {i+1}: {content_preview}... (Source: {source})")
                
                results_summary[query] = {
                    "count": len(results),
                    "sources": [doc.metadata.get('source', 'Unknown') for doc in results]
                }
                
            except Exception as e:
                print(f"   ❌ Error searching for '{query}': {e}")
                results_summary[query] = {"error": str(e)}
        
        return {
            "vectorstore": vectorstore,
            "results_summary": results_summary
        }
        
    except Exception as e:
        print(f"❌ Error checking vector database: {e}")
        return None

def test_llm_service_modes():
    """Test the three explanation modes with current setup."""
    print(f"\n🎯 TESTING LLM SERVICE MODES")
    print("="*50)
    
    try:
        # Import current LLM service
        from core.services.llm_service import llm_service
        
        # Check service status
        status = llm_service.get_service_status()
        print("🔧 Service Status:")
        for key, value in status.items():
            print(f"   {key}: {value}")
        
        if not llm_service.vectorstore:
            print("❌ Vector store not loaded in LLM service")
            return False
        
        # Test query
        test_query = "What is the solar system?"
        print(f"\n📝 Testing with query: '{test_query}'")
        
        # Test each mode
        modes = ["textbook", "detailed", "advanced"]
        results = {}
        
        for mode in modes:
            print(f"\n🎯 Testing {mode.upper()} mode:")
            print("-" * 30)
            
            try:
                if mode == "textbook":
                    # Test textbook mode specifically
                    result = llm_service.generate_textbook_answer(test_query)
                    print(f"   Success: {result.get('success', 'Unknown')}")
                    print(f"   Answer length: {len(result['answer'])} characters")
                    print(f"   Answer preview: {result['answer'][:150]}...")
                    
                    # Check if textbook chunks were used
                    chunks = llm_service.retrieve_chunks(test_query, "textbook")
                    textbook_chunks = [c for c in chunks if 'textbook' in c.metadata.get('source', '').lower()]
                    print(f"   Textbook chunks used: {len(textbook_chunks)}/{len(chunks)}")
                    
                    results[mode] = {
                        "success": result.get('success'),
                        "answer_length": len(result['answer']),
                        "textbook_chunks": len(textbook_chunks),
                        "total_chunks": len(chunks)
                    }
                
                else:
                    # Test other modes
                    answer = llm_service.generate_answer(test_query, mode)
                    print(f"   Answer length: {len(answer)} characters")
                    print(f"   Answer preview: {answer[:150]}...")
                    
                    results[mode] = {
                        "answer_length": len(answer)
                    }
                
            except Exception as e:
                print(f"   ❌ Error testing {mode} mode: {e}")
                results[mode] = {"error": str(e)}
        
        return results
        
    except Exception as e:
        print(f"❌ Error testing LLM service: {e}")
        return None

def provide_recommendations():
    """Provide recommendations based on analysis."""
    print(f"\n💡 RECOMMENDATIONS")
    print("="*50)
    
    print("Based on the analysis, here are the key points:")
    print()
    print("📘 TEXTBOOK MODE should:")
    print("   ✅ Use ONLY content from textbook.pdf")
    print("   ✅ Return error if textbook content is insufficient")
    print("   ✅ Strictly follow textbook explanations")
    print()
    print("📗 DETAILED MODE should:")
    print("   ✅ Use textbook content as primary source")
    print("   ✅ Enhance with LLM knowledge for clarity")
    print("   ✅ Add examples and analogies")
    print()
    print("📕 ADVANCED MODE should:")
    print("   ✅ Use primarily LLM knowledge")
    print("   ✅ Include scientific reasoning and applications")
    print("   ✅ Go beyond textbook limitations")
    print()
    print("🔧 NEXT STEPS:")
    print("   1. Verify textbook content is properly loaded in vector DB")
    print("   2. Update LLM service to enforce strict mode separation")
    print("   3. Test all modes with various queries")
    print("   4. Ensure textbook mode only uses textbook.pdf content")

def main():
    """Main analysis function."""
    print("🔍 TEXTBOOK RAG ANALYSIS")
    print("="*60)
    
    # Step 1: Analyze textbook content
    textbook_info = analyze_textbook_content()
    
    # Step 2: Check current vector database
    vector_info = check_current_vector_database()
    
    # Step 3: Test LLM service modes
    llm_results = test_llm_service_modes()
    
    # Step 4: Provide recommendations
    provide_recommendations()
    
    # Summary
    print(f"\n📋 SUMMARY")
    print("="*50)
    
    if textbook_info:
        print(f"✅ Textbook analyzed: {textbook_info['pages']} pages, {len(textbook_info['found_topics'])} relevant topics")
    else:
        print("❌ Could not analyze textbook")
    
    if vector_info:
        print("✅ Vector database accessible")
    else:
        print("❌ Vector database issues")
    
    if llm_results:
        print("✅ LLM service tested")
        for mode, result in llm_results.items():
            if "error" in result:
                print(f"   ❌ {mode} mode: {result['error']}")
            else:
                print(f"   ✅ {mode} mode: working")
    else:
        print("❌ LLM service testing failed")

if __name__ == "__main__":
    main()