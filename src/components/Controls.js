import React from 'react';

const Controls = ({ isPlaying, onPlayPause, onPrevious, onNext }) => {
  // Prevent default behavior and handle both touch and click
  const handleButtonClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
  };

  return (
    <div className="controls">
      <button 
        className="control-btn" 
        onClick={handleButtonClick(onPrevious)}
        onTouchEnd={handleButtonClick(onPrevious)}
        title="Previous"
        aria-label="Previous track"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="19 20 9 12 19 4 19 20"></polygon>
          <line x1="5" y1="19" x2="5" y2="5"></line>
        </svg>
      </button>
      
      <button 
        className="control-btn play-btn" 
        onClick={handleButtonClick(onPlayPause)}
        onTouchEnd={handleButtonClick(onPlayPause)}
        title={isPlaying ? 'Pause' : 'Play'}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
      </button>
      
      <button 
        className="control-btn" 
        onClick={handleButtonClick(onNext)}
        onTouchEnd={handleButtonClick(onNext)}
        title="Next"
        aria-label="Next track"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>
    </div>
  );
};

export default Controls;