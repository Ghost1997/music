import React, { useEffect, useRef } from 'react';

const Player = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // If player already exists and video hasn't changed, don't recreate
    if (playerRef.current && isInitializedRef.current) {
      // Just load the new video without destroying the player
      try {
        playerRef.current.loadVideoById(videoId);
      } catch (error) {
        console.log('Load video error:', error.message);
      }
      return;
    }

    // Wait for YouTube API to be ready
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
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
              if (onReady) onReady(event.target);
            },
            onStateChange: (event) => {
              if (onStateChange) onStateChange(event);
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      // Don't destroy player on unmount to keep music playing
      // Only destroy if component is truly unmounting
    };
  }, [videoId, onReady, onStateChange]);

  return <div ref={containerRef} style={{ display: 'none' }}></div>;
};

export default Player;