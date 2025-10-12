import React, { useState, useEffect, useCallback } from 'react';
import Player from './components/Player';
import Controls from './components/Controls';
import ProgressBar from './components/ProgressBar';
import Playlist from './components/Playlist';
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

  const currentSong = songs[currentSongIndex];

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
    const dur = playerInstance.getDuration();
    setDuration(dur);
  }, []);

  const handleStateChange = useCallback((event) => {
    // 0: ended, 1: playing, 2: paused
    if (event.data === 0) {
      // Song ended, play next
      handleNext();
    } else if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    }
  }, [handleNext]);

  const handlePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
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
  };

  const handleSeek = (time) => {
    if (player && player.seekTo) {
      player.seekTo(time);
      setCurrentTime(time);
    }
  };

  // Auto-play when player is ready
  useEffect(() => {
    if (playerReady && player) {
      player.playVideo();
    }
  }, [playerReady, player, currentSongIndex]);

  return (
    <div className="app">
      <div className="player-section">
        <div className="now-playing">
          <img 
            src={currentSong.thumbnail} 
            alt={currentSong.title} 
            className="album-art"
          />
          <div className="song-details">
            <h1>{currentSong.title}</h1>
            <p>{currentSong.artist}</p>
          </div>
        </div>

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />

        <Controls
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />

        <Player
          videoId={currentSong.youtubeId}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
        />
      </div>

      <Playlist
        songs={songs}
        currentSongId={currentSong.id}
        onSelectSong={handleSelectSong}
      />
    </div>
  );
}

export default App;