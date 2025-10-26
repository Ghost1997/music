import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { songAPI } from '../services/api';

const MusicPlayerContext = createContext(null);

export const MusicPlayerProvider = ({ children }) => {
  // Player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off', 'all', 'one'
  
  // Queue management (Spotify-like)
  const [queue, setQueue] = useState([]); // Songs explicitly added to queue
  const [playbackContext, setPlaybackContext] = useState(null); // Current context (playlist, liked, album, etc.)
  const [contextSongs, setContextSongs] = useState([]); // Songs from current context
  const [currentIndex, setCurrentIndex] = useState(0); // Index in contextSongs
  const [history, setHistory] = useState([]); // Playback history
  const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
  const [likedSongIds, setLikedSongIds] = useState(new Set());
  
  // Refs for callbacks
  const playerRef = useRef(player);
  const isPlayingRef = useRef(isPlaying);
  const queueRef = useRef(queue);
  const contextSongsRef = useRef(contextSongs);
  const currentIndexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { contextSongsRef.current = contextSongs; }, [contextSongs]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const response = await songAPI.getLikedSongs();
        if (response.success && Array.isArray(response.data)) {
          setLikedSongIds(new Set(response.data.map(song => song.youtubeId)));
        } else {
          setLikedSongIds(new Set());
        }
      } catch (error) {
        console.error('Error fetching liked songs:', error);
        setLikedSongIds(new Set());
      }
    };

    fetchLikedSongs();
  }, []);

  // Play a song with context (like Spotify)
  const playSongWithContext = useCallback((song, context, songs = []) => {
    setCurrentSong(song);
    setPlaybackContext(context);
    setContextSongs(songs);
    
    // Find the index of the song in the context
    const index = songs.findIndex(s => s.youtubeId === song.youtubeId);
    setCurrentIndex(index !== -1 ? index : 0);
    
    // Clear queue when starting new context
    setQueue([]);
    setIsPlaying(true);
    
    // Add to history
    setHistory(prev => {
      const newHistory = [...prev.slice(-49), song];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, []);

  // Play a single song without changing context (for search results)
  const playSongOnly = useCallback((song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Add to history
    setHistory(prev => {
      const newHistory = [...prev.slice(-49), song];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, []);

  // Add song to queue (Spotify behavior: queue plays before context continues)
  const addToQueue = useCallback((song) => {
    setQueue(prev => {
      // Check if song already in queue
      if (prev.some(s => s.youtubeId === song.youtubeId)) {
        return prev;
      }
      return [...prev, song];
    });
  }, []);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setQueue(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const removeQueueItemAt = useCallback((index) => {
    setQueue(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  // Add multiple songs to queue
  const addMultipleToQueue = useCallback((songs) => {
    setQueue(prev => {
      const existingIds = new Set(prev.map(s => s.youtubeId));
      const newSongs = songs.filter(s => !existingIds.has(s.youtubeId));
      return [...prev, ...newSongs];
    });
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((youtubeId) => {
    setQueue(prev => prev.filter(s => s.youtubeId !== youtubeId));
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const toggleLike = useCallback(async (song) => {
    if (!song?.youtubeId) return false;
    const alreadyLiked = likedSongIds.has(song.youtubeId);

    try {
      if (alreadyLiked) {
        await songAPI.removeLikedSong(song.youtubeId);
      } else {
        await songAPI.addLikedSong(song);
      }

      setLikedSongIds(prev => {
        const updated = new Set(prev);
        if (alreadyLiked) {
          updated.delete(song.youtubeId);
        } else {
          updated.add(song.youtubeId);
        }
        return updated;
      });

      return !alreadyLiked;
    } catch (error) {
      console.error('Error toggling liked song:', error);
      return alreadyLiked;
    }
  }, [likedSongIds]);

  const isSongLiked = useCallback((youtubeId) => likedSongIds.has(youtubeId), [likedSongIds]);

  // Get next song (Spotify logic: queue first, then context)
  const getNextSong = useCallback(() => {
    // If there are songs in queue, play the first one
    if (queueRef.current.length > 0) {
      const nextSong = queueRef.current[0];
      setQueue(prev => prev.slice(1)); // Remove first song from queue
      return nextSong;
    }

    // If repeat one, return current song
    if (repeatRef.current === 'one') {
      return currentSong;
    }

    // If no context songs, return null
    if (contextSongsRef.current.length === 0) {
      return null;
    }

    // If shuffle is on, get random song (excluding current)
    if (shuffleRef.current) {
      const availableSongs = contextSongsRef.current.filter(
        (_, idx) => idx !== currentIndexRef.current
      );
      if (availableSongs.length === 0) {
        return repeatRef.current === 'all' ? contextSongsRef.current[0] : null;
      }
      const randomIndex = Math.floor(Math.random() * availableSongs.length);
      const randomSong = availableSongs[randomIndex];
      const actualIndex = contextSongsRef.current.findIndex(
        s => s.youtubeId === randomSong.youtubeId
      );
      setCurrentIndex(actualIndex);
      return randomSong;
    }

    // Normal sequential playback
    const nextIndex = currentIndexRef.current + 1;
    
    if (nextIndex >= contextSongsRef.current.length) {
      // End of context
      if (repeatRef.current === 'all') {
        setCurrentIndex(0);
        return contextSongsRef.current[0];
      }
      return null; // End of playback
    }

    setCurrentIndex(nextIndex);
    return contextSongsRef.current[nextIndex];
  }, [currentSong]);

  // Get previous song
  const getPreviousSong = useCallback(() => {
    if (contextSongsRef.current.length === 0) {
      return null;
    }

    // If we're more than 3 seconds into the song, restart it
    if (currentTime > 3) {
      return currentSong;
    }

    const prevIndex = currentIndexRef.current - 1;
    
    if (prevIndex < 0) {
      // Go to last song if repeat all is on
      if (repeatRef.current === 'all') {
        const lastIndex = contextSongsRef.current.length - 1;
        setCurrentIndex(lastIndex);
        return contextSongsRef.current[lastIndex];
      }
      return currentSong; // Stay on first song
    }

    setCurrentIndex(prevIndex);
    return contextSongsRef.current[prevIndex];
  }, [currentSong, currentTime]);

  // Handle next
  const handleNext = useCallback(() => {
    // First check if we can move forward in history
    const currentHistoryIndex = historyIndexRef.current;
    const currentHistory = historyRef.current;
    
    if (currentHistoryIndex < currentHistory.length - 1) {
      // Move forward in history
      const nextSong = currentHistory[currentHistoryIndex + 1];
      setHistoryIndex(currentHistoryIndex + 1);
      setCurrentSong(nextSong);
      setIsPlaying(true);
      
      // Update context index if the song exists in current context
      const contextIndex = contextSongsRef.current.findIndex(
        s => s.youtubeId === nextSong.youtubeId
      );
      if (contextIndex !== -1) {
        setCurrentIndex(contextIndex);
      }
    } else {
      // No more history, use context/queue
      const nextSong = getNextSong();
      if (nextSong) {
        setCurrentSong(nextSong);
        setIsPlaying(true);
        setHistory(prev => {
          const newHistory = [...prev.slice(-49), nextSong];
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
      } else {
        setIsPlaying(false);
      }
    }
  }, [getNextSong]);

  // Handle previous
  const handlePrevious = useCallback(() => {
    // If we're more than 3 seconds into the song, restart it
    if (currentTime > 3) {
      if (playerRef.current) {
        playerRef.current.seekTo(0);
      }
      return;
    }

    // Navigate back in history
    const currentHistoryIndex = historyIndexRef.current;
    if (currentHistoryIndex > 0) {
      const prevSong = historyRef.current[currentHistoryIndex - 1];
      setHistoryIndex(currentHistoryIndex - 1);
      setCurrentSong(prevSong);
      setIsPlaying(true);
      
      // Update context index if the song exists in current context
      const contextIndex = contextSongsRef.current.findIndex(
        s => s.youtubeId === prevSong.youtubeId
      );
      if (contextIndex !== -1) {
        setCurrentIndex(contextIndex);
      }
    }
  }, [currentTime]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || !currentSong) return;
    
    try {
      const playerState = playerRef.current.getPlayerState();
      
      if (playerState === 1) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        // Ensure playback resumes from currentTime when YouTube reports ended state
        const resumeFromEnded = playerState === 0;
        const getCurrentTime = playerRef.current.getCurrentTime?.bind(playerRef.current);

        if (resumeFromEnded) {
          // Seek slightly before the stored time when possible to avoid buffering issues
          const resumeTime = Math.max(0, (getCurrentTime?.() ?? currentTime) - 0.1);
          playerRef.current.seekTo(resumeTime, true);
          setCurrentTime(resumeTime);
        } else if (getCurrentTime) {
          // Guard for cases where currentTime state is ahead of internal player time
          const playerCurrent = getCurrentTime();
          if (Math.abs(playerCurrent - currentTime) > 0.5) {
            playerRef.current.seekTo(currentTime, true);
            setCurrentTime(currentTime);
          }
        }

        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error in togglePlayPause:', error);
    }
  }, [currentSong, currentTime]);

  // Seek
  const handleSeek = useCallback((time) => {
    if (playerRef.current && playerRef.current.seekTo && typeof time === 'number') {
      try {
        const validTime = Math.max(0, Math.min(time, duration || 0));
        playerRef.current.seekTo(validTime, true);
        setCurrentTime(validTime);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  }, [duration]);

  // Volume control
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        playerRef.current.setVolume(volume);
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted, volume]);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setShuffle(prev => !prev);
  }, []);

  // Toggle repeat
  const toggleRepeat = useCallback(() => {
    setRepeat(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const value = {
    // State
    currentSong,
    isPlaying,
    player,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    playbackContext,
    contextSongs,
    currentIndex,
    history,
    likedSongIds,
    
    // Setters
    setPlayer,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    
    // Actions
    playSongWithContext,
    playSongOnly,
    addToQueue,
    reorderQueue,
    removeQueueItemAt,
    addMultipleToQueue,
    removeFromQueue,
    clearQueue,
    toggleLike,
    isSongLiked,
    handleNext,
    handlePrevious,
    togglePlayPause,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  }
  return context;
};
