import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { songAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import '../styles/TopBar.css';

const TopBar = ({ extraContent = null }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const { user, logout } = useAuth();
  const { playSongWithContext, playSongOnly, addToQueue } = useMusicPlayer();
  const { toasts, showToast, removeToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await songAPI.hybridSearch(searchQuery);
        if (response.success) {
          const formattedResults = response.data.map(song => ({
            id: song._id || song.youtubeId,
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist.split('|')[0].trim(),
            thumbnail: song.thumbnail,
            inDatabase: song.inDatabase,
            source: song.source
          }));
          setSearchResults(formattedResults);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handlePlaySong = (song) => {
    playSongOnly(song);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleAddToQueue = (song) => {
    addToQueue(song);
    setShowResults(false);
  };

  const handleSaveToDatabase = async (song, event) => {
    event.stopPropagation();
    
    try {
      setSavingId(song.youtubeId);
      const response = await songAPI.saveSelectedSong(song);
      
      if (response.success) {
        showToast('Song saved to database', 'success');
        // Update the search results to mark this song as saved
        setSearchResults(prev => prev.map(s => 
          s.youtubeId === song.youtubeId 
            ? { ...s, inDatabase: true }
            : s
        ));
      } else {
        showToast(response.error || 'Failed to save song', 'error');
      }
    } catch (error) {
      console.error('Error saving song:', error);
      showToast('Failed to save song', 'error');
    } finally {
      setSavingId(null);
    }
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
      <div className="topbar">
      <div className="topbar-search">
        <div className="search-container-topbar">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="search-input-topbar"
          />
          {searchQuery && (
            <button 
              className="clear-search-topbar" 
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        {showResults && (
          <div className="search-results-dropdown">
            {isSearching ? (
              <div className="search-loading">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.slice(0, 5).map(song => (
                <div key={song.youtubeId} className="search-result-item">
                  <img src={song.thumbnail} alt={song.title} onClick={() => handlePlaySong(song)} />
                  <div className="search-result-info" onClick={() => handlePlaySong(song)}>
                    <div className="search-result-title">{song.title}</div>
                    <div className="search-result-meta">
                      <span className="search-result-artist">{song.artist}</span>
                      <span
                        className={`search-result-source ${song.inDatabase ? 'source-db' : 'source-yt'}`}
                      >
                        {song.inDatabase ? 'Saved' : (song.source === 'youtube' ? 'YouTube' : 'External')}
                      </span>
                    </div>
                  </div>
                  <div className="search-result-actions">
                    {!song.inDatabase && (
                      <button 
                        className="save-to-db-btn"
                        onClick={(e) => handleSaveToDatabase(song, e)}
                        disabled={savingId === song.youtubeId}
                        title="Save to database"
                      >
                        {savingId === song.youtubeId ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                            <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                            <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        )}
                      </button>
                    )}
                    <button 
                      className="add-to-queue-btn"
                      onClick={() => handleAddToQueue(song)}
                      title="Add to queue"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12h18M3 6h18M3 18h18"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="search-loading">No results</div>
            )}
          </div>
        )}
      </div>
      <div className="topbar-content">
        {extraContent}
      </div>
      <div className="topbar-user">
        <div className="user-menu" onClick={() => setShowMenu(!showMenu)}>
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.displayName} />
            ) : (
              <User size={20} />
            )}
          </div>
          <span className="user-name">{user?.displayName || user?.username}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 6l5 5 5-5H3z"/>
          </svg>
        </div>

        {showMenu && (
          <div className="user-dropdown">
            <div className="dropdown-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Log out</span>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default TopBar;
