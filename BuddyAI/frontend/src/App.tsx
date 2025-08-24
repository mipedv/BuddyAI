import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import ChapterDetailPage from './components/ChapterDetailPage';
import ResponsePage from './components/ResponsePage';
import MediaGalleryPage from './components/MediaGalleryPage';
import TestSelection from './components/TestSelection';
import PracticeTestPage from './components/PracticeTestPage';
import PracticeTestSummary from './components/PracticeTestSummary';
import CommunityPage from './components/CommunityPage';
import CuriosityCentrePage from './components/CuriosityCentrePage';
import ProfilePage from './components/ProfilePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/chapter" element={<ChapterDetailPage />} />
        <Route path="/response" element={<ResponsePage />} />
        <Route path="/practice-test" element={<PracticeTestPage />} />
        <Route path="/practice-test/summary" element={<PracticeTestSummary />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/curiosity-centre" element={<CuriosityCentrePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/media-gallery" element={<MediaGalleryPage />} />
        <Route path="/test-selection" element={<TestSelection />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
 