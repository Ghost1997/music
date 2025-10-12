import React, { useState, useEffect } from 'react';

const ProgressBar = ({ currentTime, duration, onSeek }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (!isDragging && duration > 0) {
      setLocalProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration, isDragging]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgressChange = (e) => {
    const value = parseFloat(e.target.value);
    setLocalProgress(value);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    const value = parseFloat(e.target.value);
    const seekTime = (value / 100) * duration;
    onSeek(seekTime);
  };

  return (
    <div className="progress-container">
      <span className="time">{formatTime(currentTime)}</span>
      <div className="progress-bar">
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={localProgress}
          onChange={handleProgressChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="progress-slider"
        />
        <div className="progress-fill" style={{ width: `${localProgress}%` }}></div>
      </div>
      <span className="time">{formatTime(duration)}</span>
    </div>
  );
};

export default ProgressBar;