import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Share2, Search, Video, RefreshCw, FileText, BookOpen, Edit3, ThumbsUp, ThumbsDown, Copy, MoreHorizontal, X } from 'lucide-react';
import AskBuddyAIButton from './AskBuddyAIButton';
import axios from 'axios';
import PDFTextbook from './PDFTextbook';

// Add CSS for textbook styling
const textbookStyles = `
  .textbook-page {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .textbook-content p {
    text-align: justify;
    text-indent: 2rem;
    margin-bottom: 1rem;
    line-height: 1.8;
  }
  
  .textbook-content h3 {
    page-break-after: avoid;
  }
  
  .textbook-content mark {
    background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
    padding: 2px 4px;
    border-radius: 3px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  @media print {
    .textbook-page {
      box-shadow: none;
    }
  }
`;

const ResponsePage: React.FC = () => {
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();

  // Core states
  const [response, setResponse] = useState<any>(null);
  const [explanationType, setExplanationType] = useState('Textbook Explanation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState<{ [key: number]: boolean }>({}); // Add isRewriting state

  // Input and query states
  const [followUpQuery, setFollowUpQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');

  // Feature states
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const recognitionRef = useRef<any>(null);
  const ttsUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Voice Session overlay state
  const [isVoiceSession, setIsVoiceSession] = useState(false);
  const [sessionTurns, setSessionTurns] = useState<ChatMessage[]>([]);
  const [sessionPartial, setSessionPartial] = useState<string>('');
  const [showCaptions, setShowCaptions] = useState<boolean>(false); // accessibility toggle (off by default)
  const [sessionStatus, setSessionStatus] = useState<string>('Ready');
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Simple text selection states
  const [showHighlightPopup, setShowHighlightPopup] = useState(false);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  // Draft mode: snapshot of the current selector to use at next submit
  const [draftMode, setDraftMode] = useState<'textbook' | 'detailed' | 'advanced'>('textbook');

  // Chat history (persistent conversation)
  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    mode?: 'textbook' | 'detailed' | 'advanced';
    used_mode?: 'textbook' | 'detailed' | 'advanced';
    mode_notes?: string;
    // Translation state
    id?: string;
    language?: 'en' | 'ar';
    originalText?: string;
    translatedText?: string;
    translatedTo?: 'en' | 'ar';
    showTranslation?: boolean;
  }
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [autoTranslateToArabic, setAutoTranslateToArabic] = useState<boolean>(false);
  const [translationAvailable, setTranslationAvailable] = useState<boolean>(false);
  const leftPaneRef = useRef<HTMLDivElement | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  // Modal states
  const [showFullChapterModal, setShowFullChapterModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [chapterContent, setChapterContent] = useState<string>('');
  // Suggested Questions translation state
  const [sqTranslating, setSqTranslating] = useState(false);
  const [sqShowTranslation, setSqShowTranslation] = useState(false);
  const [sqTranslated, setSqTranslated] = useState<string[] | null>(null);
  // Summary translation state (ResponsePage modal)
  const [rspSummaryTranslating, setRspSummaryTranslating] = useState(false);
  const [rspSummaryShowTranslation, setRspSummaryShowTranslation] = useState(false);
  const [rspSummaryTranslated, setRspSummaryTranslated] = useState<string[] | null>(null);

  // All useCallback hooks MUST be declared here, before any conditional logic
  const handleRewrite = useCallback(async (index: number) => {
    // Prevent multiple simultaneous rewrites
    if (isRewriting[index]) return;

    // Create a copy of the current chat history
    const updatedHistory = [...chatHistory];
    
    try {
      // Start rewriting for this specific message
      setIsRewriting(prev => ({ ...prev, [index]: true }));

      // Find the corresponding user message
      const userMessage = updatedHistory.slice(0, index).reverse()
        .find(msg => msg.role === 'user');

      if (!userMessage) {
        console.error('No user message found for rewrite');
        return;
      }

      // Call backend rewrite endpoint
      const response = await axios.post('/api/core/rewrite-answer/', {
        user_prompt: userMessage.content,
        mode: explanationType,
        conversation_context: updatedHistory.slice(0, index),
        turn_index: index
      });

      // Update the specific assistant message
      if (response.data.success) {
        updatedHistory[index] = {
          role: 'assistant',
          content: response.data.answer,
          mode: explanationType
        };

        setChatHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Error rewriting answer:', error);
    } finally {
      // Stop rewriting for this message
      setIsRewriting(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  }, [chatHistory, explanationType, isRewriting]);

  const handleModeChange = useCallback(async () => {
    // If there's a last assistant message, rewrite it
    const lastAssistantIndex = chatHistory.reduceRight((foundIndex, msg, index) => {
      return msg.role === 'assistant' && foundIndex === -1 ? index : foundIndex;
    }, -1);

    if (lastAssistantIndex !== -1) {
      await handleRewrite(lastAssistantIndex);
    }
  }, [chatHistory, handleRewrite]);

  const images = {
    main: '/media/main.png',
    thumbnails: ['/media/thumbnail1.png', '/media/thumbnail2.png']
  };

  // Initialize response and explanation type from URL
  useEffect(() => {
    // Check translation provider availability
    (async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/core/translate/status/`);
        setTranslationAvailable(!!res.data?.configured);
      } catch {
        setTranslationAvailable(false);
      }
    })();

    if (location.state?.response) {
      const initial = location.state.response;
      setResponse(initial);
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
      // Seed chat history once with initial Q/A
      setChatHistory((prev) => {
        if (prev.length > 0) return prev;
        const seeded: ChatMessage[] = [];
        if (initial?.query) {
          seeded.push({ role: 'user', content: initial.query, language: detectLang(initial?.query) });
        }
        if (initial?.answer) {
          seeded.push({ role: 'assistant', content: initial.answer, used_mode: (initial.used_mode as any), language: 'en', originalText: initial.answer });
        }
        return seeded;
      });
    } else {
      navigate('/home');
    }
  }, [location, navigate]);

  // Handle scroll to hide popup - handled by the useHighlightPopup hook

  // Close more options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Handle more options dropdown
      if (showMoreOptions) {
        setShowMoreOptions(false);
      }
      
      // Handle highlight popup
      if (showHighlightPopup && !target.closest('.highlight-popup')) {
        setShowHighlightPopup(false);
      }
    };

    const handleScroll = () => {
      if (showHighlightPopup) {
        setShowHighlightPopup(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHighlightPopup(false);
        if (isInputExpanded) {
          setIsInputExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMoreOptions, showHighlightPopup, isInputExpanded]);

  // Keep draft mode aligned with current selector value; this does not trigger any request
  useEffect(() => {
    setDraftMode(getLevelForBackend(explanationType) as 'textbook' | 'detailed' | 'advanced');
  }, [explanationType]);

  // Auto-scroll controller: keep bottom unless user scrolls up
  useEffect(() => {
    const container = leftPaneRef.current;
    if (!container) return;
    if (isAutoScroll) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isAutoScroll]);

  if (!response) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        Loading content...
      </div>
    );
  }

  const displayQuery = response.query ? response.query.charAt(0).toUpperCase() + response.query.slice(1) : 'Unknown Topic';

  // Function to handle new query submission from highlight-to-ask
  const handleNewQuery = async (query: string) => {
    try {
      setIsLoading(true);
      const apiResponse = await axios.get(`http://localhost:8000/api/core/get-answer/`, {
        params: {
          query,
          level: getLevelForBackend(explanationType)
        }
      });

      // Navigate to new response page
      navigate('/response', {
        state: { response: apiResponse.data }
      });

      // Update URL with query parameters
      window.history.pushState(
        null, 
        '', 
        `/response?query=${encodeURIComponent(query)}&level=${getLevelForBackend(explanationType)}`
      );
    } catch (err: any) {
      console.error('Error submitting new query:', err);
      setError(err.response?.data?.error || 'Failed to submit query. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeftPaneScroll = () => {
    const container = leftPaneRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // If user is near bottom, enable auto-scroll; otherwise lock
    setIsAutoScroll(distanceFromBottom < 80);
  };

  // Voice Session helpers
  const startTTS = (text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => /en-US/i.test(v.lang) && /Female|Samantha|Google US English|Jenny|Aria/i.test(v.name)) || voices.find(v => /en/i.test(v.lang));
      if (preferred) utter.voice = preferred;
      utter.onstart = () => setMicState('speaking');
      utter.onend = () => {
        setMicState('idle');
        // Auto resume listening if still in session
        if (isVoiceSession) startListeningInSession();
      };
      ttsUtteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const processVoiceTurn = async (finalText: string) => {
    if (!finalText.trim()) return;
    const requestedMode = draftMode;
    // Append user turn to session buffer
    const userTurn: ChatMessage = { role: 'user', content: finalText.trim(), mode: requestedMode };
    setSessionTurns(prev => [...prev, userTurn]);
    setSessionPartial('');
    setMicState('processing');
    try {
    setIsLoading(true);
      // Build history: existing chat + session so far + this user turn
      const tempHistory = [...chatHistory, ...[...sessionTurns, userTurn]];
      const chatResponse = await axios.post(`http://localhost:8000/api/core/chat/`, {
        message: finalText.trim(),
        level: requestedMode,
        history: tempHistory,
      });
      const { answer, used_mode, mode_notes } = chatResponse.data || {};
      const assistantTurn: ChatMessage = { role: 'assistant', content: answer || '', used_mode, mode_notes };
      setSessionTurns(prev => [...prev, assistantTurn]);
      // Speak the reply
      if (answer) startTTS(answer);
    } catch {
      // Ignore errors in MVP loop
    } finally {
      setIsLoading(false);
    }
  };

  const startListeningInSession = () => {
    try {
      const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { return; }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.continuous = false; // single utterance; we'll restart on end
      rec.onstart = () => { setMicState('listening'); setSessionStatus('Listening…'); };
      rec.onend = () => {
        if (isVoiceSession && micState !== 'speaking') {
          // Keep listening loop if session ongoing
          try { rec.start(); } catch {}
        } else {
          setMicState('idle');
        }
      };
      rec.onerror = (e: any) => { setMicState('idle'); setSessionStatus(e?.error || 'Mic error'); };
      rec.onresult = (e: any) => {
        let interim = '';
        let finalText = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += transcript + ' ';
          else interim += transcript;
        }
        if (finalText.trim()) {
          processVoiceTurn(finalText);
        } else {
          // Update live captions only if accessibility toggle is on; otherwise ignore
          if (showCaptions) setSessionPartial(interim.trim());
        }
      };
      rec.start();
    } catch {}
  };

  const openVoiceSession = () => {
    setIsVoiceSession(true);
    setSessionTurns([]);
    setSessionPartial('');
    setSessionStatus('Ready');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    // Pre-warm mic permission, then start listening
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        // immediately stop tracks (we only want permission)
        stream.getTracks().forEach(t => t.stop());
        startListeningInSession();
      }).catch(() => {
        startListeningInSession();
      });
    } else {
      startListeningInSession();
    }
  };

  const closeVoiceSession = () => {
    setIsVoiceSession(false);
    try { if (recognitionRef.current) recognitionRef.current.stop(); } catch {}
    recognitionRef.current = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setMicState('idle');
    // Append buffered session turns to main chat history
    if (sessionTurns.length > 0) {
      setChatHistory(prev => [...prev, ...sessionTurns]);
      // Update response panel with latest assistant answer if present
      const lastAssistant = [...sessionTurns].reverse().find(t => t.role === 'assistant');
      if (lastAssistant) {
        setResponse((prev: any) => ({ ...(prev || {}), answer: lastAssistant.content }));
      }
    }
  };

  // Simple text selection handlers
  const handleTextSelection = (event: React.MouseEvent | React.TouchEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      setShowHighlightPopup(false);
      return;
    }

    // Check if selection is from the lesson content
    const target = event.target as HTMLElement;
    const isFromLessonContent = target.closest('.lesson-content, .answer-text') !== null;
    const isInsideInteractiveElement = target.closest('button, input, textarea, select, a') !== null;

    if (!isFromLessonContent || isInsideInteractiveElement) {
      setShowHighlightPopup(false);
      return;
    }

    const text = selection.toString().trim();
    setSelectedText(text);

    // Get selection coordinates
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
  };

  const handlePopupClick = () => {
    setShowHighlightPopup(false);
    
    // Show the selected text in bubble format and clear the input
    if (selectedText) {
      setFollowUpQuery(''); // Clear the input field
      setIsInputExpanded(true);
      // Capture current selector into draft mode for this pending message
      setDraftMode(getLevelForBackend(explanationType) as 'textbook' | 'detailed' | 'advanced');
      
      // Focus the existing input field
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder="Ask anything"], input[placeholder="Ask follow-up"]') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 100);
    }
    
    window.getSelection()?.removeAllRanges();
  };

  const handleCloseExpandedInput = () => {
    setIsInputExpanded(false);
    setFollowUpQuery('');
  };

  // PDF text selection handler - matches ResponsePage popup behavior
  const handlePDFTextSelection = (selectedText: string) => {
    if (!selectedText || selectedText.trim() === '') {
      return;
    }

    const text = selectedText.trim();
    
    // Clear the input field and expand it (same as handlePopupClick)
    setFollowUpQuery('');
    setIsInputExpanded(true);
    setSelectedText(text); // Store the selected text for the bubble
    setDraftMode(getLevelForBackend(explanationType) as 'textbook' | 'detailed' | 'advanced');
    
    // Focus the existing input field
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder="Ask anything"], input[placeholder="Ask follow-up"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
    
    console.log('PDF text selected for bubble:', text);
  };

  // Helper: focus the main input
  const focusMainInput = () => {
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder="Ask anything"], input[placeholder="Ask follow-up"]') as HTMLInputElement;
      if (inputElement) inputElement.focus();
    }, 50);
  };

  // Function to handle explanation type change (no API call)
  const handleExplanationTypeChange = (newExplanationType: string) => {
    setExplanationType(newExplanationType);
    // Update draft mode only; execution happens on explicit submit
    setDraftMode(getLevelForBackend(newExplanationType) as 'textbook' | 'detailed' | 'advanced');
  };



  // Function to handle voice mode
  const handleVoiceMode = () => {
    setIsVoiceMode(!isVoiceMode);
    // TODO: Implement actual voice recognition logic
  };

  // Function to handle follow-up query submission
  const handleFollowUpSubmit = async () => {
    // Combine selected text and user input
    const queryToSubmit = isInputExpanded && selectedText 
      ? `${selectedText}${followUpQuery.trim() ? ' - ' + followUpQuery.trim() : ''}` 
      : followUpQuery.trim();
    
    if (!queryToSubmit) return;

    try {
      setIsLoading(true);

      // Append user message locally first for immediate feedback
      const requestedMode = draftMode;
      const nextHistory: ChatMessage[] = [...chatHistory, { role: 'user' as const, content: queryToSubmit, mode: requestedMode }];
      setChatHistory(nextHistory);

      // Call conversational endpoint with history (multi-turn)
      const chatResponse = await axios.post(`http://localhost:8000/api/core/chat/`, {
        message: queryToSubmit,
        level: requestedMode,
        history: nextHistory,
      });

      const { answer, suggested_questions, level, used_mode, mode_notes } = chatResponse.data || {};

      // Append assistant reply to chat, with optional auto-translate to AR
      if (answer) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: answer, used_mode, mode_notes, originalText: answer, language: 'en' };
        if (translationAvailable && autoTranslateToArabic) {
          try {
            // Optimistically add then update after translation
            setChatHistory((prev) => [...prev, { ...assistantMsg, showTranslation: true, translatedText: '...', translatedTo: 'ar' }]);
            const { text } = await translateText(answer, 'ar', 'en');
            setChatHistory((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, translatedText: text, translatedTo: 'ar', showTranslation: true } : m));
          } catch {
            setChatHistory((prev) => [...prev, assistantMsg]);
          }
        } else {
          setChatHistory((prev) => [...prev, assistantMsg]);
        }
      }

      // Keep legacy response object in sync (for existing UI pieces)
      setResponse((prev: any) => ({
        ...(prev || {}),
        query: queryToSubmit,
        answer: answer || (prev?.answer ?? ''),
        suggested_questions: suggested_questions || prev?.suggested_questions || [],
        level: level || requestedMode,
        used_mode,
        mode_notes,
      }));

      // Update URL (no navigation/reload)
      window.history.pushState(null, '', `/response?query=${encodeURIComponent(queryToSubmit)}&level=${requestedMode}`);

      // Reset follow-up query and expanded state
      setFollowUpQuery('');
      setIsInputExpanded(false);
      setSelectedText('');
      // Reset draft mode to reflect current selector for the next message
      setDraftMode(getLevelForBackend(explanationType) as 'textbook' | 'detailed' | 'advanced');
      // If voice mode is active, speak the response
      if (isVoiceMode && answer && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(answer);
          utter.lang = 'en-US';
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => /en-US/i.test(v.lang) && /Female|Samantha|Google US English|Jenny|Aria/i.test(v.name)) || voices.find(v => /en/i.test(v.lang));
          if (preferred) utter.voice = preferred;
          utter.onstart = () => setMicState('speaking');
          utter.onend = () => setMicState('idle');
          ttsUtteranceRef.current = utter;
          window.speechSynthesis.speak(utter);
        } catch {}
      }
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

  // Language utils (function declarations are hoisted, safe for earlier use in render/effects)
  function isArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
  }
  function detectLang(text?: string): 'en' | 'ar' {
    return text && isArabic(text) ? 'ar' : 'en';
  }

  const translateText = async (text: string, target: 'en' | 'ar', source?: 'en' | 'ar') => {
    try {
      const resp = await axios.post(`http://localhost:8000/api/core/translate/`, {
        text,
        sourceLang: source,
        targetLang: target,
      }, { timeout: 30000 });
      if (resp.data?.success) {
        return { text: resp.data.translatedText as string, detected: (resp.data.sourceLangDetected as 'en' | 'ar') };
      }
      throw new Error(resp.data?.error || 'Translation failed');
    } catch (e: any) {
      throw new Error(e?.message || 'Translation error');
    }
  };

  const translateArray = async (items: string[], target: 'en' | 'ar', source?: 'en' | 'ar') => {
    const results: string[] = [];
    for (const item of items) {
      try {
        const { text } = await (async () => {
          const resp = await axios.post(`http://localhost:8000/api/core/translate/`, { text: item, sourceLang: source, targetLang: target }, { timeout: 15000 });
          if (resp.data?.success) return { text: resp.data.translatedText as string };
          return { text: item };
        })();
        results.push(text);
      } catch {
        results.push(item);
      }
    }
    return results;
  };

  const handleToggleTranslation = async (index: number) => {
    const msg = chatHistory[index];
    if (!msg || msg.role !== 'assistant') return;
    const visible = msg.showTranslation;
    const currentLang = msg.language || detectLang(msg.content);
    const target = currentLang === 'en' ? 'ar' : 'en';
    const baseText = msg.originalText || msg.content;

    // If we already have translation and toggling view only
    if (msg.translatedText && msg.translatedTo === target) {
      setChatHistory(prev => prev.map((m, i) => i === index ? { ...m, showTranslation: !visible } : m));
      return;
    }

    // Show loading skeleton by temporarily setting placeholder
    setChatHistory(prev => prev.map((m, i) => i === index ? { ...m, translatedText: '...', translatedTo: target, showTranslation: true } : m));
    try {
      const { text, detected } = await translateText(baseText, target, currentLang);
      setChatHistory(prev => prev.map((m, i) => i === index ? {
        ...m,
        language: detected as any,
        originalText: baseText,
        translatedText: text,
        translatedTo: target,
        showTranslation: true,
      } : m));
    } catch (e) {
      // On failure, revert view but keep original
      setChatHistory(prev => prev.map((m, i) => i === index ? { ...m, showTranslation: false } : m));
      setError('Translation unavailable. View original.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle View Full Chapter
  const handleViewFullChapter = async () => {
    if (!response) return;
    setShowFullChapterModal(true);
  };

  // Handle View Summary
  const handleViewSummary = () => {
    if (!response) return;
    setShowSummaryModal(true);
  };

  // Generate summary from current answer
  const generateSummary = (answer: string) => {
    if (!answer) return ['No answer available to summarize.'];
    
    // Simple summary generation - extract key sentences
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= 3) {
      return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Take first, middle, and last sentences for a balanced summary
    const summary = [
      sentences[0]?.trim(),
      sentences[Math.floor(sentences.length / 2)]?.trim(),
      sentences[sentences.length - 1]?.trim()
    ].filter(s => s && s.length > 0);
    
    return summary.length > 0 ? summary : ['Summary not available.'];
  };

  // Get chapter title from query
  const getChapterTitle = (query: string) => {
    if (!query) return 'Chapter Content';
    
    // Common science topics mapping
    const topicMap: Record<string, string> = {
      'solar system': 'The Solar System',
      'sun': 'The Sun and Solar Energy',
      'planets': 'Planets and Their Characteristics',
      'earth': 'Planet Earth',
      'moon': 'The Moon and Its Phases',
      'stars': 'Stars and Constellations',
      'gravity': 'Gravity and Forces',
      'photosynthesis': 'Photosynthesis and Plant Life',
      'water cycle': 'The Water Cycle',
      'weather': 'Weather and Climate',
      'animals': 'Animal Kingdom',
      'ecosystem': 'Ecosystems and Environment',
      'energy': 'Forms of Energy',
      'matter': 'States of Matter',
      'atom': 'Atomic Structure',
      'cell': 'Cell Biology'
    };
    
    const lowerQuery = query.toLowerCase();
    for (const [key, title] of Object.entries(topicMap)) {
      if (lowerQuery.includes(key)) {
        return title;
      }
    }
    
    // Capitalize first letter of each word as fallback
    return query.replace(/\b\w/g, l => l.toUpperCase());
  };



  return (
    <>
    <style>
      {`
        ${textbookStyles}
        ::selection {
          background-color: #fb923c;
          color: white;
        }
        ::-moz-selection {
          background-color: #fb923c;
          color: white;
        }
      `}
    </style>
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#F8F7F0] p-4 flex flex-col h-full fixed left-0 top-0 bottom-0 overflow-y-auto">
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
      <div className="flex-1 ml-64 overflow-y-auto">
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

            {/* Auto-translate to Arabic toggle */}
            {translationAvailable && (
              <label className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border border-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoTranslateToArabic}
                  onChange={(e) => setAutoTranslateToArabic(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Auto-translate to Arabic</span>
              </label>
            )}

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
          <button 
            onClick={handleViewFullChapter}
            disabled={!response}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg transition-all duration-200 text-sm font-medium group ${
              !response 
                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
            title={!response ? "Ask a question first" : "View the full textbook chapter"}
          >
            <FileText className={`w-5 h-5 transition-colors ${
              !response 
                ? 'text-gray-400' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`} />
            <span>View Full Chapter</span>
          </button>
          <button 
            onClick={handleViewSummary}
            disabled={!response}
            className={`flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg transition-all duration-200 text-sm font-medium group ${
              !response 
                ? 'text-gray-400 cursor-not-allowed bg-gray-50' 
                : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
            title={!response ? "Ask a question first" : "View a summary of the answer"}
          >
            <BookOpen className={`w-5 h-5 transition-colors ${
              !response 
                ? 'text-gray-400' 
                : 'text-gray-500 group-hover:text-gray-700'
            }`} />
            <span>View Summary</span>
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="flex flex-1">
          {/* Left Column - Main Q&A Section (70%) */}
          <div
            className="w-[70%] h-full overflow-y-auto p-8 bg-white"
            ref={leftPaneRef}
            onScroll={handleLeftPaneScroll}
          >
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
                  {/* Speaker Button - reads latest answer */}
                  <button
                    aria-label="Read latest answer"
                    title="Read latest answer"
                    onClick={() => {
                      try {
                        // If already speaking, stop immediately
                        if ('speechSynthesis' in window && micState === 'speaking') {
                          window.speechSynthesis.cancel();
                          setMicState('idle');
                          return;
                        }

                        // Find the most recent assistant message
                        let latestText = '';
                        for (let i = chatHistory.length - 1; i >= 0; i--) {
                          const msg = chatHistory[i];
                          if (msg.role === 'assistant' && msg.content && msg.content.trim().length > 0) {
                            latestText = msg.content.trim();
                            break;
                          }
                        }

                        if (!latestText) return; // Nothing to read yet

                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                          const utter = new SpeechSynthesisUtterance(latestText);
                          utter.lang = 'en-US';
                          const voices = window.speechSynthesis.getVoices();
                          const preferred = voices.find(v => /en-US/i.test(v.lang) && /Female|Samantha|Google US English|Jenny|Aria/i.test(v.name)) || voices.find(v => /en/i.test(v.lang));
                          if (preferred) utter.voice = preferred;
                          utter.onstart = () => setMicState('speaking');
                          utter.onend = () => setMicState('idle');
                          ttsUtteranceRef.current = utter;
                          window.speechSynthesis.speak(utter);
                        }
                      } catch {}
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 transition-all ${micState==='speaking' ? 'bg-green-100 animate-pulse' : 'bg-white hover:bg-gray-100'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-700">
                      <path d="M3 10v4a1 1 0 001 1h2l3 3V6L6 9H4a1 1 0 00-1 1z"/>
                      <path d="M16.5 12a4.5 4.5 0 00-2.25-3.897v7.794A4.5 4.5 0 0016.5 12z"/>
                      <path d="M14.25 5.5v13a7 7 0 000-13z"/>
                    </svg>
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

            {/* Chat Section */}
            <div className="prose max-w-none mb-8">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500">Start the conversation by asking a question.</div>
              ) : (
                <div className="space-y-6">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className="">
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-blue-50 text-gray-800 px-4 py-2 rounded-2xl rounded-tr-sm whitespace-pre-wrap">
                            <div className="flex items-center justify-end gap-2 mb-1">
                              {msg.mode && (
                                <span className="text-[10px] uppercase tracking-wide text-blue-700 bg-blue-100 rounded px-2 py-0.5">{msg.mode}</span>
                              )}
                            </div>
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`lesson-content answer-text text-base leading-7 ${msg.showTranslation && (msg.translatedTo === 'ar') ? 'text-gray-800' : 'text-gray-700'}`}
                          onMouseUp={handleTextSelection}
                          onTouchEnd={handleTextSelection}
                          style={{ userSelect: 'text' }}
                        >
                          {isLoading && idx === chatHistory.length - 1 ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Generating {explanationType.toLowerCase()}...</span>
                  </div>
                ) : (
                            <>
                              <div className="flex items-center gap-2 mb-2">
                                {msg.used_mode && (
                                  <span className="text-[10px] uppercase tracking-wide text-gray-700 bg-gray-100 rounded px-2 py-0.5">{msg.used_mode}</span>
                                )}
                                {msg.mode_notes && (
                                  <span className="text-[10px] text-amber-700 bg-amber-100 rounded px-2 py-0.5">{msg.mode_notes}</span>
                )}
                                {/* Translation badge and toggle */}
                                {(() => {
                                  const currentLang = msg.language || detectLang(msg.content);
                                  const isAR = msg.showTranslation ? (msg.translatedTo === 'ar') : (currentLang === 'ar');
                                  const pill = msg.showTranslation ? (msg.translatedTo === 'ar' ? 'Translated from EN' : 'Translated from AR') : undefined;
                                  return (
                                    <div className="ml-auto flex items-center gap-2">
                                      {pill && (
                                        <span className="text-[10px] uppercase tracking-wide text-purple-700 bg-purple-100 rounded px-2 py-0.5">{pill}</span>
                                      )}
                                      <button
                                        onClick={() => handleToggleTranslation(idx)}
                                        className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50"
                                        title={isAR ? 'Translate to English' : 'Translate to Arabic'}
                                      >
                                        {isAR ? 'Translate to English' : 'Translate to Arabic'}
                                      </button>
                                    </div>
                                  );
                                })()}
              </div>
                              <div dir={(msg.showTranslation && msg.translatedTo === 'ar') ? 'rtl' : 'ltr'} className={(msg.showTranslation && msg.translatedTo === 'ar') ? 'text-right' : 'text-left'}>
                                {msg.showTranslation ? (msg.translatedText || '') : msg.content}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    onClick={() => handleRewrite(chatHistory.length - 1)}
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

            {/* Suggested Questions (click-to-input) */}
              {(response.suggested_questions && response.suggested_questions.length > 0) || isLoading ? (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Suggested Questions</h3>
                  {response.suggested_questions && response.suggested_questions.length > 0 && (
                    <button
                      onClick={async () => {
                        if (sqTranslating) return;
                        try {
                          setSqTranslating(true);
                          if (!sqShowTranslation) {
                            const translated = await translateArray(response.suggested_questions, 'ar', 'en');
                            setSqTranslated(translated);
                            setSqShowTranslation(true);
                          } else {
                            setSqShowTranslation(false);
                          }
                        } finally {
                          setSqTranslating(false);
                        }
                      }}
                      title={sqShowTranslation ? 'View EN' : 'View AR'}
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                      disabled={sqTranslating}
                    >
                      {sqShowTranslation ? 'AR→EN' : 'EN→AR'}
                    </button>
                  )}
                </div>
                <div className={`border-t border-gray-200 divide-y divide-gray-200 ${isLoading ? 'opacity-50' : ''}`}>
                  {isLoading ? (
                    <div className="py-3 flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Loading new questions...</span>
                    </div>
                  ) : (
                    (sqShowTranslation && sqTranslated ? sqTranslated : response.suggested_questions).map((question: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setIsInputExpanded(false);
                          setSelectedText('');
                          setFollowUpQuery(question);
                          focusMainInput();
                        }}
                        className="w-full text-left py-3 px-0 text-gray-700 hover:bg-gray-50 transition-colors"
                        dir={sqShowTranslation ? 'rtl' : 'ltr'}
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
                  <div className="relative">
                    {isInputExpanded ? (
                      /* Expanded input with selected text inside */
                      <div className="w-full border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-blue-500 p-3 pr-20 min-h-[80px]">
                        {/* Close button */}
                        <button
                          onClick={handleCloseExpandedInput}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                          title="Close"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {/* Selected text bubble with return arrow */}
                        <div className="flex items-center space-x-2 mb-3 mr-16">
                          {/* Return/Enter arrow */}
                          <div className="flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                              <path 
                                d="M13 10L9 6M13 10L9 14M13 10H3V4" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md flex-1 min-w-0">
                            <span className="text-sm truncate block">
                              {selectedText.length > 80 ? `${selectedText.substring(0, 80)}...` : selectedText}
                            </span>
                          </div>
                        </div>
                        
                        {/* Input field inside */}
                <input
                  type="text"
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                          placeholder="Ask anything"
                          className="w-full border-none outline-none text-gray-700 placeholder-gray-400 mr-16"
                        />
                      </div>
                    ) : (
                      /* Normal input field */
                      <input
                        type="text"
                        value={followUpQuery}
                        onChange={(e) => setFollowUpQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                  placeholder="Ask follow-up"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    )}
                  </div>
                )}
                <div className={`absolute right-2 flex items-center space-x-2 ${isInputExpanded ? 'bottom-2' : 'top-1/2 transform -translate-y-1/2'}`}>
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
                          setFollowUpQuery((finalText || interim).trim());
                        };
                        rec.start();
                      } catch {}
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micState==='listening' ? 'bg-red-600 animate-pulse' : 'bg-black hover:bg-gray-800'}`}
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
                    onClick={followUpQuery.trim() ? handleFollowUpSubmit : openVoiceSession}
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

    {/* Full Chapter Modal */}
    {showFullChapterModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
        <div 
          id="full-chapter-modal" 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col animate-scale-in textbook-page-shadow"
        >
           {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#007bff] to-[#6f42c1] text-white p-8 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen size={32} className="text-white" />
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold">Science Textbook</h2>
                <p className="text-sm text-white/80 mt-1">Chapter: {getChapterTitle(response?.query || '')}</p>
              </div>
            </div>
             <div className="flex items-center space-x-2">
               <button
                 onClick={async () => {
                   if (rspSummaryTranslating) return;
                   try {
                     setRspSummaryTranslating(true);
                     const summaryItems = generateSummary(response?.answer || '');
                     if (!rspSummaryShowTranslation) {
                       const translated = await translateArray(summaryItems, 'ar', 'en');
                       setRspSummaryTranslated(translated);
                       setRspSummaryShowTranslation(true);
                     } else {
                       setRspSummaryShowTranslation(false);
                     }
                   } finally {
                     setRspSummaryTranslating(false);
                   }
                 }}
                 title={rspSummaryShowTranslation ? 'View EN' : 'View AR'}
                 className="text-xs px-2 py-1 border rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                 disabled={rspSummaryTranslating}
               >
                {rspSummaryShowTranslation ? 'AR→EN' : 'EN→AR'}
               </button>
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
                key={`solar-chapter-response-${Date.now()}-${Math.random()}`}
                pdfUrl={`/media/chapters/solar.pdf?t=${Date.now()}&v=${Math.random()}`}
                onPopupClick={handlePDFTextSelection}
              />
          </div>
        </div>
      </div>
    )}

    {/* Summary Modal */}
    {showSummaryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-800">{rspSummaryShowTranslation ? 'ملخص الإجابة' : 'Answer Summary'}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (rspSummaryTranslating) return;
                  try {
                    setRspSummaryTranslating(true);
                    const items = generateSummary(response?.answer || '');
                    if (!rspSummaryShowTranslation) {
                      const translated = await translateArray(items, 'ar', 'en');
                      setRspSummaryTranslated(translated);
                      setRspSummaryShowTranslation(true);
                    } else {
                      setRspSummaryShowTranslation(false);
                    }
                  } finally {
                    setRspSummaryTranslating(false);
                  }
                }}
                    title={rspSummaryShowTranslation ? 'View EN' : 'View AR'}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    disabled={rspSummaryTranslating}
                  >
                    {rspSummaryShowTranslation ? 'AR→EN' : 'EN→AR'}
                  </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            <div className="bg-[#F8F7F0] rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2" dir={rspSummaryShowTranslation ? 'rtl' : 'ltr'}>
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                {rspSummaryShowTranslation ? 'أهم النقاط' : 'Key Takeaways'}
              </h3>
              <ul className="space-y-2">
                {(rspSummaryShowTranslation && rspSummaryTranslated ? rspSummaryTranslated : generateSummary(response?.answer || '')).map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700" dir={rspSummaryShowTranslation ? 'rtl' : 'ltr'}>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span 
                      className="leading-relaxed lesson-content"
                      onMouseUp={handleTextSelection}
                      onTouchEnd={handleTextSelection}
                      style={{ userSelect: 'text' }}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
              <div className="flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                  {rspSummaryShowTranslation ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
      {/* Highlight-to-Ask Components */}
      <AskBuddyAIButton
        position={highlightPopupPosition}
        onAsk={handlePopupClick}
        visible={showHighlightPopup}
      />

      {/* Voice Session Overlay */}
      {isVoiceSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-6">
            <div className="w-full flex items-center justify-between">
              <div className="text-sm text-gray-600">{sessionStatus}</div>
              <div className="flex items-center gap-3">
                {/* Optional captions toggle, off by default */}
                <label className="flex items-center gap-1 text-xs text-gray-600 select-none">
                  <input type="checkbox" checked={showCaptions} onChange={(e)=>setShowCaptions(e.target.checked)} />
                  Show captions
                </label>
                <button aria-label="End session" onClick={closeVoiceSession} className="p-2 rounded-full hover:bg-gray-100" title="End">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            {/* Animated orb/avatar */}
            <div className={`w-32 h-32 rounded-full ${micState==='listening' ? 'bg-blue-100 animate-pulse' : micState==='speaking' ? 'bg-green-100 animate-pulse' : 'bg-gray-100'} flex items-center justify-center`}> 
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-600"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0Z"/><path d="M12 18a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Z"/></svg>
            </div>
            {/* Big Mic Button */}
            <button
              aria-label={micState==='listening' ? 'Stop listening' : 'Start listening'}
              onClick={() => {
                if (micState==='speaking' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setMicState('idle');
                }
                if (micState==='listening') {
                  try { if (recognitionRef.current) recognitionRef.current.stop(); } catch {}
                  setMicState('idle');
                } else {
                  startListeningInSession();
                }
              }}
              className={`w-20 h-20 rounded-full text-white text-sm font-medium ${micState==='listening' ? 'bg-red-600 animate-pulse' : 'bg-black hover:bg-gray-800'}`}
            >
              {micState==='listening' ? 'Stop' : 'Mic'}
            </button>
            {/* Captions area only when enabled */}
            {showCaptions && (
              <div className="w-full text-center text-gray-600 text-sm">
                {sessionTurns.length>0 && <div className="mb-1">(Captions hidden in history; visible here only)</div>}
                {!!sessionPartial && <em>{sessionPartial}</em>}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                aria-label="Stop audio"
                onClick={() => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); setMicState('idle'); }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >Stop Audio</button>
            </div>
          </div>
        </div>
      )}
    </>
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