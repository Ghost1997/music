import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Trash2, Play, AlertTriangle } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { playlistAPI } from '../services/playlistAPI';
import { songAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import '../styles/PlaylistDetail.css';

function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSongWithContext, currentSong, playbackContext } = useMusicPlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const hydrateSongs = async (songs = []) => {
    const enriched = await Promise.all(songs.map(async (song) => {
      if (song?.title && song?.artist && song?.thumbnail) {
        return song;
      }

      try {
        const lookupId = song.youtubeId || song._id || song.id;
        if (!lookupId) {
          return {
            ...song,
            title: song.title || 'Unknown Title',
            artist: song.artist || 'Unknown Artist'
          };
        }

        const response = await songAPI.getSongByYoutubeId(lookupId);
        const data = response?.video || response?.data || response;

        if (data) {
          return {
            ...song,
            youtubeId: song.youtubeId || data.youtubeId || data.id || lookupId,
            title: song.title || data.title || 'Unknown Title',
            artist: song.artist || data.artist || data.channelName || 'Unknown Artist',
            thumbnail: song.thumbnail || data.thumbnail || '',
            duration: song.duration || data.duration
          };
        }
      } catch (err) {
        console.error('Error enriching song metadata:', err);
      }

      return {
        ...song,
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist',
        thumbnail: song.thumbnail || ''
      };
    }));

    return enriched;
  };

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const response = await playlistAPI.getPlaylistById(id);
      
      if (response.success) {
        const hydratedSongs = await hydrateSongs(response.playlist?.songs || []);
        setPlaylist({ ...response.playlist, songs: hydratedSongs });
      } else {
        setError('Playlist not found');
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song) => {
    if (!playlist || !playlist.songs) return;
    playSongWithContext(song, `playlist-${id}`, playlist.songs);
  };

  const handlePlayAll = () => {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
    playSongWithContext(playlist.songs[0], `playlist-${id}`, playlist.songs);
  };

  const handleRemoveSong = async (songYoutubeId) => {
    if (!window.confirm('Remove this song from the playlist?')) return;

    if (!songYoutubeId) {
      showToast('Unable to remove song: missing identifier', 'error');
      return;
    }

    try {
      const response = await playlistAPI.removeSongFromPlaylist(id, songYoutubeId);
      
      if (response.success) {
        await loadPlaylist();
        showToast('Song removed from playlist', 'success');
      } else {
        showToast('Failed to remove song', 'error');
      }
    } catch (error) {
      console.error('Error removing song:', error);
      showToast('Failed to remove song', 'error');
    }
  };

  const handleDeletePlaylist = () => {
    setIsDeleteConfirmOpen(true);
  };

  const closeDeleteConfirmation = () => {
    if (isDeletingPlaylist) return;
    setIsDeleteConfirmOpen(false);
  };

  const confirmDeletePlaylist = async () => {
    if (isDeletingPlaylist) return;

    try {
      setIsDeletingPlaylist(true);
      const response = await playlistAPI.deletePlaylist(id);

      if (response.success) {
        showToast('Playlist deleted', 'success');
        setIsDeleteConfirmOpen(false);
        setTimeout(() => navigate('/dashboard/playlists'), 500);
      } else {
        showToast('Failed to delete playlist', 'error');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      showToast('Failed to delete playlist', 'error');
    } finally {
      setIsDeletingPlaylist(false);
    }
  };

  if (loading) {
    return (
      <div className="playlist-detail-container">
        <div className="loading">Loading playlist...</div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="playlist-detail-container">
        <div className="error-state">
          <h2>{error || 'Playlist not found'}</h2>
          <button onClick={() => navigate('/dashboard/playlists')}>
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  const coverSong = playlist.songs?.find((song) => song.thumbnail);

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
      <div className="playlist-detail-container">
      <div className="playlist-detail-header">
        <div className="header-cover">
          {coverSong ? (
            <img src={coverSong.thumbnail} alt={coverSong.title || playlist.name} />
          ) : (
            <div className="cover-placeholder">
              <Music size={64} />
            </div>
          )}
        </div>
        <div className="header-info">
          <span className="header-type">Playlist</span>
          <h1>{playlist.name}</h1>
          {playlist.description && <p className="description">{playlist.description}</p>}
          <div className="playlist-meta">
            <span>{playlist.songs?.length || 0} songs</span>
          </div>
        </div>
      </div>

      <div className="playlist-actions">
        {playlist.songs && playlist.songs.length > 0 && (
          <button className="play-all-btn" onClick={handlePlayAll}>
            <Play size={20} fill="currentColor" />
            <span>Play</span>
          </button>
        )}
        <button className="delete-playlist-btn" onClick={handleDeletePlaylist}>
          <Trash2 size={20} />
          <span>Delete Playlist</span>
        </button>
      </div>

      <div className="playlist-songs">
        {!playlist.songs || playlist.songs.length === 0 ? (
          <div className="empty-playlist">
            <Music size={64} />
            <h2>No songs in this playlist</h2>
            <p>Add songs from the home page</p>
          </div>
        ) : (
          <div className="songs-list">
            <div className="songs-list-header">
              <div className="col-index">#</div>
              <div className="col-title">Title</div>
              <div className="col-artist">Artist</div>
              <div className="col-actions"></div>
            </div>
            {playlist.songs.map((song, index) => {
              const isCurrentSong = currentSong?.youtubeId === song.youtubeId && playbackContext === `playlist-${id}`;
              const songTitle = song.title || 'Unknown Title';
              const songArtist = song.artist || 'Unknown Artist';
              return (
              <div 
                key={song._id || song.youtubeId} 
                className={`song-row ${isCurrentSong ? 'playing' : ''}`}
              >
                <div className="col-index">{index + 1}</div>
                <div className="col-title" onClick={() => handlePlaySong(song)}>
                  {song.thumbnail ? (
                    <img src={song.thumbnail} alt={songTitle} />
                  ) : (
                    <div className="song-thumb-placeholder">
                      <Music size={18} />
                    </div>
                  )}
                  <span>{songTitle}</span>
                </div>
                <div className="col-artist">{songArtist}</div>
                <div className="col-actions">
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveSong(song.youtubeId)}
                    title="Remove from playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
      {isDeleteConfirmOpen && (
        <div className="confirm-overlay" onClick={closeDeleteConfirmation}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <AlertTriangle size={36} />
            </div>
            <h3>Delete playlist?</h3>
            <p>This action cannot be undone. You will lose this playlist and its song order.</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={closeDeleteConfirmation}
                disabled={isDeletingPlaylist}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={confirmDeletePlaylist}
                disabled={isDeletingPlaylist}
              >
                {isDeletingPlaylist ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default PlaylistDetail;
