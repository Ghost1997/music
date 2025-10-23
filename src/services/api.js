const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/music';

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
      const response = await fetch(`${API_BASE_URL}/video/${youtubeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.video) {
        return { 
          success: true, 
          data: formatSongData(data.video)
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error getting song details:', error);
      return { success: false, error: error.message };
    }
  },
  
  getAllSongs: async (limit = 100) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos?limit=${limit}`, {
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

  searchSongs: async (query) => {
    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
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
        `${API_BASE_URL}/search/hybrid?q=${encodeURIComponent(trimmedQuery)}&limit=20`,
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
      
      const response = await fetch(`${API_BASE_URL}/search/save-selected`, {
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
      const response = await fetch(`${API_BASE_URL}/video/${youtubeId}`);
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
      const response = await fetch(`${API_BASE_URL}/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  deleteSong: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${youtubeId}`, {
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