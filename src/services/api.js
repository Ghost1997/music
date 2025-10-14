const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/music';

console.log('API Base URL:', API_BASE_URL); // Debug log

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
          data: {
            ...data.video,
            thumbnail: getBestThumbnail(data.video)
          }
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
      console.log('Fetching songs from:', `${API_BASE_URL}/videos?limit=${limit}`);
      const response = await fetch(`${API_BASE_URL}/videos?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        data.data = data.data.map(video => ({
          ...video,
          thumbnail: getBestThumbnail(video)
        }));
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
      
      if (data.success) {
        data.data = data.data.map(video => ({
          ...video,
          thumbnail: getBestThumbnail(video)
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error searching songs:', error);
      throw error;
    }
  },

  getSongByYoutubeId: async (youtubeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${youtubeId}`);
      const data = await response.json();
      
      if (data.success && data.video) {
        data.video.thumbnail = getBestThumbnail(data.video);
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
  }
};

export { getBestThumbnail };