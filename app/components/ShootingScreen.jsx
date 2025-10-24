'use client';

import Webcam from 'react-webcam';

// 촬영 중 화면 컴포넌트
export default function ShootingScreen({
  webcamRef,
  videoConstraints,
  currentShot,
  countdown,
  capturedPhotos
}) {
  return (
    <div className="shooting-screen">
      <div className="shooting-progress">
        <div className="progress-info">{currentShot + 1} / 6</div>
        <div className="progress-bar">
          {[0, 1, 2, 3, 4, 5].map(i => (
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
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
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






