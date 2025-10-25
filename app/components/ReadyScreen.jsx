'use client';

import { useEffect } from 'react';
import Webcam from 'react-webcam';

// 웹캠 대기 화면 컴포넌트
export default function ReadyScreen({
  webcamRef,
  videoConstraints,
  countdown,
  cameraReady,
  onCameraReady,
  onStartShooting,
  onBack
}) {
  // 🔥 카메라가 이미 준비되어 있으면 즉시 ready 상태로 설정
  useEffect(() => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      console.log('Camera already loaded - instant ready!');
      onCameraReady();
    }
  }, [webcamRef, onCameraReady]);

  return (
    <div className="ready-screen">
      <div className="camera-container">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam"
          onUserMedia={onCameraReady}
        />
        {countdown && <div className="countdown-number">{countdown}</div>}

        {!cameraReady && (
          <div className="camera-loading">
            <div className="spinner"></div>
            <p>카메라 준비 중...</p>
          </div>
        )}
      </div>

      <div className="ready-controls">
        <button
          className="shoot-btn"
          onClick={onStartShooting}
          disabled={!cameraReady}
        >
          {cameraReady ? '📸 6번 촬영 시작하기' : '⏳ 카메라 준비 중...'}
        </button>
        <button className="back-btn" onClick={onBack}>
          ← 뒤로 가기
        </button>
      </div>
    </div>
  );
}






