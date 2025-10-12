import React, { useEffect, useRef } from 'react';

const Player = ({ videoId, onReady, onStateChange }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
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
            iv_load_policy: 3
          },
          events: {
            onReady: (event) => {
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
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, onReady, onStateChange]);

  return <div ref={containerRef} style={{ display: 'none' }}></div>;
};

export default Player;