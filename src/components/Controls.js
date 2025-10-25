import React, { useRef } from 'react';
import '../styles/Controls.css';

const Controls = ({
  isPlaying,
  onPlayPause,
  onPrevious,
  onNext
}) => {
  const touchStartRef = useRef(null);
  
  // Improved touch handling to prevent double-tap and ensure single action
  const handleTouchStart = (callback) => (e) => {
    touchStartRef.current = { callback, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (touchStartRef.current && Date.now() - touchStartRef.current.time < 500) {
      touchStartRef.current.callback();
      touchStartRef.current = null;
    }
  };

  // Handle click for desktop
  const handleClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only trigger on click if not a touch device
    if (!touchStartRef.current) {
      callback();
    }
  };

  return (
    <div className="controls">
      <button 
        className="control-btn" 
        onClick={handleClick(onPrevious)}
        onTouchStart={handleTouchStart(onPrevious)}
        onTouchEnd={handleTouchEnd}
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
        onClick={handleClick(onPlayPause)}
        onTouchStart={handleTouchStart(onPlayPause)}
        onTouchEnd={handleTouchEnd}
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
        onClick={handleClick(onNext)}
        onTouchStart={handleTouchStart(onNext)}
        onTouchEnd={handleTouchEnd}
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