const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const getBestThumbnail = (video) => {
  if (video.thumbnails) {
    return video.thumbnails.maxres || 
           video.thumbnails.standard ||
           video.thumbnails.high || 
           video.thumbnails.medium || 
           video.thumbnail;
  }
  return video.thumbnail;
};

const formatSongData = (video) => ({
  ...video,
  thumbnail: getBestThumbnail(video)
});

export const songAPI = {
  getSongDetails: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/video/${youtubeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.video) {
        data.video = formatSongData(data.video);
        return { success: true, data: data.video };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error getting song details:', error);
      // Check if it's a network error
      if (error.message === 'Failed to fetch') {
        return { success: false, error: 'Network error. Please check your connection.' };
      }
      return { success: false, error: error.message };
    }
  },

  replaceQueue: async (songs) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/queue/replace`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ songs })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set queue');
      }

      return data;
    } catch (error) {
      console.error('Error setting queue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  getQueue: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/queue`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch queue');
      }

      return data;
    } catch (error) {
      console.error('Error fetching queue:', error);
      return {
        success: false,
        error: error.message,
        queue: []
      };
    }
  },

  updateQueueOrder: async (songIds) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/queue`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ songIds })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update queue');
      }

      return data;
    } catch (error) {
      console.error('Error updating queue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  addToQueue: async (song) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/queue`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(song?.youtubeId ? song : { song })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to queue');
      }

      return data;
    } catch (error) {
      console.error('Error adding to queue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  removeFromQueue: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/queue/${youtubeId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from queue');
      }

      return data;
    } catch (error) {
      console.error('Error removing from queue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  getLikedSongs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/liked`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch liked songs');
      }

      return data;
    } catch (error) {
      console.error('Error fetching liked songs:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  addLikedSong: async (song) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/liked`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(song)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add liked song');
      }

      return data;
    } catch (error) {
      console.error('Error adding liked song:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  removeLikedSong: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/liked/${youtubeId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove liked song');
      }

      return data;
    } catch (error) {
      console.error('Error removing liked song:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  getAllSongs: async (limit = 100) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/videos?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && Array.isArray(data.data)) {
        data.data = data.data.map(formatSongData);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching songs:', error);
      throw error;
    }
  },

  getDashboard: async (options = {}) => {
    try {
      const {
        topSongsLimit = 20,
        topArtistsLimit = 12,
        topChannelsLimit = 12,
        songsPerArtist = 0,
        songsPerChannel = 0,
        includeAllSongs = false,
        randomize = true
      } = options;
      
      const params = new URLSearchParams({
        topSongsLimit: topSongsLimit.toString(),
        topArtistsLimit: topArtistsLimit.toString(),
        topChannelsLimit: topChannelsLimit.toString(),
        songsPerArtist: songsPerArtist.toString(),
        songsPerChannel: songsPerChannel.toString(),
        includeAllSongs: includeAllSongs.toString(),
        randomize: randomize.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/api/music/dashboard?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  searchSongs: async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        data.data = data.data.map(formatSongData);
      }
      
      return data;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  },

  // NEW: Hybrid search (database + YouTube)
  hybridSearch: async (query) => {
    try {
      if (!query || query.trim() === '') {
        return { success: false, error: 'Search query is required', data: [], count: 0 };
      }

      const trimmedQuery = query.trim();
      
      const response = await fetch(
        `${API_BASE_URL}/api/music/search/hybrid?q=${encodeURIComponent(trimmedQuery)}&limit=20`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success && Array.isArray(data.data)) {
        data.data = data.data.map(formatSongData);
      }
      
      return data;
    } catch (error) {
      console.error('Error in hybrid search:', error);
      return { 
        success: false, 
        error: error.message, 
        data: [],
        count: 0,
        stats: { fromDatabase: 0, fromYoutube: 0 }
      };
    }
  },

  // NEW: Save selected song to database
  saveSelectedSong: async (song) => {
    try {
      if (!song || !song.youtubeId) {
        throw new Error('Invalid song data: youtubeId is required');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/music/search/save-selected`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(song)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving song:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save song'
      };
    }
  },

  getSongByYoutubeId: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/video/${youtubeId}`);
      const data = await response.json();
      
      if (data.success && data.video) {
        data.video = formatSongData(data.video);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching song:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  deleteSong: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/music/video/${youtubeId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting song:', error);
      return { success: false, error: error.message };
    }
  }
};

export { getBestThumbnail };