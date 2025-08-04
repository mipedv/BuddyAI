import React from 'react';

interface AskBuddyAIButtonProps {
  position: { x: number; y: number };
  onAsk: () => void;
  visible: boolean;
}

const AskBuddyAIButton: React.FC<AskBuddyAIButtonProps> = ({ position, onAsk, visible }) => {
  if (!visible) return null;

  return (
    <div
      className="highlight-popup fixed z-50 animate-fade-in"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <button
        onClick={onAsk}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-blue-600 group"
        aria-label="Ask BuddyAI about selected text"
      >
        {/* Question mark icon */}
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
          ?
        </div>
        <span className="whitespace-nowrap">Ask BuddyAI</span>
      </button>
    </div>
  );
};

export default AskBuddyAIButton;