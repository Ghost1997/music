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
    if (!('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: 'Loading...',
      artist: 'Music Player',
      artwork: [
        { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
      ]
    });

    const safeHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Some platforms do not support all handlers
      }
    };

    safeHandler('play', () => {
      try {
        playerInstance?.playVideo?.();
        requestWakeLock();
      } catch (err) {
        console.error('Error in play handler:', err);
      }
    });

    safeHandler('pause', () => {
      try {
        playerInstance?.pauseVideo?.();
        releaseWakeLock();
      } catch (err) {
        console.error('Error in pause handler:', err);
      }
    });

    safeHandler('previoustrack', () => {
      try {
        onStateChange?.({ data: -2 });
      } catch (err) {
        console.error('Error in previous handler:', err);
      }
    });

    safeHandler('nexttrack', () => {
      try {
        onStateChange?.({ data: 0 });
      } catch (err) {
        console.error('Error in next handler:', err);
      }
    });

    safeHandler('seekbackward', (details) => {
      try {
        const skipTime = details.seekOffset || 10;
        const currentTime = playerInstance?.getCurrentTime?.() || 0;
        playerInstance?.seekTo?.(Math.max(0, currentTime - skipTime), true);
      } catch (err) {
        console.log('Seek backward not supported');
      }
    });

    safeHandler('seekforward', (details) => {
      try {
        const skipTime = details.seekOffset || 10;
        const currentTime = playerInstance?.getCurrentTime?.() || 0;
        const duration = playerInstance?.getDuration?.() || 0;
        playerInstance?.seekTo?.(Math.min(duration, currentTime + skipTime), true);
      } catch (err) {
        console.log('Seek forward not supported');
      }
    });

    safeHandler('stop', () => {
      try {
        playerInstance?.pauseVideo?.();
        releaseWakeLock();
      } catch (err) {
        console.log('Stop action not supported');
      }
    });
  };

  // iOS-specific audio unlock
  useEffect(() => {
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
      });

      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };

    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('touchend', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Host container lives outside React tree to avoid reconciliation issues
  useEffect(() => {
    const container = document.createElement('div');
    container.style.cssText = 'display:none;position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
    container.dataset.ytPlayerHost = 'true';
    document.body.appendChild(container);
    containerRef.current = container;

    return () => {
      if (containerRef.current?.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!videoId) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      console.error('YouTube player container missing');
      return;
    }

    // Reuse existing player if possible
    if (playerRef.current && isInitializedRef.current) {
      try {
        playerRef.current.loadVideoById({ videoId, startSeconds: 0 });
        requestWakeLock();
        return;
      } catch (error) {
        console.error('Error loading video, recreating player:', error);
      }
    }

    let cancelled = false;

    const initPlayer = () => {
      if (cancelled) return;

      try {
        container.innerHTML = '';

        playerRef.current = new window.YT.Player(container, {
          height: '0',
          width: '0',
          videoId,
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
            autoplay: 0,
            origin: window.location.origin,
            widget_referrer: window.location.origin
          },
          events: {
            onReady: (event) => {
              isInitializedRef.current = true;
              setupMediaSession(event.target);

              try {
                event.target.setVolume(100);
                event.target.unMute();
              } catch (err) {
                console.error('Error setting volume:', err);
              }

              requestWakeLock();

              try {
                onReady?.(event.target);
              } catch (err) {
                console.error('Error in onReady callback:', err);
              }
            },
            onStateChange: (event) => {
              if (isIOSRef.current && audioElementRef.current) {
                try {
                  if (event.data === 1) {
                    audioElementRef.current.play().catch(() => {});
                  } else if (event.data === 2 || event.data === 0) {
                    audioElementRef.current.pause();
                  }
                } catch (err) {
                  console.error('Audio element sync error:', err);
                }
              }

              if ('mediaSession' in navigator) {
                const playbackState =
                  event.data === 1 ? 'playing' :
                  event.data === 2 ? 'paused' : 'none';

                navigator.mediaSession.playbackState = playbackState;

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
                    console.log('Position state not supported');
                  }
                }

                if (event.data === 1) {
                  requestWakeLock();
                } else if (event.data === 2 || event.data === 0) {
                  releaseWakeLock();
                }
              }

              try {
                onStateChange?.(event);
              } catch (err) {
                console.error('Error in onStateChange callback:', err);
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

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        initPlayer();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    return () => {
      cancelled = true;
      releaseWakeLock();

      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
          navigator.mediaSession.setActionHandler('previoustrack', null);
          navigator.mediaSession.setActionHandler('nexttrack', null);
          navigator.mediaSession.setActionHandler('seekbackward', null);
          navigator.mediaSession.setActionHandler('seekforward', null);
          navigator.mediaSession.setActionHandler('stop', null);
        } catch (err) {
          console.error('Error clearing media session:', err);
        }
      }

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Error destroying YouTube player:', err);
        }
      }

      playerRef.current = null;
      isInitializedRef.current = false;
    };
  }, [videoId, onReady, onStateChange]);

  return null;
};

export default Player;