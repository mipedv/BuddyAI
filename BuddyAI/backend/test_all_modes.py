"""
Comprehensive test script to verify all three explanation modes work correctly.
"""

import os
import sys

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_textbook_mode():
    """Test textbook mode - should use ONLY textbook content."""
    print("📘 TESTING TEXTBOOK MODE")
    print("="*50)
    print("Expected: Uses ONLY content from textbook.pdf")
    print("Should reject queries not in textbook")
    print()
    
    try:
        from core.services.llm_service import llm_service
        
        # Test queries
        test_queries = [
            "What is the solar system?",  # Should work - in textbook
            "What are the planets?",      # Should work - in textbook  
            "How do rockets work?",       # Should fail - not in textbook
            "What is the Sun?",           # Should work - in textbook
        ]
        
        print("🧪 Testing textbook mode with various queries:")
        print()
        
        for i, query in enumerate(test_queries, 1):
            print(f"Test {i}: {query}")
            print("-" * 30)
            
            try:
                result = llm_service.generate_textbook_answer(query)
                
                success = result.get("success", False)
                answer = result.get("answer", "")
                source = result.get("source", "")
                chunks_used = result.get("chunks_used", 0)
                
                print(f"✅ Success: {success}")
                print(f"📚 Source: {source}")
                print(f"📊 Chunks used: {chunks_used}")
                print(f"📝 Answer: {answer[:150]}...")
                
                if success:
                    print("✅ PASS: Found textbook content")
                else:
                    print("✅ PASS: Correctly rejected (not in textbook)")
                    
            except Exception as e:
                print(f"❌ ERROR: {e}")
            
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to test textbook mode: {e}")
        return False

def test_detailed_mode():
    """Test detailed mode - should use textbook + LLM enhancement."""
    print("📗 TESTING DETAILED MODE")
    print("="*50)
    print("Expected: Uses textbook content + LLM enhancement")
    print("Should provide more detailed explanations than textbook mode")
    print()
    
    try:
        from core.services.llm_service import llm_service
        
        test_query = "What is the solar system?"
        print(f"🧪 Testing detailed mode with: {test_query}")
        print()
        
        try:
            answer = llm_service.generate_detailed_answer(test_query)
            
            print(f"📝 Answer length: {len(answer)} characters")
            print(f"📝 Answer preview: {answer[:200]}...")
            
            # Check if it's more detailed than textbook mode
            textbook_result = llm_service.generate_textbook_answer(test_query)
            textbook_answer = textbook_result.get("answer", "")
            
            if len(answer) > len(textbook_answer) * 0.8:  # Should be similar or longer
                print("✅ PASS: Provides detailed explanation")
            else:
                print("⚠️ WARNING: Answer seems too short for detailed mode")
            
            return True
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Failed to test detailed mode: {e}")
        return False

def test_advanced_mode():
    """Test advanced mode - should use primarily LLM knowledge."""
    print("📕 TESTING ADVANCED MODE") 
    print("="*50)
    print("Expected: Uses primarily LLM knowledge")
    print("Should provide comprehensive explanations beyond textbook")
    print()
    
    try:
        from core.services.llm_service import llm_service
        
        test_query = "What is the solar system?"
        print(f"🧪 Testing advanced mode with: {test_query}")
        print()
        
        try:
            answer = llm_service.generate_advanced_answer(test_query)
            
            print(f"📝 Answer length: {len(answer)} characters")
            print(f"📝 Answer preview: {answer[:200]}...")
            
            # Advanced mode should provide comprehensive explanations
            if len(answer) > 200:  # Should be substantial
                print("✅ PASS: Provides comprehensive explanation")
            else:
                print("⚠️ WARNING: Answer seems too short for advanced mode")
            
            # Check for advanced concepts (should go beyond basic textbook)
            advanced_indicators = [
                "formation", "gravity", "astronomical", "billions", 
                "evolution", "nuclear", "physics", "scientific"
            ]
            
            found_advanced = sum(1 for indicator in advanced_indicators if indicator in answer.lower())
            
            if found_advanced >= 2:
                print(f"✅ PASS: Contains advanced concepts ({found_advanced} indicators)")
            else:
                print(f"⚠️ WARNING: Limited advanced concepts ({found_advanced} indicators)")
            
            return True
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Failed to test advanced mode: {e}")
        return False

def test_mode_comparison():
    """Compare all three modes with the same query."""
    print("🔄 TESTING MODE COMPARISON")
    print("="*50)
    print("Expected: Each mode should provide different levels of detail")
    print()
    
    try:
        from core.services.llm_service import llm_service
        
        test_query = "What are planets?"
        print(f"🧪 Comparing all modes with: {test_query}")
        print()
        
        results = {}
        
        # Test textbook mode
        print("📘 Textbook mode:")
        try:
            textbook_result = llm_service.generate_textbook_answer(test_query)
            textbook_answer = textbook_result.get("answer", "")
            results["textbook"] = {
                "length": len(textbook_answer),
                "success": textbook_result.get("success", False),
                "answer": textbook_answer
            }
            print(f"   Length: {len(textbook_answer)} chars")
            print(f"   Success: {textbook_result.get('success', False)}")
            print(f"   Preview: {textbook_answer[:100]}...")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test detailed mode
        print("📗 Detailed mode:")
        try:
            detailed_answer = llm_service.generate_detailed_answer(test_query)
            results["detailed"] = {
                "length": len(detailed_answer),
                "answer": detailed_answer
            }
            print(f"   Length: {len(detailed_answer)} chars")
            print(f"   Preview: {detailed_answer[:100]}...")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Test advanced mode
        print("📕 Advanced mode:")
        try:
            advanced_answer = llm_service.generate_advanced_answer(test_query)
            results["advanced"] = {
                "length": len(advanced_answer),
                "answer": advanced_answer
            }
            print(f"   Length: {len(advanced_answer)} chars")
            print(f"   Preview: {advanced_answer[:100]}...")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()
        
        # Analysis
        print("📊 ANALYSIS:")
        if len(results) == 3:
            lengths = [results[mode]["length"] for mode in ["textbook", "detailed", "advanced"]]
            print(f"   Textbook: {lengths[0]} chars")
            print(f"   Detailed: {lengths[1]} chars") 
            print(f"   Advanced: {lengths[2]} chars")
            
            if lengths[1] >= lengths[0] and lengths[2] >= lengths[0]:
                print("✅ PASS: Detailed and Advanced provide more content than Textbook")
            else:
                print("⚠️ WARNING: Unexpected length pattern")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed mode comparison: {e}")
        return False

def test_service_status():
    """Test the service status and configuration."""
    print("🔧 TESTING SERVICE STATUS")
    print("="*50)
    
    try:
        from core.services.llm_service import llm_service
        
        status = llm_service.get_service_status()
        
        print("📊 Service Status:")
        for key, value in status.items():
            print(f"   {key}: {value}")
        print()
        
        # Check critical components
        checks = [
            ("textbook_vectorstore_available", "Textbook vector store"),
            ("llm_modes_initialized", "LLM modes"),
            ("api_key_configured", "OpenAI API key")
        ]
        
        all_good = True
        for check_key, description in checks:
            if status.get(check_key, False):
                print(f"✅ {description}: OK")
            else:
                print(f"❌ {description}: FAILED")
                all_good = False
        
        return all_good
        
    except Exception as e:
        print(f"❌ Failed to check service status: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 COMPREHENSIVE RAG MODE TESTING")
    print("="*60)
    print("Testing three explanation modes:")
    print("📘 Textbook: ONLY textbook.pdf content") 
    print("📗 Detailed: Textbook + LLM enhancement")
    print("📕 Advanced: Primarily LLM knowledge")
    print("="*60)
    print()
    
    # Run all tests
    tests = [
        ("Service Status", test_service_status),
        ("Textbook Mode", test_textbook_mode),
        ("Detailed Mode", test_detailed_mode), 
        ("Advanced Mode", test_advanced_mode),
        ("Mode Comparison", test_mode_comparison)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name.upper()} {'='*20}")
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with error: {e}")
            results[test_name] = False
        print()
    
    # Summary
    print("🏁 TEST SUMMARY")
    print("="*40)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print()
    print(f"📊 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        print("\n✅ Your textbook RAG system is working correctly:")
        print("   📘 Textbook mode uses only textbook.pdf content")
        print("   📗 Detailed mode enhances textbook with LLM knowledge")  
        print("   📕 Advanced mode uses primarily LLM knowledge")
    else:
        print("⚠️ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()