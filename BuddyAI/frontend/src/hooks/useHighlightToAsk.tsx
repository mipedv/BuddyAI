import { useState, useCallback } from 'react';

export type HighlightSource = 'pdf' | 'response' | 'summary' | 'chapter';

export interface HighlightPopupPosition {
  x: number;
  y: number;
}

export interface UseHighlightToAskReturn {
  selectedText: string;
  showHighlightPopup: boolean;
  setShowHighlightPopup: (show: boolean) => void;
  highlightPopupPosition: HighlightPopupPosition;
  handleTextSelection: (event: React.MouseEvent | React.TouchEvent) => void;
  handlePopupClick: () => void;
  followUpQuery: string;
  setFollowUpQuery: (query: string) => void;
  isInputExpanded: boolean;
  setIsInputExpanded: (expanded: boolean) => void;
  handleTextHighlight: (selectedText: string, source?: HighlightSource) => void;
}

/**
 * Custom hook for implementing "Highlight to Ask" functionality
 * 
 * @param source - The source type for logging and analytics
 * @returns Object containing state and handlers for highlight-to-ask feature
 */
export const useHighlightToAsk = (source: HighlightSource = 'response'): UseHighlightToAskReturn => {
  // State management
  const [selectedText, setSelectedText] = useState<string>('');
  const [showHighlightPopup, setShowHighlightPopup] = useState<boolean>(false);
  const [highlightPopupPosition, setHighlightPopupPosition] = useState<HighlightPopupPosition>({ x: 0, y: 0 });
  const [followUpQuery, setFollowUpQuery] = useState<string>('');
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(false);

  /**
   * Processes and adds selected text to the follow-up query
   */
  const processSelectedText = useCallback((text: string) => {
    console.log(`🔄 processSelectedText called with text: "${text}"`);
    const trimmedText = text.trim();
    const maxLength = 300;

    // Truncate if too long
    const truncatedText = trimmedText.length > maxLength 
      ? trimmedText.substring(0, maxLength) + '...' 
      : trimmedText;
    
    // Add to input field with "Explain this:" prefix
    const currentInput = followUpQuery.trim();
    let updatedQuery = '';
    
    if (currentInput && !currentInput.startsWith('Explain this:')) {
      updatedQuery = `${currentInput}, ${truncatedText}`;
    } else if (currentInput.startsWith('Explain this:')) {
      updatedQuery = `${currentInput}, ${truncatedText}`;
    } else {
      updatedQuery = `Explain this: ${truncatedText}`;
    }
    
    setFollowUpQuery(updatedQuery);
    setIsInputExpanded(true);
    console.log(`✅ Query updated to: "${updatedQuery}"`);
    console.log(`✅ Input expanded: true`);
  }, [followUpQuery, source]);

  /**
   * Handles text selection events
   */
  const handleTextSelection = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    console.log(`🎯 handleTextSelection called for source: ${source}`);
    const selection = window.getSelection();
    
    // Early exit if no text selected
    if (!selection || selection.toString().trim() === '') {
      setShowHighlightPopup(false);
      return;
    }

    // Context validation - check if selection is from valid content areas
    const target = event.target as HTMLElement;
    const isFromValidContent = target.closest('.lesson-content, .answer-text, .pdf-content, .summary-content, .chapter-content') !== null;
    const isInsideInteractiveElement = target.closest('button, input, textarea, select, a, [role="button"]') !== null;

    // Debug logging
    console.log('🔍 Text Selection Debug:', {
      selectedText: selection.toString().trim(),
      targetClass: target.className,
      isFromValidContent,
      isInsideInteractiveElement,
      targetElement: target.tagName,
      source: source,
      closestContent: target.closest('.lesson-content, .answer-text, .pdf-content, .summary-content, .chapter-content')
    });

    // Prevent selection in interactive elements or invalid content areas
    if (!isFromValidContent || isInsideInteractiveElement) {
      setShowHighlightPopup(false);
      return;
    }

    const text = selection.toString().trim();
    
    // Only show popup for meaningful text selections (minimum 3 characters)
    if (text.length < 3) {
      setShowHighlightPopup(false);
      return;
    }

    setSelectedText(text);

    // Calculate popup position
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position popup above the selection, centered horizontally
      const x = Math.max(10, Math.min(
        window.innerWidth - 150,
        rect.left + (rect.width / 2) - 75
      ));
      const y = Math.max(10, rect.top - 50);

      setHighlightPopupPosition({ x, y });
      setShowHighlightPopup(true);
      console.log(`✅ ${source} highlight popup shown at (${x}, ${y}) for text: "${text.substring(0, 30)}..."`);
    } catch (error) {
      console.warn('❌ Error calculating popup position:', error);
      setShowHighlightPopup(false);
    }
  }, [source]);

  /**
   * Handles popup click to process selected text
   */
  const handlePopupClick = useCallback(() => {
    console.log(`🎯 handlePopupClick called for source: ${source}, selectedText: "${selectedText}"`);
    setShowHighlightPopup(false);
    
    if (selectedText) {
      // Process the selected text with the correct source
      processSelectedText(selectedText);
      
      // Focus the input field automatically
      setTimeout(() => {
        const inputElement = document.querySelector(
          'input[placeholder="Ask anything"], input[placeholder="Ask follow-up"], input[placeholder*="Ask"]'
        ) as HTMLInputElement;
        
        if (inputElement) {
          inputElement.focus();
          // Move cursor to end of input
          inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
          console.log(`✅ Input focused and cursor moved to end`);
        } else {
          console.warn('❌ Input element not found');
        }
      }, 100);
    }
    
    // Clear text selection
    try {
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.warn('Error clearing selection:', error);
    }
    
    // Reset selected text
    setSelectedText('');
  }, [selectedText, processSelectedText, source]);

  /**
   * Utility function to reset all state
   */
  const resetHighlightState = useCallback(() => {
    setSelectedText('');
    setShowHighlightPopup(false);
    setHighlightPopupPosition({ x: 0, y: 0 });
  }, []);

  return {
    selectedText,
    showHighlightPopup,
    setShowHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery,
    isInputExpanded,
    setIsInputExpanded,
    handleTextHighlight: processSelectedText,
    // Bonus utility function
    resetHighlightState
  } as UseHighlightToAskReturn & { resetHighlightState: () => void };
};

export default useHighlightToAsk;