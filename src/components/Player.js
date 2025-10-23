import React, { useEffect, useRef } from 'react';
import useAudioContext from '../hooks/useAudioContext';

const Player = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const wakeLockRef = useRef(null);
  const hasInteractedRef = useRef(false);
  const audioElementRef = useRef(null);
  const isIOSRef = useRef(/iPad|iPhone|iPod/.test(navigator.userAgent));
  
  // Initialize audio context for iOS
  useAudioContext();

  // Create audio element for iOS background playback
  useEffect(() => {
    if (isIOSRef.current && !audioElementRef.current) {
      audioElementRef.current = document.getElementById('ios-audio-session');
      if (audioElementRef.current) {
        audioElementRef.current.loop = false;
        audioElementRef.current.volume = 0.01; // Very low volume, YouTube player handles actual audio
        audioElementRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      }
    }
  }, []);

  // Request wake lock to keep screen active during playback
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.error('Wake Lock error:', err);
    }
  };

  // Release wake lock when not playing
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Setup media session for background playback
  const setupMediaSession = (playerInstance) => {
    if ('mediaSession' in navigator) {
      // Set metadata for lock screen controls
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Loading...',
        artist: 'Music Player',
        artwork: [
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      // Play handler
      navigator.mediaSession.setActionHandler('play', () => {
        try {
          if (playerInstance && playerInstance.playVideo) {
            playerInstance.playVideo();
            requestWakeLock();
          }
        } catch (err) {
          console.error('Error in play handler:', err);
        }
      });
      
      // Pause handler
      navigator.mediaSession.setActionHandler('pause', () => {
        try {
          if (playerInstance && playerInstance.pauseVideo) {
            playerInstance.pauseVideo();
            releaseWakeLock();
          }
        } catch (err) {
          console.error('Error in pause handler:', err);
        }
      });
      
      // Previous track handler
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        try {
          if (onStateChange) {
            onStateChange({ data: -2 });
          }
        } catch (err) {
          console.error('Error in previous handler:', err);
        }
      });
      
      // Next track handler
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        try {
          if (onStateChange) {
            onStateChange({ data: 0 });
          }
        } catch (err) {
          console.error('Error in next handler:', err);
        }
      });

      // Seek backward handler
      try {
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          if (playerInstance && playerInstance.getCurrentTime && playerInstance.seekTo) {
            const skipTime = details.seekOffset || 10;
            const currentTime = playerInstance.getCurrentTime();
            playerInstance.seekTo(Math.max(0, currentTime - skipTime), true);
          }
        });
      } catch (err) {
        console.log('Seek backward not supported');
      }

      // Seek forward handler
      try {
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          if (playerInstance && playerInstance.getCurrentTime && playerInstance.getDuration && playerInstance.seekTo) {
            const skipTime = details.seekOffset || 10;
            const currentTime = playerInstance.getCurrentTime();
            const duration = playerInstance.getDuration();
            playerInstance.seekTo(Math.min(duration, currentTime + skipTime), true);
          }
        });
      } catch (err) {
        console.log('Seek forward not supported');
      }

      // Stop handler for iOS
      try {
        navigator.mediaSession.setActionHandler('stop', () => {
          if (playerInstance && playerInstance.pauseVideo) {
            playerInstance.pauseVideo();
            releaseWakeLock();
          }
        });
      } catch (err) {
        console.log('Stop action not supported');
      }
    }
  };

  // iOS-specific audio unlock
  const unlockAudioForIOS = () => {
    if (hasInteractedRef.current) return;
    
    const unlockAudio = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      audioContext.resume().then(() => {
        hasInteractedRef.current = true;
        console.log('iOS audio unlocked');
      });
      
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
    
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
  };

  useEffect(() => {
    // Unlock audio on iOS
    unlockAudioForIOS();
  }, []);

  useEffect(() => {
    if (!videoId) {
      console.warn('No video ID provided to Player component');
      return;
    }

    if (playerRef.current && isInitializedRef.current) {
      try {
        playerRef.current.loadVideoById(videoId);
        requestWakeLock();
      } catch (error) {
        console.error('Error loading video:', error);
        try {
          releaseWakeLock();
          if (playerRef.current && playerRef.current.destroy) {
            playerRef.current.destroy();
            playerRef.current = null;
            isInitializedRef.current = false;
          }
        } catch (destroyError) {
          console.error('Error destroying player:', destroyError);
        }
      }
      return;
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        console.error('YouTube API not loaded');
        return;
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '0',
          width: '0',
          videoId: videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            autoplay: 0,  // Changed to 0 for iOS compatibility
            origin: window.location.origin,
            widget_referrer: window.location.origin
          },
          events: {
            onReady: (event) => {
              isInitializedRef.current = true;
              setupMediaSession(event.target);
              
              // Set volume to ensure audio is enabled
              try {
                event.target.setVolume(100);
                event.target.unMute();
              } catch (err) {
                console.error('Error setting volume:', err);
              }
              
              requestWakeLock();
              
              if (onReady) {
                try {
                  onReady(event.target);
                } catch (error) {
                  console.error('Error in onReady callback:', error);
                }
              }
            },
            onStateChange: (event) => {
              // Sync audio element for iOS background playback
              if (isIOSRef.current && audioElementRef.current) {
                try {
                  if (event.data === 1) { // Playing
                    audioElementRef.current.play().catch(() => {});
                  } else if (event.data === 2 || event.data === 0) { // Paused or Ended
                    audioElementRef.current.pause();
                  }
                } catch (err) {
                  console.error('Audio element sync error:', err);
                }
              }

              // Update media session playback state
              if ('mediaSession' in navigator) {
                const playbackState = 
                  event.data === 1 ? 'playing' : 
                  event.data === 2 ? 'paused' : 'none';
                
                navigator.mediaSession.playbackState = playbackState;

                // Update position state for iOS lock screen
                if (event.data === 1 && event.target) {
                  try {
                    const duration = event.target.getDuration();
                    const position = event.target.getCurrentTime();
                    
                    if (duration > 0 && position >= 0 && position <= duration) {
                      navigator.mediaSession.setPositionState({
                        duration: Math.max(duration, 1),
                        playbackRate: 1,
                        position: Math.max(0, Math.min(position, duration))
                      });
                    }
                  } catch (err) {
                    // Silently fail - position state not critical
                    console.log('Position state not supported');
                  }
                }

                // Handle wake lock based on playback state
                if (event.data === 1) {
                  requestWakeLock();
                } else if (event.data === 2 || event.data === 0) {
                  releaseWakeLock();
                }
              }

              if (onStateChange) {
                try {
                  onStateChange(event);
                } catch (error) {
                  console.error('Error in onStateChange callback:', error);
                }
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              releaseWakeLock();
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      releaseWakeLock();

      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
        } catch (err) {
          console.error('Error clearing media session:', err);
        }
      }

      if (playerRef.current && playerRef.current.destroy) {
        try {
          const isUnmounting = !containerRef.current;
          if (isUnmounting) {
            playerRef.current.destroy();
            playerRef.current = null;
            isInitializedRef.current = false;
          }
        } catch (error) {
          console.error('Error during player cleanup:', error);
        }
      }
    };
  }, [videoId, onReady, onStateChange]);

  return <div ref={containerRef} style={{ display: 'none' }}></div>;
};

export default Player;