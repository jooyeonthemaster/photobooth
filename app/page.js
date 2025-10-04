'use client';

import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './page.css';

export default function Home() {
  const webcamRef = useRef(null);
  const photosRef = useRef([]);
  const [step, setStep] = useState('intro'); // intro, frame, shooting, result
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('kpop-idol');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredImage, setFilteredImage] = useState(null);

  const frames = [
    { id: 'classic', name: '클래식', color: '#ffffff' },
    { id: 'pink', name: '핑크', color: '#FFB3D9' },
    { id: 'blue', name: '블루', color: '#B3D9FF' },
    { id: 'black', name: '블랙', color: '#2a2a2a' },
  ];

  const filters = [
    { id: 'none', name: '필터 없음', emoji: '📷', category: 'basic' },
    { id: 'kpop-idol', name: 'K-POP 아이돌', emoji: '✨', category: 'beauty' },
    { id: 'anime-character', name: '애니메이션', emoji: '🎌', category: 'fun' },
    { id: 'pixar-character', name: '픽사 3D', emoji: '🎬', category: 'fun' },
    { id: 'zombie-apocalypse', name: '좀비', emoji: '🧟', category: 'horror' },
    { id: 'cyberpunk-neon', name: '사이버펑크', emoji: '🌃', category: 'cool' },
    { id: 'vampire-gothic', name: '뱀파이어', emoji: '🧛', category: 'horror' },
    { id: 'superhero', name: '슈퍼히어로', emoji: '🦸', category: 'cool' },
    { id: 'alien-invasion', name: '외계인', emoji: '👽', category: 'fun' },
    { id: 'renaissance-painting', name: '르네상스 명화', emoji: '🖼️', category: 'art' },
    { id: 'pop-art', name: '팝아트', emoji: '🎨', category: 'art' },
    { id: 'oil-painting', name: '유화', emoji: '🖌️', category: 'art' },
    { id: 'glamour-magazine', name: '보그 커버', emoji: '💄', category: 'beauty' },
    { id: 'instagram-filter', name: '인스타 필터', emoji: '📸', category: 'beauty' },
    { id: 'drag-queen', name: '드랙퀸', emoji: '👑', category: 'beauty' },
    { id: 'old-grandparent', name: '80년 후', emoji: '👴', category: 'fun' },
    { id: 'baby-filter', name: '아기 버전', emoji: '👶', category: 'fun' },
    { id: 'disney-villain', name: '디즈니 악당', emoji: '😈', category: 'fun' },
    { id: 'clown-circus', name: '광대', emoji: '🤡', category: 'horror' },
    { id: 'mermaid-fantasy', name: '인어공주', emoji: '🧜‍♀️', category: 'fantasy' },
    { id: 'crystal-gem', name: '크리스탈', emoji: '💎', category: 'fantasy' },
  ];

  const videoConstraints = {
    width: 1920,
    height: 1080,
    facingMode: 'user'
  };

  // 촬영 시작
  const startShooting = () => {
    photosRef.current = [];
    setCapturedPhotos([]);
    setCurrentShot(0);
    setCameraReady(false);
    setStep('shooting');
  };

  // 카메라 로드 완료
  const handleCameraReady = () => {
    console.log('Camera ready');
    setCameraReady(true);
  };

  // 카메라가 준비되면 촬영 시작
  useEffect(() => {
    if (step === 'shooting' && cameraReady) {
      console.log('Starting countdown');
      setTimeout(() => takeShot(0), 1000);
    }
  }, [step, cameraReady]);

  // 한 컷 촬영
  const takeShot = (shotNumber) => {
    console.log('Taking shot', shotNumber);
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

  // 이미지 캡처 (1컷만)
  const captureImage = (shotNumber) => {
    console.log('Capturing image', shotNumber);

    if (!webcamRef.current) {
      console.error('Webcam not ready');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('Failed to get screenshot');
      return;
    }

    photosRef.current = [imageSrc];
    setCapturedPhotos([imageSrc]);
    setStep('preview');

    console.log('Photo captured!');
  };

  // AI 필터 적용
  const applyFilter = async () => {
    if (capturedPhotos.length === 0) return;

    setIsApplyingFilter(true);
    setFilteredImage(null);

    try {
      const response = await fetch('/api/apply-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: capturedPhotos[0],
          filterType: selectedFilter
        })
      });

      const data = await response.json();

      if (data.success) {
        setFilteredImage(data.image);
      } else {
        alert('필터 적용 실패: ' + data.message);
      }
    } catch (error) {
      console.error('Filter error:', error);
      alert('필터 적용 중 오류 발생');
    } finally {
      setIsApplyingFilter(false);
    }
  };

  // 4컷 합성
  const createFinalImage = async (photos) => {
    try {
      const response = await fetch('/api/combine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos,
          frame: selectedFrame,
          filterType: selectedFilter
        })
      });

      const data = await response.json();
      if (data.success) {
        setFinalImage(data.path);
        setStep('result');
      }
    } catch (error) {
      console.error('합성 실패:', error);
    }
  };

  // 다운로드
  const downloadImage = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.href = finalImage;
    link.download = `lifefourcut_${Date.now()}.jpg`;
    link.click();
  };

  // 처음으로
  const restart = () => {
    setStep('intro');
    setCapturedPhotos([]);
    setCurrentShot(0);
    setFinalImage(null);
    setFilteredImage(null);
    photosRef.current = [];
  };

  // 다시 찍기
  const retake = () => {
    setCapturedPhotos([]);
    setFilteredImage(null);
    photosRef.current = [];
    setCameraReady(false);
    setStep('shooting');
  };

  // 다운로드
  const downloadFilteredImage = () => {
    if (!filteredImage) return;
    const link = document.createElement('a');
    link.href = filteredImage;
    link.download = `filtered_${selectedFilter}_${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="photobooth">
      {/* 인트로 화면 */}
      {step === 'intro' && (
        <div className="intro-screen">
          <h1 className="logo">인생네컷</h1>
          <p className="subtitle">Life Four Cuts</p>
          <button className="start-btn" onClick={() => setStep('filter')}>
            시작하기
          </button>
        </div>
      )}

      {/* 필터 선택 */}
      {step === 'filter' && (
        <div className="filter-selection">
          <h2>AI 필터를 선택하세요</h2>
          <p className="filter-subtitle">완전 미친 창의적인 필터들! 🔥</p>

          <div className="filter-grid">
            {filters.map(filter => (
              <div
                key={filter.id}
                className={`filter-option ${selectedFilter === filter.id ? 'selected' : ''}`}
                onClick={() => setSelectedFilter(filter.id)}
              >
                <div className="filter-emoji">{filter.emoji}</div>
                <div className="filter-name">{filter.name}</div>
              </div>
            ))}
          </div>

          <button className="next-btn" onClick={() => setStep('frame')}>
            다음: 프레임 선택
          </button>
        </div>
      )}

      {/* 프레임 선택 */}
      {step === 'frame' && (
        <div className="frame-selection">
          <h2>프레임을 선택하세요</h2>
          <div className="frame-grid">
            {frames.map(frame => (
              <div
                key={frame.id}
                className={`frame-option ${selectedFrame === frame.id ? 'selected' : ''}`}
                onClick={() => setSelectedFrame(frame.id)}
                style={{ borderColor: frame.color }}
              >
                <div className="frame-preview" style={{ backgroundColor: frame.color }}>
                  <div className="frame-cuts">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="frame-cut"></div>
                    ))}
                  </div>
                </div>
                <span>{frame.name}</span>
              </div>
            ))}
          </div>

          <button className="next-btn" onClick={startShooting}>
            촬영 시작
          </button>
        </div>
      )}

      {/* 촬영 화면 */}
      {step === 'shooting' && (
        <div className="shooting-screen">
          <div className="camera-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="webcam"
              onUserMedia={handleCameraReady}
            />
            {countdown && <div className="countdown-number">{countdown}</div>}
          </div>

        </div>
      )}

      {/* 프리뷰 화면 */}
      {step === 'preview' && (
        <div className="preview-screen">
          <h2>촬영된 사진</h2>

          <div className="preview-container">
            <div className="preview-images">
              <div className="preview-image-box">
                <h3>원본</h3>
                {capturedPhotos[0] && (
                  <img src={capturedPhotos[0]} alt="original" className="preview-img" />
                )}
              </div>

              <div className="preview-image-box">
                <h3>AI 필터 적용 ({filters.find(f => f.id === selectedFilter)?.name})</h3>
                {filteredImage ? (
                  <img src={filteredImage} alt="filtered" className="preview-img" />
                ) : (
                  <div className="preview-placeholder">
                    <div className="placeholder-icon">{filters.find(f => f.id === selectedFilter)?.emoji}</div>
                    <p>필터를 적용해보세요!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="preview-actions">
              <button
                className="apply-filter-btn"
                onClick={applyFilter}
                disabled={isApplyingFilter}
              >
                {isApplyingFilter ? (
                  <>
                    <div className="spinner"></div>
                    AI 필터 적용 중...
                  </>
                ) : (
                  `✨ ${filters.find(f => f.id === selectedFilter)?.emoji} ${filters.find(f => f.id === selectedFilter)?.name} 필터 적용하기`
                )}
              </button>

              {filteredImage && (
                <button className="download-btn" onClick={downloadFilteredImage}>
                  📥 다운로드
                </button>
              )}

              <button className="retake-btn" onClick={retake}>
                🔄 다시 찍기
              </button>

              <button className="restart-btn" onClick={restart}>
                🏠 처음으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 결과 화면 */}
      {step === 'result' && (
        <div className="result-screen">
          <h2>촬영 완료!</h2>
          {finalImage && (
            <div className="final-image-container">
              <img src={finalImage} alt="final" className="final-image" />
            </div>
          )}
          <div className="result-actions">
            <button className="download-btn" onClick={downloadImage}>
              다운로드
            </button>
            <button className="restart-btn" onClick={restart}>
              처음으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
