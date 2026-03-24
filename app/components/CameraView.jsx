'use client';
import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useState } from 'react';

const CameraView = forwardRef(({ stream, mode = 'webcam', className = 'webcam', onReady }, ref) => {
  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  // Expose getScreenshot() and video for both modes
  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      if (mode === 'edsdk') {
        const img = imgRef.current;
        if (!img || !img.naturalWidth) return null;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.95);
      }
      // Webcam mode
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.95);
    },
    get video() {
      return videoRef.current || imgRef.current || null;
    },
  }));

  // EDSDK EVF frame subscription
  useEffect(() => {
    if (mode !== 'edsdk') return;
    if (!window.electronAPI?.camera) return;

    let frameCount = 0;
    window.electronAPI.camera.onEvfFrame((base64Jpeg) => {
      const img = imgRef.current;
      if (img) {
        img.src = `data:image/jpeg;base64,${base64Jpeg}`;
        if (frameCount === 0) {
          setReady(true);
          setError(null);
          onReady?.();
        }
        frameCount++;
      }
    });

    return () => {
      window.electronAPI.camera.offEvfFrame();
    };
  }, [mode, onReady]);

  // Webcam mode: attach stream to video
  useEffect(() => {
    if (mode !== 'webcam') return;
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
  }, [mode, stream]);

  const handlePlaying = useCallback(() => {
    if (!ready) {
      setReady(true);
      setError(null);
      onReady?.();
    }
  }, [ready, onReady]);

  // Show error if no stream/EDSDK after mount
  useEffect(() => {
    if (mode === 'edsdk') {
      // EDSDK mode: error shown if no frame received
      if (!window.electronAPI?.camera) {
        setError('EDSDK 카메라를 사용할 수 없습니다.');
      }
      return;
    }
    // Webcam mode
    if (stream) {
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      if (!stream) {
        setError('카메라를 찾을 수 없습니다. 카메라 연결 및 권한을 확인하세요.');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [mode, stream]);

  if (error) {
    return (
      <div className={className} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '12px', background: '#1a1a1a',
        color: '#ff6b6b', padding: '24px', textAlign: 'center', fontSize: '14px',
      }}>
        <div style={{ fontSize: '48px' }}>⚠</div>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>카메라 연결 안됨</div>
        <div style={{ color: '#aaa', maxWidth: '400px' }}>{error}</div>
      </div>
    );
  }

  if (mode === 'edsdk') {
    return (
      <img
        ref={imgRef}
        className={className}
        style={{ transform: 'scaleX(-1)' }}
        alt="Camera preview"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className={className}
      style={{ transform: 'scaleX(-1)' }}
      onPlaying={handlePlaying}
    />
  );
});

CameraView.displayName = 'CameraView';
export default CameraView;
