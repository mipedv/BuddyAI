import React, { useState } from 'react';
import Sidebar from './HomePage/Sidebar';
import MainContent from './HomePage/MainContent';

export const SUBJECTS_CHAPTERS = {
  'Physics': [
    'Solar System', 
    'Mechanics', 
    'Electricity', 
    'Magnetism', 
    'Waves', 
    'Optics'
  ],
  'Mathematics': [
    'Algebra', 
    'Geometry', 
    'Trigonometry', 
    'Calculus', 
    'Statistics', 
    'Probability'
  ],
  'Chemistry': [
    'Atomic Structure', 
    'Chemical Bonds', 
    'Periodic Table', 
    'Reactions', 
    'Organic Chemistry', 
    'Inorganic Chemistry'
  ],
  'Biology': [
    'Cell Biology', 
    'Genetics', 
    'Ecology', 
    'Human Anatomy', 
    'Evolution', 
    'Microbiology'
  ]
};

const HomePage: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('Select Subject');
  const [selectedChapter, setSelectedChapter] = useState('Select Chapter');
  const [pageLang, setPageLang] = useState<'en' | 'ar'>('en');

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar pageLang={pageLang} />
      <div className="flex-1 ml-64 overflow-y-auto">
        <MainContent 
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedChapter={selectedChapter}
          setSelectedChapter={setSelectedChapter}
          subjectsChapters={SUBJECTS_CHAPTERS}
          // propagate pageLang control down so the translate button can toggle it
          // @ts-ignore keep props loosely typed to avoid breaking existing code
          pageLang={pageLang}
          setPageLang={setPageLang}
        />
      </div>
    </div>
  );
};

export default HomePage; 