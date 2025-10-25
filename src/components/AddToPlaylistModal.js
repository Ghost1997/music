import React, { useState, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { playlistAPI } from '../services/playlistAPI';
import { songAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import '../styles/AddToPlaylistModal.css';

function AddToPlaylistModal({ song, onClose, onPlaylistsChange }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null);
  const [savingSong, setSavingSong] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const response = await playlistAPI.getAllPlaylists();
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!song?.youtubeId) {
      showToast('Unable to add song: missing YouTube ID', 'error');
      return;
    }

    try {
      setAddingTo(playlistId);

      if (!song.inDatabase) {
        try {
          setSavingSong(true);
          const payload = {
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            thumbnails: song.thumbnails,
            duration: song.duration,
            durationSeconds: song.durationSeconds,
            channelId: song.channelId,
            channelName: song.channelName,
            source: song.source || 'search'
          };

          const saveResult = await songAPI.saveSelectedSong(payload);

          if (!saveResult.success) {
            throw new Error(saveResult.error || 'Failed to persist song metadata');
          }

          // Mark song as persisted so future adds skip save
          song.inDatabase = true;

          const savedData = Array.isArray(saveResult.data)
            ? saveResult.data[0]
            : saveResult.data;

          if (savedData) {
            song.title = song.title || savedData.title;
            song.artist = song.artist || savedData.artist;
            song.thumbnail = song.thumbnail || savedData.thumbnail;
            song.duration = song.duration || savedData.duration;
            song.durationSeconds = song.durationSeconds || savedData.durationSeconds;
            song.channelName = song.channelName || savedData.channelName;
          }
        } catch (saveError) {
          console.error('Error saving song before playlist add:', saveError);
          showToast('Failed to save song details. Please try again.', 'error');
          return;
        } finally {
          setSavingSong(false);
        }
      }

      const response = await playlistAPI.addSongToPlaylist(playlistId, song.youtubeId);

      if (response.success) {
        // Update the playlist in the list to show checkmark
        setPlaylists(prev => prev.map(p => 
          p._id === playlistId 
            ? { ...p, songs: [...(p.songs || []), song] }
            : p
        ));
        
        if (onPlaylistsChange) {
          onPlaylistsChange();
        }

        showToast('Added to playlist', 'success');
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      showToast('Failed to add song to playlist', 'error');
    } finally {
      setAddingTo(null);
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    try {
      setCreating(true);
      const response = await playlistAPI.createPlaylist({
        name: newPlaylistName.trim(),
        description: ''
      });

      if (response.success && response.playlist) {
        showToast('Playlist created', 'success');
        // Add song to the new playlist
        await handleAddToPlaylist(response.playlist._id);
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      showToast('Failed to create playlist', 'error');
    } finally {
      setCreating(false);
    }
  };

  const isSongInPlaylist = (playlist) => {
    return playlist.songs?.some(s => s.youtubeId === song.youtubeId);
  };

  return (
    <>
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
      <div className="modal-overlay" onClick={onClose}>
      <div className="add-to-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add to Playlist</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-song-info">
          <img src={song.thumbnail} alt={song.title} />
          <div>
            <div className="song-title-modal">{song.title}</div>
            <div className="song-artist-modal">{song.artist}</div>
          </div>
        </div>

        <div className="modal-content">
          {!showCreateNew ? (
            <>
              <button 
                className="create-new-playlist-btn"
                onClick={() => setShowCreateNew(true)}
              >
                <Plus size={20} />
                <span>Create New Playlist</span>
              </button>

              {loading ? (
                <div className="loading-playlists">Loading playlists...</div>
              ) : playlists.length === 0 ? (
                <div className="no-playlists">
                  <p>You don't have any playlists yet</p>
                </div>
              ) : (
                <div className="playlists-list">
                  {playlists.map(playlist => (
                    <div
                      key={playlist._id}
                      className={`playlist-item ${isSongInPlaylist(playlist) ? 'added' : ''}`}
                      onClick={() => !isSongInPlaylist(playlist) && !savingSong && handleAddToPlaylist(playlist._id)}
                    >
                      <div className="playlist-item-cover">
                        {(() => {
                          const coverSong = playlist.songs?.find(s => s?.thumbnail);
                          return coverSong ? (
                            <img src={coverSong.thumbnail} alt={coverSong.title || playlist.name} />
                          ) : (
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"></path>
                            </svg>
                          );
                        })()}
                      </div>
                      <div className="playlist-item-info">
                        <div className="playlist-item-name">{playlist.name}</div>
                        <div className="playlist-item-count">{playlist.songs?.length || 0} songs</div>
                      </div>
                      {isSongInPlaylist(playlist) ? (
                        <Check size={20} className="check-icon" />
                      ) : addingTo === playlist._id || savingSong ? (
                        <div className="adding-spinner"></div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="create-playlist-form">
              <button 
                type="button"
                className="back-btn"
                onClick={() => setShowCreateNew(false)}
              >
                ← Back
              </button>
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                maxLength={50}
              />
              <button 
                type="submit" 
                className="create-submit-btn"
                disabled={!newPlaylistName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create and Add'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default AddToPlaylistModal;
