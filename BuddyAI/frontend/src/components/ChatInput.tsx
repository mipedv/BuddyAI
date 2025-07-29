import React, { useState } from 'react';

const ChatInput: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSuggestedTopicClick = (topic: string) => {
    setQuery(topic);
  };

  const handleSendClick = () => {
    if (query.trim()) {
      // Future submit logic
      console.log('Submitted:', query);
    }
  };

  const handleVoiceClick = () => {
    setIsRecording(!isRecording);
    console.log('Voice mode toggled');
  };

  const handleMicClick = () => {
    console.log('Microphone clicked');
  };

  const SUGGESTED_TOPICS = [
    { icon: '🌍', label: 'Solar System' },
    { icon: '🧪', label: 'Chemical Reactions' },
    { icon: '🧬', label: 'Genetics' },
    { icon: '🌈', label: 'Light & Optics' }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Suggested Topics */}
        <div className="flex space-x-2 mb-2 overflow-x-auto pb-2">
          {SUGGESTED_TOPICS.map((topic) => (
            <button 
              key={topic.label} 
              onClick={() => handleSuggestedTopicClick(topic.label)}
              className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              <span>{topic.icon}</span>
              <span>{topic.label}</span>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="Ask anything..."
              value={query}
              onChange={handleQueryChange}
              className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Button Container */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {/* Mic Button */}
              <button 
                onClick={handleMicClick}
                className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
                title="Microphone"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="white"
                  className="w-5 h-5"
                >
                  <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0Z"/>
                  <path d="M12 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z"/>
                </svg>
              </button>

              {/* Voice/Send Button */}
              <button 
                onClick={query.trim() ? handleSendClick : handleVoiceClick}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                title={query.trim() ? "Send" : "Voice Mode"}
              >
                {query.trim() ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-blue-600" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                ) : (
                  <img
                    src="/media/button logo.png"
                    alt="Voice Mode"
                    className="w-8 h-8 object-contain"
                  />
                )}
              </button>

              {/* Image Search Button */}
              <button 
                onClick={() => console.log('Image search clicked')}
                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                title="Image Search"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-gray-600" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ChatInput; 