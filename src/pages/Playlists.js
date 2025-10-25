import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus, Music } from 'lucide-react';
import { playlistAPI } from '../services/playlistAPI';
import '../styles/Playlists.css';

function Playlists() {
  const navigate = useNavigate();
  const { playlists, loadPlaylists } = useOutletContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    try {
      setCreating(true);
      setError('');
      
      const response = await playlistAPI.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim()
      });

      if (response.success) {
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateModal(false);
        await loadPlaylists();
        
        // Navigate to the new playlist
        if (response.playlist && response.playlist._id) {
          navigate(`/dashboard/playlist/${response.playlist._id}`);
        }
      } else {
        setError(response.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/dashboard/playlist/${playlistId}`);
  };

  return (
    <div className="playlists-container">
      <div className="playlists-header">
        <h1>Your Playlists</h1>
        <button 
          className="create-playlist-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          <span>Create Playlist</span>
        </button>
      </div>

      <div className="playlists-grid">
        {playlists.length === 0 ? (
          <div className="empty-playlists">
            <Music size={64} />
            <h2>No playlists yet</h2>
            <p>Create your first playlist to organize your music</p>
            <button 
              className="create-first-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={20} />
              <span>Create Playlist</span>
            </button>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div 
              key={playlist._id}
              className="playlist-card"
              onClick={() => handlePlaylistClick(playlist._id)}
            >
              <div className="playlist-cover">
                {playlist.songs && playlist.songs.length > 0 ? (
                  <img 
                    src={playlist.songs[0].thumbnail} 
                    alt={playlist.name}
                  />
                ) : (
                  <div className="playlist-placeholder">
                    <Music size={48} />
                  </div>
                )}
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p>{playlist.description || 'No description'}</p>
                <span className="playlist-count">
                  {playlist.songs?.length || 0} songs
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Playlist</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label htmlFor="playlist-name">Playlist Name *</label>
                <input
                  id="playlist-name"
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="playlist-description">Description</label>
                <textarea
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Add a description (optional)"
                  maxLength={200}
                  rows={3}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={creating || !newPlaylistName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
