import React, { useEffect, useRef } from 'react';
import useAudioContext from '../hooks/useAudioContext';

const Player = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const wakeLockRef = useRef(null);
  const audioContextRef = useRef(null);
  
  // Initialize audio context for iOS
  useAudioContext();

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

  // Setup media session
  const setupMediaSession = (playerInstance) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        playerInstance.playVideo();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        playerInstance.pauseVideo();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        // Handle previous track
        if (onStateChange) {
          onStateChange({ data: -2 }); // Custom event for previous
        }
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        // Handle next track
        if (onStateChange) {
          onStateChange({ data: 0 }); // Simulate end of track
        }
      });
    }
  };

  useEffect(() => {
    // Validate videoId
    if (!videoId) {
      console.warn('No video ID provided to Player component');
      return;
    }

    // If player already exists and video hasn't changed, don't recreate
    if (playerRef.current && isInitializedRef.current) {
      // Just load the new video without destroying the player
      try {
        playerRef.current.loadVideoById(videoId);
        requestWakeLock(); // Request wake lock when loading new video
      } catch (error) {
        console.error('Error loading video:', error);
        // Attempt to recover by destroying and recreating player
        try {
          releaseWakeLock(); // Release wake lock before destroying player
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

    // Wait for YouTube API to be ready
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
            loop: 1,
            playlist: videoId,
            background: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              isInitializedRef.current = true;
              setupMediaSession(event.target);
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
              // Update media session playback state
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 
                  event.data === 1 ? 'playing' : 
                  event.data === 2 ? 'paused' : 
                  event.data === 0 ? 'none' : 'none';

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
              // You could add an onError prop and call it here if needed
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
      }
    };

    // Load YouTube API if not already loaded
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

    // Cleanup function
    return () => {
      // Release wake lock
      releaseWakeLock();

      // Clear media session handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      }

      if (playerRef.current && playerRef.current.destroy) {
        try {
          // Only destroy if we're truly unmounting
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