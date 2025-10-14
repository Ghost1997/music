import React, { useEffect, useRef } from 'react';

const Player = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);

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
      } catch (error) {
        console.error('Error loading video:', error);
        // Attempt to recover by destroying and recreating player
        try {
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
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              isInitializedRef.current = true;
              if (onReady) {
                try {
                  onReady(event.target);
                } catch (error) {
                  console.error('Error in onReady callback:', error);
                }
              }
            },
            onStateChange: (event) => {
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