import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker - using local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFTextbookProps {
  pdfUrl: string;
  onTextSelection?: (selectedText: string) => void;
  onPopupClick?: (selectedText: string) => void;
}

const PDFTextbook: React.FC<PDFTextbookProps> = ({ pdfUrl, onTextSelection, onPopupClick }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Popup states for highlight-to-ask
  const [showHighlightPopup, setShowHighlightPopup] = useState<boolean>(false);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState<string>('');
  
  // Debug: Log the PDF URL
  console.log('PDF URL:', pdfUrl);

    // Clean CSS for PDF text selection - Following GPT best practices
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-pdf__Page {
        position: relative;
      }

      .react-pdf__Page__canvas {
        display: block;
        margin: 0 auto;
      }

      .react-pdf__Page__textContent {
        position: absolute;
        top: 0;
        left: 0;
        user-select: text;
        z-index: 10;
        pointer-events: auto;
      }

      .react-pdf__Page__textContent span {
        color: rgba(0, 0, 0, 0.01);
        font-family: sans-serif;
        cursor: text;
      }

      .react-pdf__Page__textContent span:hover {
        background: rgba(173, 216, 230, 0.2);
        transition: background-color 0.1s ease;
      }

      .react-pdf__Page__textContent span::selection {
        background-color: rgba(255, 193, 7, 0.4);
      }
      
      /* Debug mode */
      .debug-mode .react-pdf__Page__textContent span {
        background: rgba(255, 255, 0, 0.3) !important;
        color: rgba(0, 0, 0, 0.7) !important;
        border: 1px solid rgba(255, 255, 0, 0.6) !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleTextSelection = useCallback(() => {
    // Add delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') {
        setShowHighlightPopup(false);
        return;
      }

      const selectedText = selection.toString().trim();
      
      // Only process if text is reasonable length (not too much)
      if (selectedText.length > 3 && selectedText.length < 500) {
        console.log('✅ PDF Text Selected:', selectedText);
        
        // Set popup state
        setSelectedText(selectedText);
        
        // Get selection coordinates for popup positioning
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position popup above the selection
        const x = Math.max(10, Math.min(
          window.innerWidth - 150,
          rect.left + (rect.width / 2) - 75
        ));
        const y = Math.max(10, rect.top - 50);
        
        setHighlightPopupPosition({ x, y });
        setShowHighlightPopup(true);
      }
    }, 150);
  }, []);

  // Handle popup click
  const handlePopupClick = useCallback(() => {
    setShowHighlightPopup(false);
    
    if (selectedText && onPopupClick) {
      onPopupClick(selectedText);
    }
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
  }, [selectedText, onPopupClick]);

  // Add global mouse up listener for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      handleTextSelection();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleTextSelection]);

  const getCurrentPdfUrl = () => {
    return `/media/textbook-chapters/text+book_1.pdf`;
  };

  return (
    <div className={`pdf-textbook-container flex flex-col h-full bg-gray-50 ${debugMode ? 'debug-mode' : ''}`}>
      {/* Clean PDF Controls - Sticky */}
      <div className="flex items-center justify-center gap-4 p-3 bg-white sticky top-0 z-20 shadow border-b border-gray-200">
        {/* Page Navigation */}
        <button 
          onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
          disabled={pageNumber <= 1}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400 hover:bg-blue-600"
        >
          &lt; Previous Page
        </button>
        
        <span className="px-3 py-1 bg-gray-100 rounded text-sm font-medium">
          Page {pageNumber} of {numPages}
        </span>
        
        <button 
          onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
          disabled={pageNumber >= numPages}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-400 hover:bg-blue-600"
        >
          Next Page &gt;
        </button>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Zoom Out
          </button>
          
          <span className="px-2 py-1 bg-gray-100 rounded text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button 
            onClick={() => setScale(scale + 0.1)}
            className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Zoom In
          </button>
          
          <button 
            onClick={() => setScale(1.0)}
            className="px-2 py-1 bg-blue-100 rounded hover:bg-blue-200"
          >
            Reset
          </button>
        </div>
        
        {/* Debug Toggle */}
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-2 py-1 rounded text-sm ${debugMode ? 'bg-red-500 text-white' : 'bg-yellow-200'} hover:bg-red-600`}
        >
          {debugMode ? 'Hide Text Areas' : 'Show Text Areas'}
        </button>
      </div>

      {/* PDF Viewer - Clean Structure */}
      <div 
        className="flex justify-center p-4 flex-1 overflow-auto"
        onMouseUp={handleTextSelection}
        onTouchEnd={handleTextSelection}
      >
        <Document
          file={getCurrentPdfUrl()}
          onLoadSuccess={onDocumentLoadSuccess}
          loading="Loading chapter..."
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={false}
            renderTextLayer={true}
            onLoadSuccess={() => {
              setTimeout(() => {
                const textLayer = document.querySelector('.react-pdf__Page__textContent');
                if (textLayer) {
                  const spans = textLayer.querySelectorAll('span');
                  console.log(`✅ Text layer loaded with ${spans.length} spans`);
                } else {
                  console.log('❌ No text layer found');
                }
              }, 100);
            }}
          />
        </Document>
      </div>

      {/* Page Info Bar */}
      <div className="text-center text-sm pb-4 text-gray-500">
        Solar System Textbook • Page {pageNumber} of {numPages}
      </div>
      
      {/* Highlight-to-Ask Popup */}
      {showHighlightPopup && (
        <div 
          className="fixed z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
          style={{ 
            left: highlightPopupPosition.x, 
            top: highlightPopupPosition.y 
          }}
          onClick={handlePopupClick}
        >
          Ask BuddyAI
        </div>
      )}
    </div>
  );
};

export default PDFTextbook;