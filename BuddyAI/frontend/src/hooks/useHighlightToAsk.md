# useHighlightToAsk Hook Documentation

## Overview
The `useHighlightToAsk` hook provides a reusable "Highlight to Ask" feature for BuddyAI. Users can select text anywhere in your app and see a popup to ask questions about the selected content.

## Features
- ✅ Text selection detection using `window.getSelection()`
- ✅ Smart content area validation
- ✅ Popup positioning with boundary checks
- ✅ Auto-prefixing with "Explain this:"
- ✅ Intelligent query appending
- ✅ Auto-focus input fields
- ✅ Source tracking for analytics
- ✅ Text truncation (300 char limit)
- ✅ TypeScript support

## Installation & Import
```typescript
import { useHighlightToAsk } from '@/hooks/useHighlightToAsk';
```

## API Reference

### Hook Signature
```typescript
const {
  selectedText,
  showHighlightPopup,
  highlightPopupPosition,
  handleTextSelection,
  handlePopupClick,
  followUpQuery,
  setFollowUpQuery,
  isInputExpanded,
  setIsInputExpanded
} = useHighlightToAsk(source?: HighlightSource);
```

### Parameters
- `source` (optional): `'pdf' | 'response' | 'summary' | 'chapter'`
  - Default: `'response'`
  - Used for logging and analytics

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `selectedText` | `string` | Currently selected text |
| `showHighlightPopup` | `boolean` | Whether popup should be visible |
| `highlightPopupPosition` | `{x: number, y: number}` | Popup coordinates |
| `handleTextSelection` | `function` | Mouse/touch event handler |
| `handlePopupClick` | `function` | Popup click handler |
| `followUpQuery` | `string` | Current query text |
| `setFollowUpQuery` | `function` | Query setter |
| `isInputExpanded` | `boolean` | Input expansion state |
| `setIsInputExpanded` | `function` | Input expansion setter |

## Quick Start

### Basic Usage
```tsx
import React from 'react';
import { useHighlightToAsk } from '@/hooks/useHighlightToAsk';

export const MyComponent = () => {
  const {
    showHighlightPopup,
    highlightPopupPosition,
    handleTextSelection,
    handlePopupClick,
    followUpQuery,
    setFollowUpQuery
  } = useHighlightToAsk('pdf');

  return (
    <div>
      {/* Selectable content */}
      <div 
        className="lesson-content"
        onMouseUp={handleTextSelection}
      >
        Your content here...
      </div>

      {/* Popup */}
      {showHighlightPopup && (
        <div
          className="fixed z-50 bg-blue-500 text-white px-3 py-2 rounded cursor-pointer"
          style={{
            left: `${highlightPopupPosition.x}px`,
            top: `${highlightPopupPosition.y}px`
          }}
          onClick={handlePopupClick}
        >
          Ask about this
        </div>
      )}

      {/* Input field */}
      <input
        placeholder="Ask anything"
        value={followUpQuery}
        onChange={(e) => setFollowUpQuery(e.target.value)}
      />
    </div>
  );
};
```

## Content Area Targeting

### Required CSS Classes
Your selectable content must include one of these classes:
- `.lesson-content`
- `.answer-text`
- `.pdf-content`
- `.summary-content`
- `.chapter-content`

### Excluded Elements
Selection is automatically disabled within:
- `button`, `input`, `textarea`, `select`, `a`
- Elements with `[role="button"]`

### Example Content Setup
```tsx
<div className="lesson-content" onMouseUp={handleTextSelection}>
  <p>This text can be selected</p>
  <button>This cannot be selected</button>
</div>
```

## Advanced Usage

### Custom Popup Styling
```tsx
{showHighlightPopup && (
  <div
    className="fixed z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
    style={{
      left: `${highlightPopupPosition.x}px`,
      top: `${highlightPopupPosition.y}px`
    }}
    onClick={handlePopupClick}
  >
    <div className="flex items-center space-x-2">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>Ask AI</span>
    </div>
  </div>
)}
```

### Input Field Integration
```tsx
<textarea
  placeholder="Ask follow-up"
  value={followUpQuery}
  onChange={(e) => setFollowUpQuery(e.target.value)}
  className={`w-full p-3 border rounded-lg transition-all ${
    isInputExpanded ? 'min-h-[80px]' : 'min-h-[40px]'
  }`}
  rows={isInputExpanded ? 3 : 1}
/>
```

### Multiple Sources
```tsx
// PDF Component
const pdfHook = useHighlightToAsk('pdf');

// Summary Component  
const summaryHook = useHighlightToAsk('summary');

// Response Component
const responseHook = useHighlightToAsk('response');
```

## Text Processing

### Automatic Prefixing
- New query: `"Explain this: selected text"`
- Existing query: `"current query, selected text"`
- Existing "Explain this:" query: `"Explain this: previous, selected text"`

### Text Truncation
- Maximum length: 300 characters
- Truncated text gets `"..."` suffix
- Prevents UI overflow and overly long queries

### Example Query Evolution
```
Initial: ""
After selection: "Explain this: photosynthesis"
After 2nd selection: "Explain this: photosynthesis, chlorophyll"
After 3rd selection: "Explain this: photosynthesis, chlorophyll, ATP synthesis"
```

## Integration Examples

### PDF Modal
```tsx
export const PDFModal = ({ pdfUrl }) => {
  const { handleTextSelection, showHighlightPopup, ... } = useHighlightToAsk('pdf');
  
  return (
    <div className="pdf-content" onMouseUp={handleTextSelection}>
      <PDFViewer url={pdfUrl} />
      {/* Popup here */}
    </div>
  );
};
```

### Summary Modal
```tsx
export const SummaryModal = ({ content }) => {
  const { handleTextSelection, ... } = useHighlightToAsk('summary');
  
  return (
    <div className="summary-content" onMouseUp={handleTextSelection}>
      {content}
    </div>
  );
};
```

### Response Page
```tsx
export const ResponsePage = ({ response }) => {
  const { handleTextSelection, ... } = useHighlightToAsk('response');
  
  return (
    <div className="answer-text lesson-content" onMouseUp={handleTextSelection}>
      {response.answer}
    </div>
  );
};
```

## Troubleshooting

### Common Issues

**Popup not showing:**
- Ensure content has required CSS class (`.lesson-content`, etc.)
- Check that selection is not within excluded elements
- Verify minimum 3-character selection length

**Position incorrect:**
- Check for CSS transforms on parent elements
- Ensure popup has `position: fixed`
- Verify z-index is high enough

**Input not focusing:**
- Ensure input has correct placeholder attribute
- Check for multiple inputs with same placeholder

### Debug Logging
The hook logs detailed information to console:
```
Text Selection Debug: {
  selectedText: "...",
  targetClass: "...",
  isFromValidContent: true,
  isInsideInteractiveElement: false,
  source: "pdf"
}
```

## Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Performance Notes
- Uses `useCallback` for optimal re-render performance
- Debounced selection detection
- Minimal DOM queries
- Efficient event handling

## TypeScript Support
Full TypeScript support with proper type exports:
```typescript
import { HighlightSource, UseHighlightToAskReturn } from '@/hooks/useHighlightToAsk';
```