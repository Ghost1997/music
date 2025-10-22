import { useEffect, useRef } from 'react';

const useAudioContext = () => {
  const audioContextRef = useRef(null);

  useEffect(() => {
    // Create AudioContext for iOS
    const initAudioContext = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        
        // Resume AudioContext if it's suspended (iOS requirement)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('AudioContext initialization error:', error);
      }
    };

    // Initialize on user interaction (iOS requirement)
    const handleUserInteraction = () => {
      initAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };

    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return audioContextRef.current;
};

export default useAudioContext;