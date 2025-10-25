import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import Player from './Player';
import Controls from './Controls';
import ProgressBar from './ProgressBar';
import AddToPlaylistModal from './AddToPlaylistModal';
import '../styles/GlobalPlayer.css';

const GlobalPlayer = () => {
  const {
    currentSong,
    isPlaying,
    player,
    currentTime,
    duration,
    volume,
    isMuted,
    repeat,
    queue,
    setPlayer,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    handleNext,
    handlePrevious,
    togglePlayPause,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    toggleLike,
    isSongLiked,
  } = useMusicPlayer();

  const [isLiking, setIsLiking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!currentSong && isExpanded) {
      setIsExpanded(false);
    }
  }, [currentSong, isExpanded]);

  // Ensure playback starts when isPlaying is true and player is ready
  useEffect(() => {
    if (player && isPlaying && currentSong) {
      try {
        const playerState = player.getPlayerState();
        // If not playing (state 1), start playback
        if (playerState !== 1) {
          player.playVideo();
        }
      } catch (error) {
        console.error('Error ensuring playback:', error);
      }
    }
  }, [player, isPlaying, currentSong]);

  const handlePlayerReady = useCallback((playerInstance) => {
    setPlayer(playerInstance);
    // Auto-play when player is ready and playback was already in progress
    if (isPlayingRef.current) {
      setTimeout(() => {
        if (!isPlayingRef.current) return;
        try {
          playerInstance.playVideo();
        } catch (error) {
          console.error('Error auto-playing:', error);
        }
      }, 100);
    }
  }, [setPlayer]);

  const handleToggleLike = useCallback(async () => {
    if (!currentSong || isLiking) return;
    setIsLiking(true);
    try {
      await toggleLike(currentSong);
    } finally {
      setIsLiking(false);
    }
  }, [currentSong, toggleLike, isLiking]);

  const isLiked = useMemo(() => currentSong ? isSongLiked(currentSong.youtubeId) : false, [currentSong, isSongLiked]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleStateChange = useCallback((event) => {
    if (event.data === 0) {
      // Video ended
      if (repeat === 'one') {
        event.target.seekTo(0);
        event.target.playVideo();
      } else {
        handleNext();
      }
    } else if (event.data === 1) {
      // Playing
      setIsPlaying(true);
      
      // Use requestAnimationFrame for smooth updates
      let animationId;
      const updateTime = () => {
        if (event.target && event.target.getCurrentTime) {
          const currentTime = event.target.getCurrentTime();
          const duration = event.target.getDuration();
          
          // Only update if values changed significantly (reduce re-renders)
          setCurrentTime(Math.floor(currentTime * 10) / 10);
          setDuration(Math.floor(duration * 10) / 10);
        }
        animationId = requestAnimationFrame(updateTime);
      };
      
      animationId = requestAnimationFrame(updateTime);
      return () => cancelAnimationFrame(animationId);
    } else if (event.data === 2) {
      // Paused
      setIsPlaying(false);
    }
  }, [handleNext, repeat, setIsPlaying, setCurrentTime, setDuration]);

  if (!currentSong) {
    return null;
  }

  return (
    <div className={`global-player ${isExpanded ? 'expanded' : ''}`}>
      {isExpanded && (
        <button
          className="player-close-btn"
          onClick={toggleExpanded}
          title="Close full screen player"
          aria-label="Close full screen player"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="6" x2="18" y2="18"></line>
            <line x1="6" y1="18" x2="18" y2="6"></line>
          </svg>
        </button>
      )}
      <div className="player-left">
        <img src={currentSong.thumbnail} alt={currentSong.title} className="player-thumbnail" />
        <div className="player-song-info">
          <div className="player-song-title">{currentSong.title}</div>
          <div className="player-song-artist">{currentSong.artist}</div>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls-row">
          <Controls 
            isPlaying={isPlaying} 
            onPlayPause={togglePlayPause} 
            onPrevious={handlePrevious} 
            onNext={handleNext}
            onToggleLike={handleToggleLike}
            isLiked={isLiked}
            disableLike={isLiking}
            showLike={false}
          />
        </div>

        <ProgressBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
      </div>

      <div className="player-right">
        {!isExpanded && (
          <button
            className="player-control-btn expand-btn"
            onClick={toggleExpanded}
            title="Open full screen"
            aria-label="Open full screen player"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 9 4 4 9 4"></polyline>
              <line x1="4" y1="4" x2="9" y2="9"></line>
              <polyline points="20 15 20 20 15 20"></polyline>
              <line x1="20" y1="20" x2="15" y2="15"></line>
            </svg>
          </button>
        )}
        <button
          className="player-control-btn playlist-inline"
          onClick={() => setShowAddToPlaylist(true)}
          title="Add to playlist"
          aria-label="Add to playlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </button>
        <button
          className={`player-control-btn like-inline ${isLiked ? 'liked' : ''}`}
          onClick={handleToggleLike}
          disabled={isLiking}
          title={isLiked ? 'Unlike' : 'Like'}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          )}
        </button>
        {queue.length > 0 && (
          <div className="queue-indicator" title={`${queue.length} songs in queue`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            <span>{queue.length}</span>
          </div>
        )}

        <div className="volume-control">
          <button className="player-control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted || volume === 0 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : volume < 50 ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            )}
          </button>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      {/* Hidden YouTube Player */}
      <Player videoId={currentSong.youtubeId} onReady={handlePlayerReady} onStateChange={handleStateChange} />
      
      {showAddToPlaylist && currentSong && (
        <AddToPlaylistModal
          song={currentSong}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}
    </div>
  );
};

export default GlobalPlayer;
