import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import ChapterDetailPage from './components/ChapterDetailPage';
import ResponsePage from './components/ResponsePage';
import MediaGalleryPage from './components/MediaGalleryPage';
import TestSelection from './components/TestSelection';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/chapter" element={<ChapterDetailPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/media-gallery" element={<MediaGalleryPage />} />
        <Route path="/test-selection" element={<TestSelection />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
 