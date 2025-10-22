import { useEffect, useRef } from 'react';

const useAudioContext = () => {
  const audioContextRef = useRef(null);
  const isUnlockedRef = useRef(false);

  useEffect(() => {
    const initAudioContext = () => {
      // Skip if already unlocked
      if (isUnlockedRef.current) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        
        // Create AudioContext if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        // CRITICAL: Play a silent sound to unlock iOS audio
        // This is required for iOS to allow any audio playback
        const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        // Start the silent sound
        if (source.start) {
          source.start(0);
        } else if (source.noteOn) {
          source.noteOn(0); // Fallback for older browsers
        }

        // Resume AudioContext if suspended (iOS requirement)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('AudioContext resumed successfully');
            isUnlockedRef.current = true;
          }).catch((error) => {
            console.error('Failed to resume AudioContext:', error);
          });
        } else {
          console.log('AudioContext ready');
          isUnlockedRef.current = true;
        }

        // Clean up event listeners after first successful interaction
        document.removeEventListener('touchstart', initAudioContext);
        document.removeEventListener('touchend', initAudioContext);
        document.removeEventListener('click', initAudioContext);
      } catch (error) {
        console.error('AudioContext initialization error:', error);
      }
    };

    // Add multiple event listeners to catch user interaction
    // Using { passive: true } for better scrolling performance
    document.addEventListener('touchstart', initAudioContext, { passive: true });
    document.addEventListener('touchend', initAudioContext, { passive: true });
    document.addEventListener('click', initAudioContext);

    // Cleanup function
    return () => {
      document.removeEventListener('touchstart', initAudioContext);
      document.removeEventListener('touchend', initAudioContext);
      document.removeEventListener('click', initAudioContext);
      
      // Close AudioContext when component unmounts
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch((error) => {
          console.error('Error closing AudioContext:', error);
        });
      }
    };
  }, []);

  return audioContextRef.current;
};

export default useAudioContext;