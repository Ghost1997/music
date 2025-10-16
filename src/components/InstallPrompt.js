// Create a new file: components/InstallPrompt.js

import React, { useState, useEffect } from 'react';
import '../styles/InstallPrompt.css';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  // Don't show anything if already installed
  if (isInstalled) {
    return null;
  }

  // For iOS, show manual instructions
  if (isIOS) {
    return (
      <div className="install-prompt ios-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-header">
            <h3>Add to Home Screen</h3>
            <button className="dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">×</button>
          </div>
          <p className="install-prompt-text">
            Tap the share button below, then select "Add to Home Screen"
          </p>
          <div className="ios-instructions">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <span>Tap the Share button</span>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <span>Select "Add to Home Screen"</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For Android, show the install prompt
  if (showPrompt && deferredPrompt) {
    return (
      <div className="install-prompt android-prompt">
        <div className="install-prompt-content">
          <div className="install-prompt-header">
            <h3>Install App</h3>
            <button className="dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">×</button>
          </div>
          <p className="install-prompt-text">
            Install the Music Player app on your device for quick access
          </p>
          <button className="install-btn" onClick={handleInstallClick}>
            Install
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default InstallPrompt;