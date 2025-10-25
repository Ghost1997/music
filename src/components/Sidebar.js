import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Plus, Heart } from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar = ({ playlists = [] }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/icons/icon-72x72.png" style={{ width: '40px', height: '40px' }} alt="Songify" className="sidebar-logo-icon" />
        <span>Songify</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className="nav-item">
          <Home size={24} />
          <span>Home</span>
        </NavLink>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-playlists">
        <NavLink to="/dashboard/playlists" className="nav-item">
          <Plus size={24} />
          <span>Create Playlist</span>
        </NavLink>
        <NavLink to="/dashboard/liked" className="nav-item">
          <Heart size={24} />
          <span>Liked Songs</span>
        </NavLink>
      </div>

      <div className="sidebar-divider"></div>

      <div className="playlist-list">
        {playlists.map((playlist) => (
          <NavLink
            key={playlist._id}
            to={`/dashboard/playlist/${playlist._id}`}
            className="playlist-item"
          >
            {playlist.name}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
