import React from 'react';

const Playlist = ({ songs, currentSongId, onSelectSong }) => {
  return (
    <div className="playlist">
      <h2>Playlist</h2>
      <div className="song-list">
        {songs.map((song) => (
          <div
            key={song.id}
            className={`song-item ${currentSongId === song.id ? 'active' : ''}`}
            onClick={() => onSelectSong(song)}
          >
            <img src={song.thumbnail} alt={song.title} className="song-thumbnail" />
            <div className="song-info">
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
            {currentSongId === song.id && (
              <div className="playing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist;