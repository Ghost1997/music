import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { songAPI } from '../services/api';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import '../styles/Home.css';

function Home() {
  const navigate = useNavigate();
  const { playSongWithContext, currentSong, playbackContext } = useMusicPlayer();
  
  const [songs, setSongs] = useState([]);
  const [groupedByArtist, setGroupedByArtist] = useState({});
  const [groupedByChannel, setGroupedByChannel] = useState({});
  const [topSongs, setTopSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSongs();
  }, []);

  const fetchAllSongs = async () => {
    try {
      setLoading(true);
      // Backend now handles optimization, randomization, and returns ALL songs per artist/channel
      const response = await songAPI.getDashboard({
        topSongsLimit: 20,
        topArtistsLimit: 12,
        topChannelsLimit: 12,
        songsPerArtist: 0, // 0 = all songs
        songsPerChannel: 0, // 0 = all songs
        includeAllSongs: false,
        randomize: true
      });
      
      if (response.success && response.data) {
        const { topSongs: apiTopSongs, topArtists: apiTopArtists, topChannels: apiTopChannels } = response.data;
        
        // Collect all songs from artists and channels to build full library
        const allSongsSet = new Map();
        
        // Add songs from top songs
        apiTopSongs.forEach(song => {
          allSongsSet.set(song.youtubeId, {
            id: song._id,
            youtubeId: song.youtubeId,
            title: song.title,
            artist: song.artist?.split('|')[0].trim() || 'Unknown Artist',
            channelName: song.channelName || 'Unknown Channel',
            thumbnail: song.thumbnail,
            inDatabase: true,
            viewCount: parseInt(song.viewCount) || 0,
            likeCount: parseInt(song.likeCount) || 0
          });
        });
        
        setSongs(Array.from(allSongsSet.values()));
        
        // Use API-provided top songs
        const formattedTopSongs = apiTopSongs.map(song => ({
          id: song._id,
          youtubeId: song.youtubeId,
          title: song.title,
          artist: song.artist?.split('|')[0].trim() || 'Unknown Artist',
          channelName: song.channelName || 'Unknown Channel',
          thumbnail: song.thumbnail,
          inDatabase: true,
          viewCount: parseInt(song.viewCount) || 0,
          likeCount: parseInt(song.likeCount) || 0
        }));
        setTopSongs(formattedTopSongs);
        
        // Use API-provided top artists (backend already randomized)
        const artistGroups = {};
        apiTopArtists.forEach(artistData => {
          const formattedSongs = artistData.songs.map(song => {
            const formatted = {
              id: song._id,
              youtubeId: song.youtubeId,
              title: song.title,
              artist: song.artist?.split('|')[0].trim() || 'Unknown Artist',
              channelName: song.channelName || 'Unknown Channel',
              thumbnail: song.thumbnail,
              inDatabase: true,
              viewCount: parseInt(song.viewCount) || 0,
              likeCount: parseInt(song.likeCount) || 0
            };
            allSongsSet.set(song.youtubeId, formatted);
            return formatted;
          });
          artistGroups[artistData.artist] = formattedSongs;
        });
        setGroupedByArtist(artistGroups);
        
        // Use API-provided top channels (backend already randomized)
        const channelGroups = {};
        apiTopChannels.forEach(channelData => {
          const formattedSongs = channelData.songs.map(song => {
            const formatted = {
              id: song._id,
              youtubeId: song.youtubeId,
              title: song.title,
              artist: song.artist?.split('|')[0].trim() || 'Unknown Artist',
              channelName: song.channelName || 'Unknown Channel',
              thumbnail: song.thumbnail,
              inDatabase: true,
              viewCount: parseInt(song.viewCount) || 0,
              likeCount: parseInt(song.likeCount) || 0
            };
            allSongsSet.set(song.youtubeId, formatted);
            return formatted;
          });
          channelGroups[channelData.channelName] = formattedSongs;
        });
        setGroupedByChannel(channelGroups);
        
        // Update full songs list after collecting from all sources
        setSongs(Array.from(allSongsSet.values()));
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLibrary = () => {
    if (songs.length > 0) {
      playSongWithContext(songs[0], 'library', songs);
    }
  };

  const handleArtistClick = (artist, songs) => {
    navigate(`/dashboard/artist/${encodeURIComponent(artist)}`, { 
      state: { artist, songs } 
    });
  };

  const handleChannelClick = (channel, songs) => {
    navigate(`/dashboard/channel/${encodeURIComponent(channel)}`, { 
      state: { channel, songs } 
    });
  };

  if (loading) {
    return (
      <div className="home-container-new">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your library...</p>
        </div>
      </div>
    );
  }

  const topArtists = Object.entries(groupedByArtist)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  const topChannels = Object.entries(groupedByChannel)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  return (
    <div className="home-container-new">
      <div className="home-header">
        <h1>Your Library</h1>
        {songs.length > 0 && (
          <button className="play-library-btn" onClick={handlePlayLibrary}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play All
          </button>
        )}
      </div>

      {songs.length === 0 ? (
        <div className="empty-library">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Your library is empty</h2>
          <p>Search for songs using the search bar above</p>
        </div>
      ) : (
        <>
          {/* Artists Section */}
          {topArtists.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2>Your Top Artists</h2>
              </div>
              <div className="artists-grid">
                {topArtists.map(([artist, artistSongs]) => (
                  <div 
                    key={artist} 
                    className="artist-card"
                    onClick={() => handleArtistClick(artist, artistSongs)}
                  >
                    <div className="artist-image">
                      <img src={artistSongs[0].thumbnail} alt={artist} />
                      <div className="artist-overlay">
                        <button className="play-btn-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="artist-info">
                      <div className="artist-name">{artist}</div>
                      <div className="artist-count">{artistSongs.length} songs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channels Section */}
          {topChannels.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2>Your Top Channels</h2>
              </div>
              <div className="channels-grid">
                {topChannels.map(([channel, channelSongs]) => (
                  <div 
                    key={channel} 
                    className="channel-card"
                    onClick={() => handleChannelClick(channel, channelSongs)}
                  >
                    <div className="channel-image">
                      <img src={channelSongs[0].thumbnail} alt={channel} />
                      <div className="channel-overlay">
                        <button className="play-btn-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="channel-info">
                      <div className="channel-name">{channel}</div>
                      <div className="channel-count">{channelSongs.length} songs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Songs */}
          {topSongs.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2>Top Songs</h2>
                <span className="section-subtitle">Based on views and likes</span>
              </div>
              <div className="library-grid">
                {topSongs.map((song) => {
                  const isCurrentSong = currentSong?.youtubeId === song.youtubeId && playbackContext === 'library';
                  return (
                    <div 
                      key={song.youtubeId} 
                      className={`library-card ${isCurrentSong ? 'playing' : ''}`}
                      onClick={() => playSongWithContext(song, 'library', songs)}
                    >
                      <div className="library-card-image">
                        <img src={song.thumbnail} alt={song.title} />
                        {isCurrentSong && (
                          <div className="playing-overlay">
                            <div className="playing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="library-card-info">
                        <div className="library-card-title">{song.title}</div>
                        <div className="library-card-artist">{song.artist}</div>
                        {(song.viewCount > 0 || song.likeCount > 0) && (
                          <div className="library-card-stats">
                            {song.viewCount > 0 && <span>{(song.viewCount / 1000000).toFixed(1)}M views</span>}
                            {song.likeCount > 0 && <span>{(song.likeCount / 1000).toFixed(1)}K likes</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* All Songs */}
          {songs.length > 12 && (
            <div className="section">
              <div className="section-header">
                <h2>All Songs</h2>
              </div>
              <div className="library-grid">
                {songs.slice(0, 12).map((song) => {
                  const isCurrentSong = currentSong?.youtubeId === song.youtubeId && playbackContext === 'library';
                  return (
                    <div 
                      key={song.youtubeId} 
                      className={`library-card ${isCurrentSong ? 'playing' : ''}`}
                      onClick={() => playSongWithContext(song, 'library', songs)}
                    >
                      <div className="library-card-image">
                        <img src={song.thumbnail} alt={song.title} />
                        {isCurrentSong && (
                          <div className="playing-overlay">
                            <div className="playing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="library-card-info">
                        <div className="library-card-title">{song.title}</div>
                        <div className="library-card-artist">{song.artist}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
