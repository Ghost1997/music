import React, { useState, useEffect, useCallback } from 'react';
import '../styles/LikedSongs.css';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { songAPI } from '../services/api';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

function LikedSongs() {
  const { isAuthenticated } = useAuth();
  const { playSongWithContext, currentSong, playbackContext, addToQueue } = useMusicPlayer();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const loadLikedSongs = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedSongs([]);
      localStorage.removeItem('likedSongsSync');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await songAPI.getLikedSongs();
      if (response.success && Array.isArray(response.data)) {
        setLikedSongs(response.data);
        localStorage.setItem('likedSongsSync', JSON.stringify(response.data));
      } else {
        setError(response.error || 'Failed to load liked songs');
        setLikedSongs([]);
      }
    } catch (err) {
      console.error('Error loading liked songs:', err);
      setError(err.message || 'Error loading liked songs');
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadLikedSongs();
  }, [loadLikedSongs]);

  const handlePlaySong = (song) => {
    if (!likedSongs.length) return;
    playSongWithContext(song, 'liked', likedSongs);
  };

  const handlePlayAll = () => {
    if (!likedSongs.length) return;
    playSongWithContext(likedSongs[0], 'liked', likedSongs);
  };

  const handleRemoveLike = async (youtubeId) => {
    if (!isAuthenticated) return;
    setRemovingId(youtubeId);
    try {
      const response = await songAPI.removeLikedSong(youtubeId);
      if (response.success) {
        const updated = response.likedSongs || likedSongs.filter(song => song.youtubeId !== youtubeId);
        setLikedSongs(updated);
        localStorage.setItem('likedSongsSync', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error removing liked song:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToPlaylist = (song) => {
    setSelectedSong(song);
    setShowAddToPlaylist(true);
  };

  const handleAddToQueue = (song) => {
    addToQueue(song);
  };

  if (loading) {
    return (
      <div className="liked-songs-container">
        <div className="loading">Loading liked songs...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="liked-songs-container">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h2>Sign in to see your liked songs</h2>
          <p>Create an account or log in to start saving music</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liked-songs-container">
        <div className="empty-state">
          <h2>Unable to load liked songs</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={loadLikedSongs}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="liked-songs-container">
      <div className="liked-songs-header">
        <div className="header-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
        <div className="header-info">
          <span className="header-type">Playlist</span>
          <h1>Liked Songs</h1>
          <p>{likedSongs.length} songs</p>
        </div>
      </div>

      {likedSongs.length > 0 && (
        <div className="liked-actions">
          <button className="play-all-btn" onClick={handlePlayAll}>
            Play All
          </button>
        </div>
      )}

      <div className="liked-songs-content">
        {likedSongs.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <h2>Songs you like will appear here</h2>
            <p>Save songs by clicking the heart icon</p>
          </div>
        ) : (
          <div className="songs-list">
            <div className="songs-list-header">
              <div className="col-index">#</div>
              <div className="col-title">Title</div>
              <div className="col-artist">Artist</div>
              <div className="col-actions"></div>
            </div>
            {likedSongs.map((song, index) => {
              const isCurrentSong = currentSong?.youtubeId === song.youtubeId && playbackContext === 'liked';
              return (
              <div 
                key={song.youtubeId} 
                className={`song-row ${isCurrentSong ? 'playing' : ''}`}
                onClick={() => handlePlaySong(song)}
              >
                <div className="col-index">{index + 1}</div>
                <div className="col-title">
                  <img src={song.thumbnail} alt={song.title} />
                  <span>{song.title}</span>
                </div>
                <div className="col-artist">{song.artist}</div>
                <div className="col-actions">
                  <button 
                    className="action-btn-song"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToQueue(song);
                    }}
                    title="Add to queue"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button 
                    className="action-btn-song"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(song);
                    }}
                    title="Add to playlist"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="15" y2="15"></line>
                    </svg>
                  </button>
                  <button 
                    className="unlike-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLike(song.youtubeId);
                    }}
                    title="Remove from Liked Songs"
                    disabled={removingId === song.youtubeId}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
      
      {showAddToPlaylist && selectedSong && (
        <AddToPlaylistModal 
          song={selectedSong}
          onClose={() => {
            setShowAddToPlaylist(false);
            setSelectedSong(null);
          }}
        />
      )}
    </div>
  );
}

export default LikedSongs;
