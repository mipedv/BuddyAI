import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Share2, Search, Video, RefreshCw, FileText, BookOpen, Edit3, ThumbsUp, ThumbsDown, Copy, MoreHorizontal } from 'lucide-react';
import axios from 'axios';

const ResponsePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [response, setResponse] = useState<any>(null);
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [explanationType, setExplanationType] = useState('Textbook Explanation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for voice mode
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  // Add states for new features
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const images = {
    main: '/media/main.png',
    thumbnails: ['/media/thumbnail1.png', '/media/thumbnail2.png']
  };

  React.useEffect(() => {
    if (location.state?.response) {
      setResponse(location.state.response);
      const levelParam = new URLSearchParams(location.search).get('level');
      if (levelParam) {
        switch (levelParam) {
          case 'textbook':
            setExplanationType('Textbook Explanation');
            break;
          case 'detailed':
            setExplanationType('Detailed Explanation');
            break;
          case 'advanced':
            setExplanationType('Advanced Explanation');
            break;
          default:
            setExplanationType('Textbook Explanation');
        }
      }
    } else {
      navigate('/home');
    }
  }, [location, navigate]);

  // Close more options dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (showMoreOptions) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  if (!response) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        Loading content...
      </div>
    );
  }

  const displayQuery = response.query ? response.query.charAt(0).toUpperCase() + response.query.slice(1) : 'Unknown Topic';

  // Function to handle explanation type change
  const handleExplanationTypeChange = async (newExplanationType: string) => {
    if (!response?.query || isLoading) return; // Prevent multiple simultaneous requests

    setIsLoading(true);
    setError(null);
    setExplanationType(newExplanationType);

    const newLevel = getLevelForBackend(newExplanationType);
    
    try {
      const apiResponse = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: {
          query: response.query,
          level: newLevel
        }
      });

      // Update the response with new data
      setResponse({
        ...response,
        answer: apiResponse.data.answer,
        suggested_questions: apiResponse.data.suggested_questions,
        level: newLevel
      });

      // Update URL without page reload
      const newUrl = `/response?query=${encodeURIComponent(response.query)}&level=${newLevel}`;
      window.history.pushState(null, '', newUrl);

    } catch (err: any) {
      console.error('Error fetching new explanation:', err);
      setError(err.response?.data?.error || 'Failed to fetch explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle voice mode
  const handleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    // TODO: Implement actual voice recognition logic
  };

  // Function to handle follow-up query submission
  const handleFollowUpSubmit = async () => {
    if (!followUpQuery.trim()) return;

    try {
      setIsLoading(true);
      const apiResponse = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: {
          query: followUpQuery,
          level: getLevelForBackend(explanationType)
        }
      });

      // Navigate to new response page with follow-up query
      navigate('/response', {
        state: { response: apiResponse.data }
      });

      // Update URL with query parameters
      window.history.pushState(
        null, 
        '', 
        `/response?query=${encodeURIComponent(followUpQuery)}&level=${getLevelForBackend(explanationType)}`
      );

      // Reset follow-up query
      setFollowUpQuery('');
    } catch (err: any) {
      console.error('Error submitting follow-up query:', err);
      setError(err.response?.data?.error || 'Failed to submit follow-up query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle media navigation
  const handleMediaNavigation = (type: 'images' | 'videos') => {
    const query = response?.query || 'solar system';
    navigate(`/media-gallery?q=${encodeURIComponent(query)}&type=${type}`);
  };

  // Function to handle edit query
  const handleEditQuery = () => {
    setIsEditing(true);
    setEditedQuery(response?.query || '');
  };

  // Function to save edited query
  const handleSaveEdit = async () => {
    if (!editedQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const apiResponse = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: {
          query: editedQuery,
          level: getLevelForBackend(explanationType)
        }
      });

      // Update the response with new data
      setResponse({
        ...response,
        query: editedQuery,
        answer: apiResponse.data.answer,
        suggested_questions: apiResponse.data.suggested_questions,
        level: getLevelForBackend(explanationType)
      });

      // Update URL without page reload
      const newUrl = `/response?query=${encodeURIComponent(editedQuery)}&level=${getLevelForBackend(explanationType)}`;
      window.history.pushState(null, '', newUrl);

      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating query:', err);
      setError(err.response?.data?.error || 'Failed to update query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedQuery('');
  };

  // Function to handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `BuddyAI - ${displayQuery}`,
          text: response?.answer || '',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        handleCopyToClipboard();
      }
    } else {
      handleCopyToClipboard();
    }
  };

  // Function to handle rewrite
  const handleRewrite = async () => {
    if (!response?.query || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const apiResponse = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: {
          query: response.query,
          level: getLevelForBackend(explanationType)
        }
      });

      // Update the response with new data
      setResponse({
        ...response,
        answer: apiResponse.data.answer,
        suggested_questions: apiResponse.data.suggested_questions,
      });

    } catch (err: any) {
      console.error('Error rewriting answer:', err);
      setError(err.response?.data?.error || 'Failed to rewrite answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle rating
  const handleRating = (type: 'up' | 'down') => {
    setRating(rating === type ? null : type);
    // TODO: Send rating to backend
    console.log(`Rated: ${type}`);
  };

  // Function to copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response?.answer || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-[#f5f4ef] p-4 flex flex-col">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mb-4 flex items-center justify-center space-x-2">
          <span className="text-lg">➕</span>
          <span>New Chat</span>
        </button>
        <div className="space-y-2 text-gray-600">
          <div className="px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center space-x-3">
            <span className="text-lg">📝</span>
            <span>Practice & Test</span>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center space-x-3">
            <span className="text-lg">🎓</span>
            <span>Classroom Recap</span>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center space-x-3">
            <span className="text-lg">💡</span>
            <span>Curiosity Centre</span>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center space-x-3">
            <span className="text-lg">📚</span>
            <span>Library</span>
          </div>
        </div>
        <div className="mt-auto px-4 py-2 text-gray-600 cursor-pointer flex items-center space-x-3">
          <span className="text-lg">👥</span>
          <span>Community</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-[#f6f6f1]">
          <div className="flex items-center space-x-4">
            <select
              value="Physics"
              className="px-3 py-2 border rounded-lg text-gray-700 bg-white"
              disabled
            >
              <option>Physics</option>
            </select>
            <select
              value="Solar System"
              className="px-3 py-2 border rounded-lg text-gray-700 bg-white"
              disabled
            >
              <option>Solar System</option>
            </select>
          </div>
          
          {/* Header Right */}
          <div className="flex items-center gap-x-6 bg-[#f6f6f1] p-2 rounded-lg">
            {/* Notification Bell */}
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">6</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-x-2 bg-white rounded-full px-3 py-1">
              <img
                src="https://flagcdn.com/w40/in.png"
                alt="Indian Flag"
                className="w-6 h-4 rounded"
              />
              <span className="text-sm">English</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-x-2">
              <img
                src="/boy.png"
                alt="User Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-sm">Zayan</p>
                <p className="text-xs text-gray-500">7th Standard</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10l5 5 5-5z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        {/* View Full Chapter and View Summary Buttons */}
        <div className="flex justify-end space-x-4 px-8 py-4 bg-[#f5f4ef]">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium group">
            <FileText className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span>View Full Chapter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium group">
            <BookOpen className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
            <span>View Summary</span>
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="flex flex-1">
          {/* Left Column - Main Q&A Section (70%) */}
          <div className="w-[70%] h-full overflow-y-auto p-8 bg-white">
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editedQuery}
                      onChange={(e) => setEditedQuery(e.target.value)}
                      className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 outline-none flex-1"
                      autoFocus
                    />
                    <button 
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      disabled={isLoading}
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold">{displayQuery}</h1>
                    <button 
                      onClick={handleEditQuery}
                      className="p-2 -mr-2 rounded-full hover:bg-gray-100" 
                      title="Edit query"
                    >
                      <Edit3 className="w-5 h-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {/* Answer Label */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM8 7.5V16.5L16 12L8 7.5Z" fill="currentColor"/>
                  </svg>
                  <span className="text-sm text-gray-700 font-medium">Answer</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Voice Mode Button */}
                  <button className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95" title="Listen to answer">
                    <img
                      src="/media/button logo.png"
                      alt="Voice Mode"
                      className="w-7 h-7 object-contain"
                    />
                  </button>

                  {/* Explanation Level Dropdown */}
                  <select
                    value={explanationType}
                    onChange={(e) => handleExplanationTypeChange(e.target.value)}
                    disabled={isLoading || isEditing}
                    className={`px-4 py-2.5 rounded-lg border border-gray-300 text-base bg-white min-w-[200px] font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isLoading || isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}`}
                  >
                    <option>Textbook Explanation</option>
                    <option>Detailed Explanation</option>
                    <option>Advanced Explanation</option>
                  </select>
                </div>
              </div>
              <div className="border-b border-gray-200 mt-4"></div> {/* Underline */}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Answer Section */}
            <div className="prose max-w-none mb-8">
              <div className={`text-base leading-7 text-gray-700 ${isLoading ? 'opacity-50' : ''}`}>
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Generating {explanationType.toLowerCase()}...</span>
                  </div>
                ) : (
                  response.answer
                )}
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button 
                    onClick={handleRewrite}
                    className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Rewrite
                  </button>
                  <button 
                    onClick={handleCopyToClipboard}
                    className={`flex items-center gap-2 text-sm ${copied ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isLoading}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {showMoreOptions && (
                      <div className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Save to Library
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Report Issue
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Rating Section */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Rate this answer:</span>
                  <button 
                    onClick={() => handleRating('up')}
                    className={`p-1 rounded-full hover:bg-gray-100 ${rating === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-500'}`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleRating('down')}
                    className={`p-1 rounded-full hover:bg-gray-100 ${rating === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-500'}`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            {(response.suggested_questions && response.suggested_questions.length > 0) || isLoading ? (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Suggested Questions</h3>
                <div className={`border-t border-gray-200 divide-y divide-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
                  {isLoading ? (
                    <div className="py-3 flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Loading new questions...</span>
                    </div>
                  ) : (
                    response.suggested_questions.map((question: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => navigate(`/response?query=${encodeURIComponent(question)}&level=${getLevelForBackend(explanationType)}`)}
                        className="w-full text-left py-3 px-0 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {question}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* Follow-up Input */}
            <div className="sticky bottom-0 w-full bg-white pt-4">
              <div className="relative">
                {isVoiceMode ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-blue-50 flex items-center justify-center text-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span>Listening... Speak now</span>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                    placeholder="Ask follow-up"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {/* Mic Button */}
                  <button 
                    onClick={() => console.log('Microphone clicked')}
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
                    onClick={followUpQuery.trim() ? handleFollowUpSubmit : handleVoiceMode}
                    className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    title={followUpQuery.trim() ? "Send" : "Voice Mode"}
                  >
                    {followUpQuery.trim() ? (
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
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Content (30%) */}
          <div className="w-[30%] h-full bg-[#f5f5f0] p-6 overflow-y-auto">
            {/* Image Results Grid */}
            <div className="mb-8">
              <img
                src={images.main}
                alt="Main visualization"
                className="w-full aspect-video rounded-xl object-cover mb-4"
              />
              <div className="grid grid-cols-2 gap-4 mb-0">
                {images.thumbnails.map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full aspect-video rounded-xl object-cover"
                  />
                ))}
              </div>
              <button 
                onClick={() => handleMediaNavigation('images')}
                className="w-full text-center py-2 bg-[#F8F7F0] text-gray-700 font-medium rounded-b-lg hover:bg-gray-100 transition-colors"
              >
                View more
              </button>
            </div>

            {/* Search Buttons */}
            <div className="space-y-4">
              <button 
                onClick={() => handleMediaNavigation('images')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-600" />
                  <span>Search Images</span>
                </div>
                <span className="text-gray-400 font-bold">+</span>
              </button>
              <button 
                onClick={() => handleMediaNavigation('videos')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-gray-600" />
                  <span>Search Videos</span>
                </div>
                <span className="text-gray-400 font-bold">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

export default ResponsePage; 