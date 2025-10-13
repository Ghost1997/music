import React, { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import Controls from './components/Controls';
import ProgressBar from './components/ProgressBar';
import Playlist from './components/Playlist';
import SearchBar from './components/SearchBar';
import songsData from './data/songs.json';
import './styles/App.css';

function App() {
  const [songs] = useState(songsData.songs);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentSong = songs[currentSongIndex];

  // Filter songs based on search
  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle next song
  const handleNext = useCallback(() => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    setCurrentSongIndex(nextIndex);
    setCurrentTime(0);
    setPlayerReady(false);
  }, [currentSongIndex, songs.length]);

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
    if (event.data === 0) {
      handleNext();
    } else if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  }, [handleNext]);

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
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    setCurrentSongIndex(prevIndex);
    setCurrentTime(0);
    setPlayerReady(false);
  };

  const handleSelectSong = (song) => {
    const index = songs.findIndex(s => s.id === song.id);
    setCurrentSongIndex(index);
    setCurrentTime(0);
    setPlayerReady(false);
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

  return (
    <div className="app">
      <div className="app-container">
        {/* Main Player */}
        <div className="player-container">
          <div className="player-section">
            {/* Search Bar with Dropdown */}
            <div className="main-search">
              <div className="search-container">
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
                        key={song.id}
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
            </div>


            <div className="album-art-container">
              <div className="album-art-glow" style={{ backgroundImage: `url(${currentSong.thumbnail})` }}></div>
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