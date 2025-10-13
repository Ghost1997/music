import React, { useState, useRef } from 'react';

const VolumeControl = ({ volume, isMuted, onVolumeChange, onMuteToggle }) => {
  const [showSlider, setShowSlider] = useState(false);
  const isDraggingRef = useRef(false);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      );
    } else if (volume < 50) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      );
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = Number(e.target.value);
    onVolumeChange(newVolume);
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div 
      className="volume-control"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button 
        className="volume-btn" 
        onClick={onMuteToggle}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {getVolumeIcon()}
      </button>
      <div className={`volume-slider-container ${showSlider ? 'visible' : ''}`}>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="volume-slider"
          title={`Volume: ${isMuted ? 0 : volume}%`}
        />
      </div>
    </div>
  );
};

export default VolumeControl;