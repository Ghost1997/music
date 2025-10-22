// iOS background audio handling
(function() {
  // Enable background audio for iOS Safari
  try {
    if ((typeof window !== 'undefined') && (typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined')) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      // Use a single shared AudioContext if not already present
      if (!window.__sharedAudioContext) {
        try {
          window.__sharedAudioContext = new AudioContext();
        } catch (err) {
          console.warn('Could not create shared AudioContext:', err);
        }
      }

      const audioContext = window.__sharedAudioContext;
      if (audioContext) {
        // iOS requires user interaction to start audio
        const resumeAudioContext = () => {
          try {
            if (audioContext.state === 'suspended') {
              audioContext.resume();
            }
          } catch (err) {
            // ignore
          }
        };

        document.addEventListener('touchstart', resumeAudioContext, { passive: true });
        document.addEventListener('touchend', resumeAudioContext, { passive: true });
        document.addEventListener('click', resumeAudioContext, { passive: true });
      }
    }
  } catch (e) {
    // Non-fatal, continue without iOS audio helpers
    console.warn('Web Audio API helper not available:', e.message || e);
  }

  // Handle iOS audio session
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Request background audio permission
      if (navigator.mediaSession) {
        navigator.mediaSession.setActionHandler('play', () => {});
        navigator.mediaSession.setActionHandler('pause', () => {});
      }
    }
  });

  // Prevent iOS audio interruption
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) {
      // Page is being cached for back-forward navigation
      // Keep the audio session active
      if (navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'playing';
      }
    }
  });

  // Handle audio session routing changes (e.g., headphones plugged/unplugged)
  if (navigator.mediaDevices && navigator.mediaDevices.ondevicechange) {
    navigator.mediaDevices.ondevicechange = () => {
      // Reconnect to audio output if needed
      if (window.YT && window.YT.Player) {
        // Force the player to reconnect to audio output
        const event = new Event('audioOutputChanged');
        window.dispatchEvent(event);
      }
    };
  }
})();