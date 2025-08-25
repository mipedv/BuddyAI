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
import CuriosityLayout from './components/Curiosity/CuriosityLayout';
import { MyChapterView, ForYouView, LearnAIView, RoboticsView, SpaceView } from './components/Curiosity/CuriosityTabs';
import DiscoverPage from './components/Curiosity/DiscoverPage';
import BooksPlaceholder from './components/Curiosity/BooksPlaceholder';
import CommunityPage from './components/CommunityPage';
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
        <Route path="/curiosity" element={<CuriosityLayout /> }>
          <Route path="my-chapter" element={<MyChapterView />} />
          <Route path="for-you" element={<ForYouView />} />
          <Route path="learn-ai" element={<LearnAIView />} />
          <Route path="robotics" element={<RoboticsView />} />
          <Route path="space" element={<SpaceView />} />
        </Route>
        <Route path="/curiosity/discover" element={<DiscoverPage />} />
        <Route path="/curiosity/books" element={<BooksPlaceholder />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/media-gallery" element={<MediaGalleryPage />} />
        <Route path="/test-selection" element={<TestSelection />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
 