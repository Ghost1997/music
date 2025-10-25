import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import '../styles/ArtistDetail.css';

function ArtistDetail() {
  const { artist } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { playSongWithContext, currentSong, playbackContext, addToQueue } = useMusicPlayer();
  
  const artistName = decodeURIComponent(artist);
  const allSongs = location.state?.songs || [];
  
  // Pagination state
  const [displayedSongs, setDisplayedSongs] = useState([]);
  const [page, setPage] = useState(1);
  const SONGS_PER_PAGE = 50;
  
  useEffect(() => {
    // Load initial songs
    setDisplayedSongs(allSongs.slice(0, SONGS_PER_PAGE));
  }, [allSongs]);
  
  const loadMore = () => {
    const nextPage = page + 1;
    const startIndex = 0;
    const endIndex = nextPage * SONGS_PER_PAGE;
    setDisplayedSongs(allSongs.slice(startIndex, endIndex));
    setPage(nextPage);
  };
  
  const hasMore = displayedSongs.length < allSongs.length;

  const handlePlayAll = () => {
    if (allSongs.length > 0) {
      playSongWithContext(allSongs[0], `artist-${artistName}`, allSongs);
    }
  };

  const handlePlaySong = (song) => {
    playSongWithContext(song, `artist-${artistName}`, allSongs);
  };

  const handleAddToQueue = (song) => {
    addToQueue(song);
  };

  if (allSongs.length === 0) {
    return (
      <div className="artist-detail-container">
        <div className="empty-state">
          <h2>No songs found for this artist</h2>
          <button onClick={() => navigate('/dashboard')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-detail-container">
      <div className="artist-detail-header">
        <div className="artist-header-image">
          <img src={allSongs[0].thumbnail} alt={artistName} />
        </div>
        <div className="artist-header-info">
          <span className="header-type">Artist</span>
          <h1>{artistName}</h1>
          <p>{allSongs.length} songs</p>
        </div>
      </div>

      <div className="artist-actions">
        <button className="play-all-btn" onClick={handlePlayAll}>
          <Play size={20} fill="currentColor" />
          <span>Play</span>
        </button>
      </div>

      <div className="artist-songs">
        <div className="songs-list">
          <div className="songs-list-header">
            <div className="col-index">#</div>
            <div className="col-title">Title</div>
            <div className="col-actions"></div>
          </div>
          {displayedSongs.map((song, index) => {
            const isCurrentSong = currentSong?.youtubeId === song.youtubeId && playbackContext === `artist-${artistName}`;
            return (
              <div 
                key={song.youtubeId} 
                className={`song-row ${isCurrentSong ? 'playing' : ''}`}
              >
                <div className="col-index">{index + 1}</div>
                <div className="col-title" onClick={() => handlePlaySong(song)}>
                  <img src={song.thumbnail} alt={song.title} />
                  <div className="title-info">
                    <span className="song-title">{song.title}</span>
                    <span className="song-subtitle">{song.channelName || 'Unknown'}</span>
                  </div>
                </div>
                <div className="col-actions">
                  <button 
                    className="action-btn"
                    onClick={() => handleAddToQueue(song)}
                    title="Add to queue"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {hasMore && (
          <div className="load-more-container">
            <button className="load-more-btn" onClick={loadMore}>
              Load More ({allSongs.length - displayedSongs.length} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistDetail;
