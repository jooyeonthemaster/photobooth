import { useRef, useState, useEffect } from 'react';
import { videoConstraints } from '../constants/camera';

// 사용 가능한 웹캠을 찾아서 스트림을 반환
async function tryGetWebcamStream() {
  // 1차: 기본 설정으로 시도
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    });
  } catch {
    console.warn('📷 High-res failed, trying default constraints');
  }

  // 2차: 제약 조건 없이 시도
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  } catch {
    console.warn('📷 Default constraints failed, enumerating devices...');
  }

  // 3차: 디바이스 열거 후 각 카메라를 개별 시도
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  console.log('📷 Available cameras:', videoDevices.map(d => `${d.label} (${d.deviceId.slice(0, 8)})`));

  for (const device of videoDevices) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: device.deviceId } },
        audio: false,
      });
      console.log('📷 Connected to:', device.label);
      return stream;
    } catch {
      console.warn('📷 Failed:', device.label);
    }
  }

  throw new Error('No available webcam found');
}

export function useCamera() {
  const webcamRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraMode, setCameraMode] = useState('webcam');
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    async function initCamera() {
      // Electron EDSDK 모드 확인
      if (window.electronAPI?.camera) {
        try {
          const mode = await window.electronAPI.camera.getMode();
          if (mode === 'edsdk') {
            setCameraMode('edsdk');
            setCameraReady(true);
            console.log('📷 Camera: EDSDK mode');
            return;
          }
        } catch (err) {
          console.warn('📷 EDSDK mode check failed:', err);
        }
      }

      // 폴백: getUserMedia (일반 웹캠)
      try {
        const stream = await tryGetWebcamStream();
        streamRef.current = stream;
        setCameraMode('webcam');
        console.log('📷 Camera: Webcam mode', stream.getVideoTracks()[0].getSettings());
        setCameraReady(true);
      } catch (err) {
        console.error('📷 Camera init failed:', err.message);
      }
    }
    initCamera();

    // 카메라 모드 변경 리스너 (EDSDK 연결 해제 시)
    const handleModeChanged = (mode) => {
      console.log('📷 Camera mode changed to:', mode);
      setCameraMode(mode);
      if (mode === 'webcam') {
        navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false })
          .then(stream => {
            streamRef.current = stream;
            setCameraReady(true);
          })
          .catch(err => console.error('📷 Webcam fallback failed:', err));
      }
    };
    window.electronAPI?.camera?.onModeChanged?.(handleModeChanged);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleCameraReady = () => {
    console.log('Camera ready - will stay loaded');
    setCameraReady(true);
  };

  return {
    webcamRef,
    streamRef,
    cameraMode,
    cameraReady,
    setCameraReady,
    handleCameraReady,
  };
}
