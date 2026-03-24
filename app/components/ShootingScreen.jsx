'use client';

import CameraView from './CameraView';

// 촬영 중 화면 컴포넌트
export default function ShootingScreen({
  webcamRef,
  stream,
  cameraMode = 'webcam',
  currentShot,
  countdown,
  capturedPhotos,
  totalShots = 6
}) {
  return (
    <div className="shooting-screen">
      <div className="shooting-progress">
        <div className="progress-info">{currentShot + 1} / {totalShots}</div>
        <div className="progress-bar">
          {Array.from({ length: totalShots }, (_, i) => i).map(i => (
            <div
              key={i}
              className={`progress-dot ${
                i < currentShot ? 'done' : i === currentShot ? 'active' : ''
              }`}
            ></div>
          ))}
        </div>
      </div>

      <div className="camera-container">
        <CameraView
          ref={webcamRef}
          stream={stream}
          mode={cameraMode}
          className="webcam"
        />
        {countdown && <div className="countdown-number">{countdown}</div>}
      </div>

      <div className="captured-preview">
        {capturedPhotos.map((photo, idx) => (
          <img
            key={idx}
            src={photo}
            alt={`shot ${idx + 1}`}
            className="mini-preview"
          />
        ))}
      </div>
    </div>
  );
}








