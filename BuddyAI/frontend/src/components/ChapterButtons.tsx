import React from 'react';
import { Eye, FileText } from 'lucide-react';

interface ChapterButtonsProps {
  onViewFullChapter?: () => void;
  onViewSummary?: () => void;
}

const ChapterButtons: React.FC<ChapterButtonsProps> = ({
  onViewFullChapter,
  onViewSummary
}) => {
  return (
    <div className="flex justify-end space-x-4 px-8 py-2">
      <button 
        onClick={onViewFullChapter}
        className="flex items-center space-x-2 px-4 py-1.5 bg-[#f6f6f1] border border-transparent 
        rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200 group"
      >
        <Eye 
          className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" 
          strokeWidth={1.5}
        />
        <span>View Full Chapter</span>
      </button>
      
      <button 
        onClick={onViewSummary}
        className="flex items-center space-x-2 px-4 py-1.5 bg-[#f6f6f1] border border-transparent 
        rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all duration-200 group"
      >
        <FileText 
          className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" 
          strokeWidth={1.5}
        />
        <span>View Summary</span>
      </button>
    </div>
  );
};

export default ChapterButtons; 