// iOS background audio handling
(function() {
  // Enable background audio for iOS Safari
  try {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();

      // iOS requires user interaction to start audio
      const resumeAudioContext = () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      };

      document.addEventListener('touchstart', resumeAudioContext);
      document.addEventListener('touchend', resumeAudioContext);
      document.addEventListener('click', resumeAudioContext);
    }
  } catch (e) {
    console.error('Web Audio API is not supported in this browser');
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