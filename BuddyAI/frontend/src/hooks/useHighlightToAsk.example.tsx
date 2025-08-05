// Example Usage of useHighlightToAsk Hook
// This file shows how to integrate the hook in different components

import React from 'react';
import { useHighlightToAsk } from './useHighlightToAsk';

// Example 1: PDF Chapter Modal Component
export const PDFChapterModal: React.FC = () => {
  const {
    selectedText,
    showHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery,
    isInputExpanded,
    setIsInputExpanded
  } = useHighlightToAsk('pdf');

  return (
    <div className="pdf-modal">
      {/* PDF Content with text selection */}
      <div 
        className="pdf-content lesson-content"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        {/* Your PDF rendering component */}
        <div className="pdf-page">
          {/* PDF content here */}
        </div>
      </div>

      {/* Highlight Popup */}
      {showHighlightPopup && (
        <div
          className="fixed z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
          style={{
            left: `${highlightPopupPosition.x}px`,
            top: `${highlightPopupPosition.y}px`
          }}
          onClick={handlePopupClick}
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ask about this</span>
          </div>
        </div>
      )}

      {/* Query Input Field */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Ask anything"
          value={followUpQuery}
          onChange={(e) => setFollowUpQuery(e.target.value)}
          className={`w-full p-3 border rounded-lg transition-all duration-200 ${
            isInputExpanded ? 'min-h-[60px]' : ''
          }`}
        />
      </div>
    </div>
  );
};

// Example 2: Summary Modal Component
export const SummaryModal: React.FC<{ summaryContent: string }> = ({ summaryContent }) => {
  const {
    showHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery
  } = useHighlightToAsk('summary');

  return (
    <div className="summary-modal">
      {/* Summary Content */}
      <div 
        className="summary-content lesson-content p-4"
        onMouseUp={handleTextSelection}
      >
        <div className="prose max-w-none">
          {summaryContent}
        </div>
      </div>

      {/* Highlight Popup */}
      {showHighlightPopup && (
        <div
          className="fixed z-50 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-green-600"
          style={{
            left: `${highlightPopupPosition.x}px`,
            top: `${highlightPopupPosition.y}px`
          }}
          onClick={handlePopupClick}
        >
          Ask about this summary
        </div>
      )}

      {/* Input field would be here */}
    </div>
  );
};

// Example 3: Response Page Integration
export const ResponsePageExample: React.FC<{ response: any }> = ({ response }) => {
  const {
    showHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery,
    isInputExpanded
  } = useHighlightToAsk('response');

  return (
    <div className="response-page">
      {/* Response Content */}
      <div 
        className="answer-text lesson-content"
        onMouseUp={handleTextSelection}
      >
        {response.answer}
      </div>

      {/* Highlight Popup */}
      {showHighlightPopup && (
        <div
          className="fixed z-50 bg-purple-500 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-purple-600"
          style={{
            left: `${highlightPopupPosition.x}px`,
            top: `${highlightPopupPosition.y}px`
          }}
          onClick={handlePopupClick}
        >
          🤔 Ask about this
        </div>
      )}

      {/* Follow-up Input */}
      <div className="mt-6">
        <textarea
          placeholder="Ask follow-up"
          value={followUpQuery}
          onChange={(e) => setFollowUpQuery(e.target.value)}
          className={`w-full p-3 border rounded-lg transition-all ${
            isInputExpanded ? 'min-h-[80px]' : 'min-h-[40px]'
          }`}
          rows={isInputExpanded ? 3 : 1}
        />
      </div>
    </div>
  );
};

// Example 4: Custom Hook Usage with Advanced Features
export const AdvancedExample: React.FC = () => {
  const {
    selectedText,
    showHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery,
    resetHighlightState
  } = useHighlightToAsk('chapter');

  // Custom handler that adds additional logic
  const customPopupClick = () => {
    // Custom analytics or logging
    console.log('Custom popup clicked:', selectedText);
    
    // Call the original handler
    handlePopupClick();
    
    // Additional custom logic here
  };

  return (
    <div className="advanced-example">
      {/* Content with custom CSS classes for targeting */}
      <div 
        className="chapter-content lesson-content"
        onMouseUp={handleTextSelection}
      >
        <h2>Chapter Content</h2>
        <p>Select any text in this chapter to ask questions about it...</p>
      </div>

      {/* Custom styled popup */}
      {showHighlightPopup && (
        <div
          className="fixed z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          style={{
            left: `${highlightPopupPosition.x}px`,
            top: `${highlightPopupPosition.y}px`
          }}
          onClick={customPopupClick}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">✨ Ask AI</span>
          </div>
        </div>
      )}

      {/* Reset button for debugging */}
      <button 
        onClick={resetHighlightState}
        className="mt-4 px-3 py-1 bg-gray-200 rounded text-sm"
      >
        Reset Highlight State
      </button>
    </div>
  );
};