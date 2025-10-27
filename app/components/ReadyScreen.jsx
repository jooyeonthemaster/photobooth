'use client';

import { useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { getFilterIntroMessages } from '../constants/filterMessages';

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
  const [showModal, setShowModal] = useState(true);
  const [filterMessages, setFilterMessages] = useState(null);

  // localStorage에서 필터 설정 불러오기
  useEffect(() => {
    const savedConfig = localStorage.getItem('photoboothFilters');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      const messages = getFilterIntroMessages(config.slotAssignment);
      setFilterMessages(messages);
    }
  }, []);

  // 🔥 카메라가 이미 준비되어 있으면 즉시 ready 상태로 설정
  useEffect(() => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      console.log('Camera already loaded - instant ready!');
      onCameraReady();
    }
  }, [webcamRef, onCameraReady]);

  const handleStartClick = () => {
    setShowModal(false);
  };

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

      {/* 필터 안내 모달 */}
      {showModal && filterMessages && (
        <div className="filter-intro-modal">
          <div className="modal-content">
            <h2>🎨 오늘의 필터</h2>
            <div className="filter-messages">
              {filterMessages.map((filter, index) => (
                <div key={index} className="filter-message-card">
                  <h3>{filter.title}</h3>
                  <p>{filter.message}</p>
                  <div className="filter-count">
                    {filter.count}장의 사진에 적용됩니다
                  </div>
                </div>
              ))}
            </div>
            <button className="start-shooting-btn" onClick={handleStartClick}>
              시작하기 🚀
            </button>
          </div>
        </div>
      )}

      <div className="ready-controls">
        <button
          className="shoot-btn"
          onClick={onStartShooting}
          disabled={!cameraReady || showModal}
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







