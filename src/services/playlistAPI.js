import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const playlistAPI = {
  // Get all user playlists
  getAllPlaylists: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/playlists`);
      return response.data;
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  },

  // Get single playlist
  getPlaylistById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/playlists/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching playlist:', error);
      throw error;
    }
  },

  // Create new playlist
  createPlaylist: async ({ name, description = '', isPublic = true }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlists`, {
        name,
        description,
        isPublic
      });
      return response.data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  // Update playlist
  updatePlaylist: async (id, updates) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/playlists/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating playlist:', error);
      throw error;
    }
  },

  // Delete playlist
  deletePlaylist: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/playlists/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  },

  // Add song to playlist
  addSongToPlaylist: async (playlistId, youtubeId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/playlists/${playlistId}/songs`, {
        youtubeId
      });
      return response.data;
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      throw error;
    }
  },

  // Remove song from playlist
  removeSongFromPlaylist: async (playlistId, youtubeId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/playlists/${playlistId}/songs/${youtubeId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing song from playlist:', error);
      throw error;
    }
  }
};
