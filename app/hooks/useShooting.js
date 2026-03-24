import { useRef, useState } from 'react';
import { captureAndCropImage, cropImageToPortrait } from '../utils/imageProcessing';

export function useShooting({ cameraReady, cameraMode, webcamRef, setStep, totalShots = 6 }) {
  const photosRef = useRef([]);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown] = useState(null);

  const captureImage = async (shotNumber, retryCount = 0) => {
    try {
      let croppedImage;

      if (cameraMode === 'edsdk') {
        const result = await window.electronAPI.camera.capture();
        if (!result.success) throw new Error(result.error);
        croppedImage = await cropImageToPortrait(result.image);
      } else {
        croppedImage = await captureAndCropImage(webcamRef);
      }

      photosRef.current.push(croppedImage);
      setCapturedPhotos([...photosRef.current]);

      setTimeout(() => {
        takeNextShot(shotNumber + 1);
      }, 2000);
    } catch (error) {
      console.error('캡처 실패:', error);
      if (retryCount < 1) {
        console.log('🔄 캡처 재시도...');
        setTimeout(() => captureImage(shotNumber, retryCount + 1), 1000);
      } else {
        alert('사진 촬영에 실패했습니다. 카메라 연결을 확인해주세요.');
      }
    }
  };

  const takeNextShot = (shotNumber) => {
    if (shotNumber >= totalShots) {
      setStep('select');
      return;
    }

    console.log('Taking shot', shotNumber + 1);
    setCurrentShot(shotNumber);
    setCountdown(3);

    setTimeout(() => {
      setCountdown(2);
      setTimeout(() => {
        setCountdown(1);
        setTimeout(() => {
          setCountdown(null);
          captureImage(shotNumber);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const startContinuousShooting = () => {
    if (!cameraReady) {
      alert('카메라가 준비되지 않았습니다. 잠시만 기다려주세요.');
      return;
    }
    photosRef.current = [];
    setCapturedPhotos([]);
    setCurrentShot(0);
    setStep('shooting');
    takeNextShot(0);
  };

  const resetPhotos = () => {
    photosRef.current = [];
    setCapturedPhotos([]);
    setCurrentShot(0);
    setCountdown(null);
  };

  return {
    photosRef,
    capturedPhotos,
    setCapturedPhotos,
    currentShot,
    countdown,
    startContinuousShooting,
    resetPhotos,
  };
}
