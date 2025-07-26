import React from 'react';

interface VoiceModeButtonProps {
  hasContent: boolean;
  onSend?: () => void;
  onVoiceMode?: () => void;
}

const VoiceModeButton: React.FC<VoiceModeButtonProps> = ({ 
  hasContent, 
  onSend, 
  onVoiceMode 
}) => {
  const handleClick = () => {
    if (hasContent && onSend) {
      onSend();
    } else if (!hasContent && onVoiceMode) {
      onVoiceMode();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-10 h-10 bg-white border border-gray-200 rounded-full hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-sm"
      title={hasContent ? "Send message" : "Voice Mode (coming soon)"}
    >
      {hasContent ? (
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
  );
};

export default VoiceModeButton; 