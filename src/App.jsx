import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const webcamRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);

  // 사진 목록 로드
  const loadPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('갤러리 로드 실패:', error);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  // 카운트다운 후 촬영
  const capturePhoto = () => {
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(timer);
        setCountdown(null);
        takePhoto();
      }
    }, 1000);
  };

  // 사진 촬영
  const takePhoto = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      alert('카메라에서 이미지를 가져올 수 없습니다.');
      return;
    }

    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      });

      const data = await response.json();
      if (data.success) {
        alert('사진 촬영 완료!');
        loadPhotos();
      } else {
        alert('촬영 실패: ' + data.message);
      }
    } catch (error) {
      alert('촬영 실패: ' + error.message);
    }
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: 'user'
  };

  return (
    <div className="container">
      <h1>📸 포토부스</h1>

      <div className="camera-preview">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="webcam"
        />
        {countdown && <div className="countdown">{countdown}</div>}
      </div>

      <button onClick={capturePhoto} className="capture-btn">
        사진 촬영
      </button>

      <div className="gallery">
        {photos.map((photo, idx) => (
          <img key={idx} src={`/photos/${photo}`} alt={`photo-${idx}`} />
        ))}
      </div>
    </div>
  );
}

export default App;
