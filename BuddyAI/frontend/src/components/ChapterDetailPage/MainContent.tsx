import React, { useState } from 'react';
import HeaderRight from '../HeaderRight';
import ExplanationSelector from '../ExplanationSelector';
import ChapterButtons from '../ChapterButtons';

const SUBJECTS = ['Physics', 'Mathematics', 'Chemistry', 'Biology'];
const CHAPTERS = {
  'Physics': ['Solar System', 'Mechanics', 'Electricity', 'Magnetism'],
  'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
  'Chemistry': ['Atomic Structure', 'Chemical Bonds', 'Periodic Table', 'Reactions'],
  'Biology': ['Cell Biology', 'Genetics', 'Ecology', 'Human Anatomy']
};

const CHAPTER_BUTTONS = [
  { label: 'Teach me the chapter step by step' },
  { label: 'Important sections' },
  { label: 'Celestial bodies' },
  { label: 'Planets' }
];

interface MainContentProps {
  selectedSubject: string;
  setSelectedSubject: React.Dispatch<React.SetStateAction<string>>;
  selectedChapter: string;
  setSelectedChapter: React.Dispatch<React.SetStateAction<string>>;
}

const MainContent: React.FC<MainContentProps> = ({
  selectedSubject, 
  setSelectedSubject, 
  selectedChapter, 
  setSelectedChapter
}) => {
  const [query, setQuery] = useState('What is solar system');
  const [explanationType, setExplanationType] = useState('Textbook Explanation');

  const handleSubmit = () => {
    if (query.trim()) {
      // Implement query submission logic
      console.log('Submitted Query:', query);
      console.log('Explanation Type:', explanationType);
      // Clear the input after submission
      setQuery('');
    }
  };

  const handleChapterButtonClick = (label: string) => {
    setQuery(label);
  };

  const handleVoiceMode = () => {
    console.log('Voice mode activated (coming soon)');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
        <div className="flex items-center space-x-4">
          {/* Subject Dropdown */}
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-gray-700"
          >
            {SUBJECTS.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          
          {/* Chapter Dropdown */}
          <select 
            value={selectedChapter} 
            onChange={(e) => setSelectedChapter(e.target.value)} 
            className="px-3 py-2 border rounded-lg text-gray-700"
          >
            {CHAPTERS[selectedSubject as keyof typeof CHAPTERS].map(chapter => (
              <option key={chapter} value={chapter}>{chapter}</option>
            ))}
          </select>
        </div>
        
        {/* Header Right Component */}
        <HeaderRight />
      </div>

      {/* Chapter Buttons Component */}
      <ChapterButtons />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8 bg-[#f5f4ef]">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">What do you want to know?</h2>
        
        {/* Search Input with Explanation Selector */}
        <div className="w-full max-w-2xl relative mb-6">
          <div className="flex items-center space-x-2 mb-2 justify-end">
            <ExplanationSelector onSelect={setExplanationType} />
          </div>
          
          <div className="relative flex items-center">
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 space-x-2 shadow-sm">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="bg-transparent text-gray-800 placeholder-gray-400 outline-none w-full pr-20"
              />
              
              {/* Button Container */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Mic Button */}
                <button 
                  onClick={() => console.log('Microphone clicked')}
                  className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-1 
                    transition-all duration-200 hover:bg-gray-700 hover:scale-105 active:scale-95"
                  title="Microphone"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="white"
                    className="w-4 h-4"
                  >
                    <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0Z"/>
                    <path d="M12 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z"/>
                  </svg>
                </button>

                {/* Voice/Send Button */}
                <button 
                  onClick={query.trim() ? handleSubmit : handleVoiceMode}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center 
                    transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95"
                >
                  {query.trim() ? (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-blue-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  ) : (
                    <img
                      src="/button logo.png"
                      alt="Voice Mode"
                      className="w-6 h-6 object-contain"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chapter Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {CHAPTER_BUTTONS.map((button, index) => (
            <button 
              key={index} 
              onClick={() => handleChapterButtonClick(button.label)}
              className="bg-gray-100 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainContent; 