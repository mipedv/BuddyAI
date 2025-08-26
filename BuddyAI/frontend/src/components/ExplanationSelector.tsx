import React, { useState } from 'react';

const EXPLANATION_TYPES = [
  'Textbook Explanation',
  'Detailed Explanation',
  'Advanced Explanation'
];

interface ExplanationSelectorProps {
  onSelect?: (type: string) => void;
  pageLang?: 'en' | 'ar';
}

const ExplanationSelector: React.FC<ExplanationSelectorProps> = ({ onSelect, pageLang = 'en' }) => {
  const [selectedType, setSelectedType] = useState(EXPLANATION_TYPES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const t = (type: string) => {
    if (pageLang !== 'ar') return type;
    switch (type) {
      case 'Textbook Explanation':
        return 'شرح من الكتاب';
      case 'Detailed Explanation':
        return 'شرح مفصل';
      case 'Advanced Explanation':
        return 'شرح متقدم';
      default:
        return type;
    }
  };

  const handleSelect = (type: string) => {
    setSelectedType(type);
    setIsDropdownOpen(false);
    onSelect && onSelect(type);
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="flex items-center space-x-1 text-sm text-gray-700 hover:text-blue-600 transition-colors 
        bg-[#f6f6f1] px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200"
      >
        <span>{t(selectedType)}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-gray-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div
          className="absolute top-full right-0 mt-2 bg-[#f6f6f1] border border-gray-200 rounded-lg shadow-lg z-10 w-48"
          onClick={(e) => e.stopPropagation()}
        >
          {EXPLANATION_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-600"
            >
              {t(type)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExplanationSelector; 