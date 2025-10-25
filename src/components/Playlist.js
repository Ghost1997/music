import React from 'react';
import '../styles/Playlist.css';

const Playlist = ({
  songs,
  currentSongId,
  onSelectSong,
  onAddToQueue,
  onRemoveFromQueue,
  onAddToPlaylist,
  searchQuery
}) => {
  const displayMessage = searchQuery && songs.length === 0;

  return (
    <div className="playlist">
      {displayMessage ? (
        <div className="no-results">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <p>No songs found</p>
          <span>Try searching for something else</span>
        </div>
      ) : (
        <div className="song-list">
          {songs.map((song) => (
            <div
              key={song.youtubeId}
              className={`song-item ${currentSongId === song.id ? 'active' : ''}`}
              onClick={() => onSelectSong(song)}
            >
              <div className="song-thumbnail-wrapper">
                <img 
                  src={song.thumbnail} 
                  alt={song.title} 
                  className="song-thumbnail" 
                />
                {currentSongId === song.id && (
                  <div className="playing-overlay">
                    <div className="playing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className="song-info">
                <div className="song-title">{song.title}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
              {(onAddToQueue || onRemoveFromQueue) && (
                <div className="song-actions">
                  {onAddToQueue && (
                    <button
                      className="queue-inline-btn add"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(song);
                      }}
                      title="Add to queue"
                    >
                      + Queue
                    </button>
                  )}
                  {onRemoveFromQueue && (
                    <button
                      className="queue-inline-btn remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromQueue(song.youtubeId);
                      }}
                      title="Remove from queue"
                    >
                      Remove
                    </button>
                  )}
                  {onAddToPlaylist && (
                    <button
                      className="queue-inline-btn playlist"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylist(song);
                      }}
                      title="Add to playlist"
                    >
                      Playlist
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlist;