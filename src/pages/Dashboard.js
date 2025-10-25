import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import GlobalPlayer from '../components/GlobalPlayer';
import { playlistAPI } from '../services/playlistAPI';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [playlists, setPlaylists] = useState([]);
  const [topBarContent, setTopBarContent] = useState(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const response = await playlistAPI.getAllPlaylists();
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar playlists={playlists} />
      <div className="dashboard-main">
        <TopBar extraContent={topBarContent} />
        <div className="dashboard-content">
          <Outlet context={{ playlists, loadPlaylists, setTopBarContent }} />
        </div>
      </div>
      <GlobalPlayer />
    </div>
  );
};

export default Dashboard;
