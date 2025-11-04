import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import LikedSongs from './pages/LikedSongs';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import ArtistDetail from './pages/ArtistDetail';
import ChannelDetail from './pages/ChannelDetail';
import PrivateRoute from './components/PrivateRoute';
import InstallPrompt from './components/InstallPrompt';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Tunezz...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <InstallPrompt />
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="search" element={<Home />} />
            <Route path="library" element={<Home />} />
            <Route path="liked" element={<LikedSongs />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="playlist/:id" element={<PlaylistDetail />} />
            <Route path="artist/:artist" element={<ArtistDetail />} />
            <Route path="channel/:channel" element={<ChannelDetail />} />
          </Route>

          {/* Default Route */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
