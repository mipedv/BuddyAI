import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderRight from '../HeaderRight';
import ExplanationSelector from '../ExplanationSelector';
import { Search, ChevronDown } from 'lucide-react';
import ChapterButtons from '../ChapterButtons';
import { SUBJECTS_CHAPTERS } from '../HomePage';

const INITIAL_SUGGESTED_TOPICS = [
  { label: 'Solar System' },
  { label: 'History' },
  { label: 'Geography' },
  { label: 'Science' }
];

const TOPIC_SPECIFIC_SUGGESTED_TOPICS = {
  'Solar System': [
    { label: 'Planets' },
    { label: 'Moons' },
    { label: 'Asteroids' },
    { label: 'Comets' }
  ],
  'History': [
    { label: 'World War II' },
    { label: 'Ancient Civilizations' },
    { label: 'Industrial Revolution' },
    { label: 'Exploration' }
  ],
  'Geography': [
    { label: 'Continents' },
    { label: 'Oceans' },
    { label: 'Climate Zones' },
    { label: 'Natural Resources' }
  ],
  'Science': [
    { label: 'Atoms' },
    { label: 'Energy' },
    { label: 'Ecosystems' },
    { label: 'Genetics' }
  ]
};

interface MainContentProps {
  selectedSubject: string;
  setSelectedSubject: React.Dispatch<React.SetStateAction<string>>;
  selectedChapter: string;
  setSelectedChapter: React.Dispatch<React.SetStateAction<string>>;
  subjectsChapters: Record<string, string[]>;
}

const MainContent: React.FC<MainContentProps> = ({
  selectedSubject, 
  setSelectedSubject, 
  selectedChapter, 
  setSelectedChapter,
  subjectsChapters
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [explanationType, setExplanationType] = useState('Textbook Explanation');
  const [suggestedTopics, setSuggestedTopics] = useState(INITIAL_SUGGESTED_TOPICS);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  const handleTopicClick = (topic: string) => {
    // Populate the text field with the clicked topic
    setQuery(topic);

    // Change suggested topics based on the clicked topic
    setSuggestedTopics(TOPIC_SPECIFIC_SUGGESTED_TOPICS[topic as keyof typeof TOPIC_SPECIFIC_SUGGESTED_TOPICS] || INITIAL_SUGGESTED_TOPICS);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      console.log('Submitted Query:', query);
      console.log('Explanation Type:', explanationType);
      
      // You can implement dynamic topic generation logic here
      setSuggestedTopics(INITIAL_SUGGESTED_TOPICS);
    }
  };

  const handleChapterClick = (chapter: string) => {
    // If no subject is selected, default to Physics
    const subject = selectedSubject === 'Select Subject' ? 'Physics' : selectedSubject;
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    navigate('/chapter');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
        <div className="flex items-center space-x-4">
          {/* Subject Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                setIsChapterDropdownOpen(false);
              }}
              className="flex items-center space-x-2 px-3 py-2 border rounded-lg text-gray-700 bg-white"
            >
              <span>{selectedSubject}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isSubjectDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                {Object.keys(subjectsChapters).map(subject => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
                      // Reset chapter when subject changes
                      setSelectedChapter('Select Chapter');
                      setIsSubjectDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Chapter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => {
                // Only open chapter dropdown if a subject is selected
                if (selectedSubject !== 'Select Subject') {
                  setIsChapterDropdownOpen(!isChapterDropdownOpen);
                  setIsSubjectDropdownOpen(false);
                }
              }}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-gray-700 bg-white 
                ${selectedSubject === 'Select Subject' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selectedSubject === 'Select Subject'}
            >
              <span>{selectedChapter}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isChapterDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                {subjectsChapters[selectedSubject].map(chapter => (
                  <button
                    key={chapter}
                    onClick={() => {
                      setSelectedChapter(chapter);
                      setIsChapterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Header Right Component */}
        <HeaderRight />
      </div>

      {/* Chapter Buttons Component */}
      <ChapterButtons />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">What do you want to know?</h2>
        
        {/* Search Input with Explanation Selector */}
        <div className="w-full max-w-2xl relative">
          <div className="flex items-center space-x-2 mb-2 justify-end">
            <ExplanationSelector onSelect={setExplanationType} />
          </div>
          
          <div className="relative flex items-center">
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 space-x-2 shadow-sm">
              <Search 
                className="h-5 w-5 text-gray-400"
                strokeWidth={2}
              />
              
              <input 
                type="text" 
                placeholder="Ask anything" 
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
                  onClick={query.trim() ? handleSubmit : () => console.log('Voice mode')}
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
                      src="/media/button logo.png"
                      alt="Voice Mode"
                      className="w-6 h-6 object-contain"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Suggested Topics */}
        <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
          {suggestedTopics.map((topic) => (
            <button 
              key={topic.label} 
              onClick={() => handleTopicClick(topic.label)}
              className="flex items-center space-x-2 bg-[#f5f4ef] text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-gray-500 mr-2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>{topic.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MainContent; 