import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleNavigateToEditor = () => {
    navigate('/trackless-video-editor');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trackless Video Editor</h1>
        <Button
          onClick={handleNavigateToEditor}
          className="bg-[#4ea60c] hover:bg-[#3d8309] text-white px-8 py-4 text-lg transition-all duration-300 transform hover:scale-105"
        >
          Trackless Video Editor
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;