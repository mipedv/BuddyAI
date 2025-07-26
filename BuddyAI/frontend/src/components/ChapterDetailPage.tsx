import React, { useState } from 'react';
import Sidebar from './HomePage/Sidebar';
import MainContent from './ChapterDetailPage/MainContent';

const ChapterDetailPage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedChapter, setSelectedChapter] = useState('Solar System');

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MainContent 
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
        />
      </div>
    </div>
  );
};

export default ChapterDetailPage; 