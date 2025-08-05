import React, { useState } from 'react';

const TestSelection: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedText, setSelectedText] = useState('');

  const handleSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      console.log('Selection:', selection?.toString());
      
      if (!selection || selection.isCollapsed) {
        return;
      }

      const text = selection.toString().trim();
      
      // Skip if no meaningful text is selected
      if (text.length < 1 || /^\s*$/.test(text)) {
        return;
      }

      console.log('Selected text:', text);

      // Create new query text with bold prefix and append functionality
      let newQueryText = '';
      const currentQuery = inputValue.trim();
      
      if (currentQuery === '' || currentQuery === 'Ask about selected text...') {
        // First selection - start with bold prefix
        newQueryText = `**Explain this:** "${text}"`;
      } else if (currentQuery.includes('**Explain this:**')) {
        // Already has our prefix - append with comma
        newQueryText = `${currentQuery}, "${text}"`;
      } else {
        // Has other text - add our prefix and append
        newQueryText = `**Explain this:** ${currentQuery}, "${text}"`;
      }

      setInputValue(newQueryText);
      setSelectedText(text);

      // Focus the input field
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder="Ask about selected text..."]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.value = newQueryText;
          console.log('Input field populated with:', newQueryText);
        }
      }, 50);

      // Clear the selection after copying
      setTimeout(() => {
        selection.removeAllRanges();
      }, 1000);
    }, 100);
  };

  return (
    <>
      <style>{`
        ::selection {
          background-color: #fb923c !important;
          color: white !important;
        }
        
        ::-moz-selection {
          background-color: #fb923c !important;
          color: white !important;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }

        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
      
      <div className="p-8">
        <h1 className="text-2xl mb-4">Text Selection Test</h1>
        
        <div 
          className="p-4 border border-gray-300 rounded bg-white"
          onMouseUp={handleSelection}
          onTouchEnd={handleSelection}
          style={{ userSelect: 'text' }}
        >
          <p>
            The Solar System is a collection of celestial bodies, including the Sun, planets, moons, asteroids, and comets, 
            all held together by the Sun's gravitational pull. The Sun is the largest object in our Solar System and provides 
            energy that supports life on Earth. It holds all planets in their orbits due to its immense gravity.
          </p>
          <p>
            There are 8 planets in our Solar System, divided into two groups: Inner Planets (Mercury, Venus, Earth, Mars) 
            and Outer Planets (Jupiter, Saturn, Uranus, Neptune). The Solar System formed about 4.5 billion years ago 
            from a giant cloud of gas and dust.
          </p>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <div className="relative w-full">
            {/* Rich text display overlay */}
            <div 
              className="absolute inset-0 px-4 py-3 rounded-lg pointer-events-none z-10 flex items-center"
              style={{ 
                backgroundColor: 'transparent',
                fontSize: '16px',
                lineHeight: '1.5'
              }}
            >
              {inputValue ? (
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {inputValue.split('**Explain this:**').map((part, index) => 
                    index === 0 ? (
                      part
                    ) : (
                      <span key={index}>
                        <span className="font-bold text-lg text-blue-600">Explain this:</span>
                        {part}
                      </span>
                    )
                  )}
                </span>
              ) : (
                <span className="text-gray-400">Ask about selected text...</span>
              )}
            </div>
            
            {/* Invisible input for functionality */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about selected text..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent relative z-20"
              style={{ color: 'transparent', caretColor: '#3B82F6' }}
            />
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p><strong>Selected text:</strong> {selectedText || 'None'}</p>
          <p><strong>Input value:</strong> {inputValue || 'None'}</p>
          <p><strong>Instructions:</strong> Select any text above to automatically populate the input field</p>
        </div>
      </div>
    </>
  );
};

export default TestSelection;