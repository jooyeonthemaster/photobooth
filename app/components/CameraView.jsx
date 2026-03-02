'use client';
import { useEffect, useState, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const CameraView = forwardRef(({ videoConstraints, className = 'webcam', onReady }, ref) => {
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.app?.isElectron;
  const webcamRef = useRef(null);
  const [frameKey, setFrameKey] = useState(0);
  const [liveViewReady, setLiveViewReady] = useState(false);

  // Expose methods compatible with webcamRef interface
  useImperativeHandle(ref, () => ({
    // For webcam fallback
    getScreenshot: () => webcamRef.current?.getScreenshot?.() || null,
    // For checking video readyState (webcam compatibility)
    get video() {
      return webcamRef.current?.video || null;
    },
  }));

  // Electron: poll live view at ~15fps
  useEffect(() => {
    if (!isElectron) return;
    const interval = setInterval(() => setFrameKey(k => k + 1), 66);
    return () => clearInterval(interval);
  }, [isElectron]);

  const handleLiveViewLoad = useCallback(() => {
    if (!liveViewReady) {
      setLiveViewReady(true);
      onReady?.();
    }
  }, [liveViewReady, onReady]);

  if (isElectron) {
    return (
      <img
        src={`http://localhost:5513/liveview.jpg?t=${frameKey}`}
        className={`${className} dslr-mode`}
        onLoad={handleLiveViewLoad}
        onError={() => {}} // silently retry next interval
        alt="Camera"
        draggable={false}
      />
    );
  }

  // Browser fallback
  return (
    <Webcam
      audio={false}
      ref={webcamRef}
      screenshotFormat="image/jpeg"
      videoConstraints={videoConstraints}
      className={className}
      onUserMedia={onReady}
    />
  );
});

CameraView.displayName = 'CameraView';
export default CameraView;
