import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderRight from '../HeaderRight';
import ExplanationSelector from '../ExplanationSelector';
import { Search, BookOpen, X, FileText } from 'lucide-react';
import ChapterButtons from '../ChapterButtons';
import { SUBJECTS_CHAPTERS } from '../HomePage';
import axios from 'axios';
import PDFTextbook from '../PDFTextbook';

const INITIAL_SUGGESTED_TOPICS = [
  { label: 'Solar System' },
  { label: 'History' },
  { label: 'Geography' },
  { label: 'Science' }
];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [micState, setMicState] = useState<'idle' | 'listening' | 'speaking'>('idle');
  const recognitionRef = useRef<any>(null);
  const [showTextBookModal, setShowTextBookModal] = useState(false);
  const [showFullChapterModal, setShowFullChapterModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  // Translation helpers/state
  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);
  const translateText = async (text: string, target: 'en' | 'ar', source?: 'en' | 'ar') => {
    try {
      const resp = await axios.post(`http://localhost:8000/api/core/translate/`, {
        text,
        sourceLang: source,
        targetLang: target,
      }, { timeout: 15000 });
      if (resp.data?.success) return resp.data.translatedText as string;
      return text;
    } catch {
      return text;
    }
  };

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

  const getLevelForBackend = (explanationType: string) => {
    switch(explanationType) {
      case 'Textbook Explanation':
        return 'textbook';
      case 'Detailed Explanation':
        return 'detailed';
      case 'Advanced Explanation':
        return 'advanced';
      default:
        return 'textbook';
    }
  };

  const fetchDataAndNavigate = async (searchQuery: string, level: string) => {
    setLoading(true);
    setError(null);
    try {
      // If user asked in Arabic, pre-translate to English for the backend
      const queryForBackend = isArabic(searchQuery) ? await translateText(searchQuery, 'en', 'ar') : searchQuery;
      const response = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: { query: queryForBackend, level }
      });
      // Navigate with state, so ResponsePage gets the data directly
      navigate(`/response?query=${encodeURIComponent(searchQuery)}&level=${level}`, { state: { response: response.data } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred while fetching your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      fetchDataAndNavigate(query.trim(), getLevelForBackend(explanationType));
    }
  };

  const handleTopicClick = (topic: string) => {
    setQuery(topic);
    setSuggestedTopics(TOPIC_SPECIFIC_SUGGESTED_TOPICS[topic as keyof typeof TOPIC_SPECIFIC_SUGGESTED_TOPICS] || INITIAL_SUGGESTED_TOPICS);
    // Removed direct call to fetchDataAndNavigate here
  };

  const handleChapterClick = (chapter: string) => {
    // If no subject is selected, default to Physics
    const subject = selectedSubject === 'Select Subject' ? 'Physics' : selectedSubject;
    setSelectedSubject(subject);
    setSelectedChapter(chapter);
    navigate('/chapter');
  };

  const handleViewFullChapter = () => {
    console.log('Opening Full Chapter Modal with solar.pdf');
    console.log('PDF URL will be:', '/media/chapters/solar.pdf');
    // Force cache busting with timestamp
    const timestamp = Date.now();
    console.log('Cache busting timestamp:', timestamp);
    setShowFullChapterModal(true);
  };

  const handleViewSummary = () => {
    console.log('Opening Solar System Summary Modal');
    setShowSummaryModal(true);
  };

  // Summary translation state
  const [summaryTranslating, setSummaryTranslating] = useState(false);
  const [summaryShowTranslation, setSummaryShowTranslation] = useState(false);
  const [summaryTranslatedItems, setSummaryTranslatedItems] = useState<string[] | null>(null);

  const baseSummaryItems: string[] = [
    'The Solar System consists of the Sun at its center and all celestial bodies that orbit around it',
    'Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune',
    "The Sun provides light and energy to all planets and makes up 99.86% of the system's mass",
    'Planets are divided into terrestrial (rocky) and gas giants (Jupiter, Saturn, Uranus, Neptune)',
    'Other objects include dwarf planets, asteroids in the asteroid belt, and comets with icy compositions',
    'The Solar System formed approximately 4.6 billion years ago from a giant cloud of gas and dust',
    'Gravity keeps all objects in orbit around the Sun, following elliptical paths',
  ];

  const handleTranslateSummary = async () => {
    try {
      setSummaryTranslating(true);
      if (!summaryShowTranslation) {
        // Translate to Arabic
        const translated = await Promise.all(baseSummaryItems.map(t => translateText(t, 'ar', 'en')));
        setSummaryTranslatedItems(translated);
        setSummaryShowTranslation(true);
      } else {
        setSummaryShowTranslation(false);
      }
    } finally {
      setSummaryTranslating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
            </button>

            {isSubjectDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                {Object.keys(subjectsChapters).map(subject => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSelectedSubject(subject);
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
        <div className="flex items-center space-x-4">
          {/* Text Book Button */}
                      <button 
              onClick={() => {
                console.log('Opening Text Book Modal with full textbook');
                console.log('PDF URL will be:', '/media/textbook-chapters/text+book_1.pdf');
                setShowTextBookModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg transition-all duration-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
              title="Open Text Book"
            >
            <BookOpen className="w-5 h-5 text-gray-500" />
            <span>Text Book</span>
          </button>
          

          <HeaderRight />
        </div>
      </div>

      {/* Chapter Buttons Component */}
      <ChapterButtons 
        onViewFullChapter={handleViewFullChapter}
        onViewSummary={handleViewSummary}
      />

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
                disabled={loading} // Disable input while loading
              />

              {/* Button Container */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {/* Mic Button */}
                <button
                  onClick={() => {
                    try {
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (!SpeechRecognition) { alert('Speech Recognition not supported.'); return; }
                      if (recognitionRef.current) {
                        recognitionRef.current.stop();
                        recognitionRef.current = null;
                        setMicState('idle');
                        return;
                      }
                      const rec = new SpeechRecognition();
                      recognitionRef.current = rec;
                      rec.lang = 'en-US';
                      rec.interimResults = true;
                      rec.continuous = false;
                      rec.onstart = () => setMicState('listening');
                      rec.onend = () => setMicState('idle');
                      rec.onerror = () => setMicState('idle');
                      rec.onresult = (e: any) => {
                        let interim = '';
                        let finalText = '';
                        for (let i = e.resultIndex; i < e.results.length; ++i) {
                          const transcript = e.results[i][0].transcript;
                          if (e.results[i].isFinal) finalText += transcript + ' ';
                          else interim += transcript;
                        }
                        setQuery((finalText || interim).trim());
                      };
                      rec.start();
                    } catch {}
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${micState==='listening' ? 'bg-red-600 animate-pulse' : 'bg-black hover:bg-gray-700'} hover:scale-105 active:scale-95`}
                  title="Microphone"
                  disabled={loading} // Disable button while loading
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
                  onClick={query.trim() ? handleSubmit : () => {
                    const next = !isVoiceMode;
                    setIsVoiceMode(next);
                    try {
                      const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (!SpeechRecognition) { alert('Speech Recognition not supported.'); return; }
                      if (next) {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        const rec = new SpeechRecognition();
                        recognitionRef.current = rec;
                        rec.lang = 'en-US';
                        rec.interimResults = true;
                        rec.continuous = true;
                        rec.onstart = () => setMicState('listening');
                        rec.onend = () => { if (isVoiceMode) rec.start(); else setMicState('idle'); };
                        rec.onerror = () => setMicState('idle');
                        rec.onresult = async (e: any) => {
                          let interim = '';
                          let finalText = '';
                          for (let i = e.resultIndex; i < e.results.length; ++i) {
                            const transcript = e.results[i][0].transcript;
                            if (e.results[i].isFinal) finalText += transcript + ' ';
                            else interim += transcript;
                          }
                          if (finalText.trim()) {
                            setQuery(finalText.trim());
                            if (!loading) handleSubmit();
                          } else {
                            setQuery(interim.trim());
                          }
                        };
                        rec.start();
                      } else {
                        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        setMicState('idle');
                      }
                    } catch {}
                  }}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center
                    transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95"
                  title={query.trim() ? "Send" : "Voice Mode"}
                  disabled={loading} // Disable button while loading
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  ) : query.trim() ? (
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

          {/* Loading Indicator / Error Message */}
          {loading && (
            <div className="mt-4 text-center text-blue-600 font-semibold">
              Loading response...
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-red-500 font-semibold">
              Error: {error}
            </div>
          )}

          {/* Suggested Topics */}
          {!loading && !error && (
            <div className="mt-6 grid grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleTopicClick(topic.label)}
                  className="flex items-center space-x-2 bg-[#f5f4ef] text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={loading} // Disable buttons while loading
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
          )}
        </div>
      </div>

      {/* Text Book Modal */}
      {showTextBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div 
            id="textbook-modal" 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#007bff] to-[#6f42c1] text-white p-8 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BookOpen size={32} className="text-white" />
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold">Science Textbook</h2>
                  <p className="text-sm text-white/80 mt-1">Chapter: The Solar System</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setShowTextBookModal(false)} 
                  className="p-3 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <PDFTextbook 
                pdfUrl={`/media/textbook-chapters/text+book_1.pdf?t=${Date.now()}`}
                onPopupClick={(selectedText) => {
                  console.log('Text selected from full textbook PDF:', selectedText);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Full Chapter Modal */}
      {showFullChapterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#007bff] to-[#6f42c1] text-white p-8 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BookOpen size={32} className="text-white" />
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold">Science Textbook</h2>
                  <p className="text-sm text-white/80 mt-1">Chapter: The Solar System</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setShowFullChapterModal(false)} 
                  className="p-3 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <PDFTextbook 
                key={`solar-chapter-home-${Date.now()}-${Math.random()}`}
                pdfUrl={`/media/chapters/solar.pdf?t=${Date.now()}&v=${Math.random()}`}
                onPopupClick={(selectedText) => {
                  console.log('Text selected from solar chapter PDF on Home Page:', selectedText);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col animate-scale-in"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#007bff] to-[#6f42c1] text-white p-6 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <FileText size={28} className="text-white" />
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold">Solar System Summary</h2>
                  <p className="text-sm text-white/80 mt-1">Key Points & Overview</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setShowSummaryModal(false)} 
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-[#F8F7F0] rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                    Solar System Chapter Summary
                  </h3>
                  <button
                    onClick={handleTranslateSummary}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    disabled={summaryTranslating}
                  >
                    {summaryShowTranslation ? 'View Original' : 'Translate to Arabic'}
                  </button>
                </div>
                <ul className="space-y-2">
                  {(summaryShowTranslation && summaryTranslatedItems ? summaryTranslatedItems : baseSummaryItems).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700" dir={summaryShowTranslation ? 'rtl' : 'ltr'}>
                      <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span className="leading-relaxed {summaryShowTranslation ? 'text-right' : ''}">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent; 