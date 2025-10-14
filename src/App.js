import React, { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import Controls from './components/Controls';
import ProgressBar from './components/ProgressBar';
import Playlist from './components/Playlist';
import SearchBar from './components/SearchBar';
import { songAPI } from './services/api';
import { validateApiConnection } from './utils/apiValidator';
import './styles/App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Fetch all songs on mount
  useEffect(() => {
    console.log('Component mounted, validating API connection...'); // Debug log
    
    const initializeApp = async () => {
      try {
        const validation = await validateApiConnection();
        console.log('API validation result:', validation);
        
        if (validation.success) {
          console.log('API connection validated, fetching songs...');
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
      console.log('Making API call to fetch songs...'); // Debug log
      const response = await songAPI.getAllSongs();
      console.log('API Response:', response); // Debug log
      
      if (response.success && Array.isArray(response.data)) {
        console.log('Setting songs:', response.data.length, 'songs found'); // Debug log
        
        // Map the API response to match the expected structure
        const formattedSongs = response.data.map(song => ({
          id: song._id,
          youtubeId: song.youtubeId,
          title: song.title,
          artist: song.artist.split('|')[0].trim(), // Take the first part before | as artist
          thumbnail: song.thumbnail,
          duration: song.duration,
          durationSeconds: song.durationSeconds
        }));
        
        setSongs(formattedSongs);
        
        if (formattedSongs.length > 0) {
          setCurrentSongIndex(0);
        }
      } else {
        console.error('Failed to fetch songs:', response.error);
        setSongs([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching songs:', error);
      setSongs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Search songs with debounce
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
          setSearchResults(response.data);
          setShowSuggestions(true);
        } else {
          console.error('Search failed:', response.error);
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

  // Filter songs for display
  const filteredSongs = searchQuery.length > 0 ? searchResults : songs;

  // Handle next song
  const handleNext = useCallback(async () => {
    if (!songs.length) return;
    
    try {
      const nextIndex = (currentSongIndex + 1) % songs.length;
      const nextSong = songs[nextIndex];
      
      if (player && player.loadVideoById) {
        setCurrentSongIndex(nextIndex);
        setCurrentTime(0);
        player.loadVideoById(nextSong.youtubeId);
      }
    } catch (error) {
      console.error('Error playing next song:', error);
    }
  }, [currentSongIndex, songs, player]);

  // Update progress
  useEffect(() => {
    if (!player || !isPlaying) return;

    const interval = setInterval(() => {
      if (player && player.getCurrentTime) {
        const time = player.getCurrentTime();
        setCurrentTime(time);
        
        if (player.getDuration) {
          const dur = player.getDuration();
          if (dur !== duration) {
            setDuration(dur);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player, isPlaying, duration]);

  const handlePlayerReady = useCallback((playerInstance) => {
    setPlayer(playerInstance);
    setPlayerReady(true);
    
    setTimeout(() => {
      try {
        if (playerInstance && playerInstance.getDuration) {
          const dur = playerInstance.getDuration();
          setDuration(dur);
        }
      } catch (error) {
        console.log('Duration get error:', error.message);
      }
    }, 500);
  }, []);

  const handleStateChange = useCallback((event) => {
    if (!event || typeof event.data !== 'number') {
      console.error('Invalid player state event:', event);
      return;
    }

    switch (event.data) {
      case -1: // unstarted
        setIsPlaying(false);
        setPlayerReady(true); // Player is ready even when unstarted
        break;
      case 0: // ended
        if (songs.length > 1) { // Only auto-play next if there are more songs
          handleNext();
        } else {
          setIsPlaying(false);
        }
        break;
      case 1: // playing
        setIsPlaying(true);
        setPlayerReady(true);
        if (player && player.getDuration) {
          const dur = player.getDuration();
          setDuration(dur);
        }
        break;
      case 2: // paused
        setIsPlaying(false);
        break;
      case 3: // buffering
        // Keep previous playing state, just show loading indicator if needed
        break;
      case 5: // video cued
        setPlayerReady(true);
        setIsPlaying(false); // Ensure paused state when video is cued
        if (player && player.playVideo && isPlaying) {
          player.playVideo(); // Auto-play only if we were playing before
        }
        break;
      default:
        break;
    }
  }, [handleNext, player]);

  const handlePlayPause = () => {
    if (!player) return;
    
    try {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Play/Pause error:', error.message);
    }
  };

  const handlePrevious = () => {
    if (!songs.length) return;
    
    try {
      const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
      const prevSong = songs[prevIndex];
      
      if (player && player.loadVideoById) {
        setCurrentSongIndex(prevIndex);
        setCurrentTime(0);
        player.loadVideoById(prevSong.youtubeId);
      }
    } catch (error) {
      console.error('Error playing previous song:', error);
    }
  };

  const handleSelectSong = async (song) => {
    if (!song || !song.youtubeId) {
      console.error('Invalid song data:', song);
      return;
    }

    try {
      // Get full song details
      const response = await songAPI.getSongDetails(song.youtubeId);
      if (response.success) {
        const songData = response.data;
        
        // If the song isn't in the current list, add it
        if (!songs.some(s => s.youtubeId === songData.youtubeId)) {
          setSongs(prevSongs => [...prevSongs, songData]);
          setCurrentSongIndex(songs.length);
        } else {
          const index = songs.findIndex(s => s.youtubeId === songData.youtubeId);
          setCurrentSongIndex(index);
        }
        
        // Play the song using YouTube player
        if (player && player.loadVideoById) {
          setCurrentTime(0);
          player.loadVideoById(songData.youtubeId);
        }
      }
    } catch (error) {
      console.error('Error loading song:', error);
    }
    
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const handleSeek = (time) => {
    if (player && player.seekTo) {
      try {
        player.seekTo(time);
        setCurrentTime(time);
      } catch (error) {
        console.log('Seek error:', error.message);
      }
    }
  };

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };

  const handleSearchFocus = () => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    if (playerReady && player) {
      try {
        player.playVideo();
      } catch (error) {
        console.log('Auto-play error:', error.message);
      }
    }
  }, [playerReady, player, currentSongIndex]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!songs.length) {
    return (
      <div className="app">
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
              </div>
              <div className="no-songs-message">
                No songs available. Try searching for some music.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        {/* Main Player */}
        <div className="player-container">
          <div className="player-section">
            {/* Search Bar with Dropdown */}
            <div className="main-search">
              <SearchBar 
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && filteredSongs.length > 0 && (
                <div className="search-dropdown">
                  {filteredSongs.slice(0, 5).map((song) => (
                    <div
                      key={song.youtubeId}
                      className="search-suggestion"
                      onClick={() => handleSelectSong(song)}
                    >
                      <img src={song.thumbnail} alt={song.title} />
                      <div className="suggestion-info">
                        <div className="suggestion-title">{song.title}</div>
                        <div className="suggestion-artist">{song.artist}</div>
                      </div>
                    </div>
                  ))}
                  {filteredSongs.length > 5 && (
                    <div className="show-all" onClick={togglePlaylist}>
                      View all {filteredSongs.length} results
                    </div>
                  )}
                </div>
              )}

              {showSuggestions && filteredSongs.length === 0 && searchQuery && (
                <div className="search-dropdown">
                  <div className="no-suggestions">No songs found</div>
                </div>
              )}
            </div>

            {currentSong && (
              <>
                <div className="album-art-container">
                  <div 
                    className="album-art-glow" 
                    style={{backgroundImage: `url(${currentSong.thumbnail})`}}
                  ></div>
                  <img 
                    src={currentSong.thumbnail} 
                    alt={currentSong.title} 
                    className={`album-art ${isPlaying ? 'playing' : ''}`}
                  />
                </div>

                <div className="song-details">
                  <h1>{currentSong.title}</h1>
                  <p>{currentSong.artist}</p>
                </div>
              </>
            )}

            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />

            <div className="controls-wrapper">
              <Controls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            </div>

            <div className="queue-section">
              {/* Queue button removed */}
            </div>

            <Player
              videoId={currentSong.youtubeId}
              onReady={handlePlayerReady}
              onStateChange={handleStateChange}
            />
          </div>
        </div>

        {/* Playlist Panel */}
        <div className={`playlist-panel ${showPlaylist ? 'visible' : ''}`}>
          <div className="playlist-header">
            <h2>Queue</h2>
            <button className="close-playlist" onClick={togglePlaylist} title="Close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <Playlist
            songs={songs}
            allSongs={songs}
            currentSongId={currentSong.id}
            onSelectSong={handleSelectSong}
            searchQuery=""
          />
        </div>
      </div>
    </div>
  );
}

export default App;