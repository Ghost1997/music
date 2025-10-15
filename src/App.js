import React, { useState, useEffect, useCallback, useRef } from 'react';
import Player from './components/Player';
import Controls from './components/Controls';
import ProgressBar from './components/ProgressBar';
import Playlist from './components/Playlist';
import SearchBar from './components/SearchBar';
import { songAPI } from './services/api';
import { validateApiConnection } from './utils/apiValidator';
import './styles/App.css';
import { QueueIcon } from './components/Icons';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use refs to keep track of state to avoid stale closures
  const isPlayingRef = useRef(isPlaying);
  const playerRef = useRef(player);
  const songsRef = useRef(songs);
  const currentSongIndexRef = useRef(currentSongIndex);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

  useEffect(() => {
    currentSongIndexRef.current = currentSongIndex;
  }, [currentSongIndex]);

  // Fetch all songs on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const validation = await validateApiConnection();
        if (validation.success) {
          await fetchAllSongs();
        } else {
          console.error('API validation failed:', validation.error);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);
  
  const fetchAllSongs = async () => {
    try {
      setLoading(true);
      const response = await songAPI.getAllSongs();
      if (response.success && Array.isArray(response.data)) {
        const formattedSongs = response.data.map(song => ({
          id: song._id,
          youtubeId: song.youtubeId,
          title: song.title,
          artist: song.artist.split('|')[0].trim(),
          thumbnail: song.thumbnail,
        }));
        setSongs(formattedSongs);
        if (formattedSongs.length > 0) {
          setCurrentSongIndex(0);
        }
      } else {
        console.error('Failed to fetch songs:', response.error);
        setSongs([]);
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await songAPI.searchSongs(searchQuery);
        if (response.success) {
          const formattedResults = response.data.map(song => ({
            id: song._id || song.youtubeId,
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist.split('|')[0].trim(),
            thumbnail: song.thumbnail,
          }));
          setSearchResults(formattedResults);
          setShowSuggestions(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching songs:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const currentSong = songs[currentSongIndex];

  // FIXED: handleNext with proper auto-play
  const handleNext = useCallback(() => {
    if (!songsRef.current.length) return;
    const nextIndex = (currentSongIndexRef.current + 1) % songsRef.current.length;
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true); // Auto-play next song
  }, []);
  
  // FIXED: handlePrevious with useCallback
  const handlePrevious = useCallback(() => {
    if (!songsRef.current.length) return;
    const prevIndex = (currentSongIndexRef.current - 1 + songsRef.current.length) % songsRef.current.length;
    setCurrentSongIndex(prevIndex);
  }, []);

  // FIXED: handlePlayPause with better error handling for mobile
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !currentSong) return;
    
    try {
      const playerState = playerRef.current.getPlayerState();
      
      // State 1 = Playing, State 2 = Paused
      if (playerState === 1) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
      // Fallback for mobile
      try {
        if (isPlayingRef.current) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          playerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (fallbackError) {
        console.error('Fallback playPause failed:', fallbackError);
      }
    }
  }, [currentSong]);
  
  // FIXED: handleSeek with validation and proper seeking
  const handleSeek = useCallback((time) => {
    if (playerRef.current && playerRef.current.seekTo && typeof time === 'number') {
      try {
        const validTime = Math.max(0, Math.min(time, duration || 0));
        playerRef.current.seekTo(validTime, true); // allowSeekAhead = true
        setCurrentTime(validTime);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  }, [duration]);
  
  // Song Selection Logic
  const handleSelectSong = useCallback((songToPlay) => {
    const songIndex = songs.findIndex(s => s.youtubeId === songToPlay.youtubeId);

    if (songIndex !== -1) {
      setCurrentSongIndex(songIndex);
    } else {
      const newSongs = [...songs, songToPlay];
      setSongs(newSongs);
      setCurrentSongIndex(newSongs.length - 1);
    }

    setIsPlaying(true); 
    setShowSuggestions(false);
    setSearchQuery('');
  }, [songs]);

  // FIXED: Effect to control the YouTube player with proper autoplay
  useEffect(() => {
    if (playerRef.current && currentSong) {
      try {
        if (isPlayingRef.current) {
          playerRef.current.loadVideoById(currentSong.youtubeId);
        } else {
          playerRef.current.cueVideoById(currentSong.youtubeId);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      }
    }
  }, [currentSong]);

  // Progress bar update
  useEffect(() => {
    if (!playerRef.current) return;

    const updateTime = () => {
      try {
        if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          
          if (typeof current === 'number' && !isNaN(current)) {
            setCurrentTime(current);
          }
          
          if (typeof total === 'number' && !isNaN(total) && total > 0) {
            setDuration(total);
          }
        }
      } catch (error) {
        // Silently fail to avoid console spam
      }
    };

    const timeUpdateInterval = setInterval(updateTime, 100);

    return () => {
      clearInterval(timeUpdateInterval);
    };
  }, [player]);

  const handlePlayerReady = useCallback((playerInstance) => {
    setPlayer(playerInstance);
    
    try {
      if (playerInstance.getCurrentTime && playerInstance.getDuration) {
        const current = playerInstance.getCurrentTime();
        const total = playerInstance.getDuration();
        
        if (typeof current === 'number' && !isNaN(current)) {
          setCurrentTime(current);
        }
        
        if (typeof total === 'number' && !isNaN(total) && total > 0) {
          setDuration(total);
        }
      }
    } catch (error) {
      console.error('Error initializing times:', error);
    }
  }, []);

  // FIXED: handleStateChange with proper autoplay on song end
  const handleStateChange = useCallback((event) => {
    if (!event || typeof event.data !== 'number') return;

    const playerState = event.data;

    // Update times on state change
    if (playerRef.current && playerState !== -1) { // Not UNSTARTED
      try {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        
        if (typeof current === 'number' && !isNaN(current)) {
          setCurrentTime(current);
        }
        
        if (typeof total === 'number' && !isNaN(total) && total > 0) {
          setDuration(total);
        }
      } catch (error) {
        // Silently fail
      }
    }

    switch (playerState) {
      case 0: // ENDED
        setIsPlaying(false);
        // Auto-play next song
        setTimeout(() => {
          handleNext();
        }, 500); // Small delay for smooth transition
        break;
      
      case 1: // PLAYING
        setIsPlaying(true);
        break;
      
      case 2: // PAUSED
        setIsPlaying(false);
        break;
      
      case 3: // BUFFERING
        // Keep current playing state
        break;
      
      case 5: // CUED
        setIsPlaying(false);
        setCurrentTime(0);
        // If we should be playing, start playback
        if (isPlayingRef.current && playerRef.current) {
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          }, 100);
        }
        break;

      case -1: // UNSTARTED
        setIsPlaying(false);
        setCurrentTime(0);
        break;
        
      default:
        break;
    }
  }, [handleNext]);
  
  // Search input handlers
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };
  
  const handleSearchFocus = () => {
    if (searchQuery.length > 0) setShowSuggestions(true);
  };
  
  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const togglePlaylist = () => setShowPlaylist(!showPlaylist);

  if (loading) {
    return (
      <div className="loading"><div className="loading-spinner"></div></div>
    );
  }

  return (
    <div className={`app ${showPlaylist ? 'playlist-visible' : ''}`}>
      <div className="app-container">
        <div className="player-container">
          <div className="player-section">
            <div className="main-search">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {showSuggestions && (
                <div className="search-dropdown">
                  {isSearching ? (
                    <div className="no-suggestions">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.slice(0, 5).map((song) => (
                        <div key={song.youtubeId} className="search-suggestion" onClick={() => handleSelectSong(song)}>
                          <img src={song.thumbnail} alt={song.title} />
                          <div className="suggestion-info">
                            <div className="suggestion-title">{song.title}</div>
                            <div className="suggestion-artist">{song.artist}</div>
                          </div>
                        </div>
                      ))}
                      {searchResults.length > 5 && (
                        <div className="show-all" onClick={() => { setShowPlaylist(true); setShowSuggestions(false); }}>
                          View all {searchResults.length} results
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-suggestions">No songs found</div>
                  )}
                </div>
              )}
            </div>

            {!currentSong ? (
              <div className="no-songs-message">
                No songs in the queue. Try searching for some music.
              </div>
            ) : (
              <>
                <div className="album-art-container">
                  <div className="album-art-glow" style={{backgroundImage: `url(${currentSong.thumbnail})`}}></div>
                  <img src={currentSong.thumbnail} alt={currentSong.title} className={`album-art ${isPlaying ? 'playing' : ''}`} />
                </div>
                <div className="song-details">
                  <h1>{currentSong.title}</h1>
                  <p>{currentSong.artist}</p>
                </div>
                <ProgressBar currentTime={currentTime} duration={duration} onSeek={handleSeek} />
                <div className="controls-wrapper">
                  <Controls isPlaying={isPlaying} onPlayPause={handlePlayPause} onPrevious={handlePrevious} onNext={handleNext} />
                </div>
              </>
            )}
            
            <div className="queue-section">
               <button className="queue-btn" onClick={togglePlaylist} title="Toggle Queue">
                  <QueueIcon />
                  <span>Queue</span>
               </button>
            </div>
            
            {songs.length > 0 && currentSong && (
                <Player videoId={currentSong.youtubeId} onReady={handlePlayerReady} onStateChange={handleStateChange} />
            )}
          </div>
        </div>

        <div className={`playlist-panel ${showPlaylist ? 'visible' : ''}`}>
          <div className="playlist-header">
            <h2>Queue</h2>
            <button className="close-playlist" onClick={togglePlaylist} title="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <Playlist songs={songs} currentSongId={currentSong?.id} onSelectSong={(song) => setCurrentSongIndex(songs.findIndex(s => s.id === song.id))} />
        </div>
      </div>
    </div>
  );
}

export default App;