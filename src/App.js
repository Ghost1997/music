import React, { useState, useEffect, useCallback, useRef } from 'react';
import Player from './components/Player';
import Controls from './components/Controls';
import ProgressBar from './components/ProgressBar';
import Playlist from './components/Playlist';
import SearchBar from './components/SearchBar';
import { songAPI } from './services/api';
import { validateApiConnection } from './utils/apiValidator';
import './styles/App.css';
import { QueueIcon } from './components/Icons'; // Assuming you create an Icons component

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

  // Use a ref to keep track of the playing state to avoid stale closures in callbacks
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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
          // Format search results to match song structure
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

  // Player Controls
  const handleNext = useCallback(() => {
    if (!songs.length) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
  }, [currentSongIndex, songs.length]);
  
  const handlePrevious = () => {
    if (!songs.length) return;
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    setCurrentSongIndex(prevIndex);
  };

  const handlePlayPause = () => {
    if (!player || !currentSong) return;
    
    try {
      // Get the actual player state
      const playerState = player.getPlayerState();
      
      if (playerState === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
    }
  };
  
  const handleSeek = (time) => {
    if (player && player.seekTo) {
      player.seekTo(time);
      setCurrentTime(time);
    }
  };
  
  // Song Selection Logic
  const handleSelectSong = (songToPlay) => {
    const songIndex = songs.findIndex(s => s.youtubeId === songToPlay.youtubeId);

    if (songIndex !== -1) {
      // Song is already in the queue, just switch to it
      setCurrentSongIndex(songIndex);
    } else {
      // Song is not in the queue, add it and switch to it
      const newSongs = [...songs, songToPlay];
      setSongs(newSongs);
      setCurrentSongIndex(newSongs.length - 1);
    }

    // Always attempt to play the newly selected song
    setIsPlaying(true); 
    
    // Clear search and hide dropdown
    setShowSuggestions(false);
    setSearchQuery('');
  };

  // Effect to control the YouTube player instance
  useEffect(() => {
    if (player && currentSong) {
      try {
        if (isPlayingRef.current) {
          // If we're meant to be playing, load and play the video
          player.loadVideoById(currentSong.youtubeId);
          setIsPlaying(true);
        } else {
          // If we're not meant to be playing, just cue the video
          player.cueVideoById(currentSong.youtubeId);
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error loading video:', error);
        // Fallback to just cuing the video
        player.cueVideoById(currentSong.youtubeId);
        setIsPlaying(false);
      }
    }
  }, [currentSong, player]);

  // Progress bar update
  useEffect(() => {
    if (!player) return undefined;

    let timeUpdateInterval;

    const updateTime = () => {
      try {
        if (player.getCurrentTime && player.getDuration) {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          
          if (typeof current === 'number' && !isNaN(current)) {
            setCurrentTime(current);
          }
          
          if (typeof total === 'number' && !isNaN(total)) {
            setDuration(total);
          }
        }
      } catch (error) {
        console.error('Error updating time:', error);
      }
    };

    // Initial update
    updateTime();

    // Set up regular updates
    timeUpdateInterval = setInterval(updateTime, 100);

    return () => {
      if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
      }
    };
  }, [player]);

  const handlePlayerReady = useCallback((playerInstance) => {
    setPlayer(playerInstance);
    
    // Initialize times when player is ready
    try {
      if (playerInstance.getCurrentTime && playerInstance.getDuration) {
        const current = playerInstance.getCurrentTime();
        const total = playerInstance.getDuration();
        
        if (typeof current === 'number' && !isNaN(current)) {
          setCurrentTime(current);
        }
        
        if (typeof total === 'number' && !isNaN(total)) {
          setDuration(total);
        }
      }
    } catch (error) {
      console.error('Error initializing times:', error);
    }
  }, []);

  const handleStateChange = useCallback((event) => {
    // Ensure we have valid event data
    if (!event || typeof event.data !== 'number' || !player) return;

    const playerState = event.data;

    // Update current time and duration
    const updateTimes = () => {
      try {
        if (player.getCurrentTime && player.getDuration) {
          const current = player.getCurrentTime();
          const total = player.getDuration();
          
          if (typeof current === 'number' && !isNaN(current)) {
            setCurrentTime(current);
          }
          
          if (typeof total === 'number' && !isNaN(total)) {
            setDuration(total);
          }
        }
      } catch (error) {
        console.error('Error updating times:', error);
      }
    };

    // Always update times when we get a state change
    if (playerState !== window.YT.PlayerState.UNSTARTED) {
      updateTimes();
    }

    switch (playerState) {
      case window.YT.PlayerState.ENDED:
        setIsPlaying(false);
        setCurrentTime(duration);
        handleNext();
        break;
      
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      
      case window.YT.PlayerState.PAUSED:
        setIsPlaying(false);
        break;
      
      case window.YT.PlayerState.BUFFERING:
        // Keep the current playing state during buffering
        break;
      
      case window.YT.PlayerState.CUED:
        setIsPlaying(false);
        setCurrentTime(0);
        if (isPlayingRef.current) {
          player.playVideo();
        }
        break;

      case window.YT.PlayerState.UNSTARTED:
        setIsPlaying(false);
        setCurrentTime(0);
        break;
    }
  }, [handleNext, player, duration]);
  
  // Search input handlers
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };
  const handleSearchFocus = () => {
    if (searchQuery.length > 0) setShowSuggestions(true);
  };
  const handleSearchBlur = () => {
    // Delay hiding to allow click events on suggestions to register
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