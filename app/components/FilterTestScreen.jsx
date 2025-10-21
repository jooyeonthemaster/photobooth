'use client';

import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { filters } from '../constants/filters';
import { videoConstraints } from '../constants/camera';
import { captureAndCropImage } from '../utils/imageProcessing';
import { applyFilter } from '../utils/apiService';

export default function FilterTestScreen({ onBack }) {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [sourceImage, setSourceImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterResult, setFilterResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 컴포넌트 마운트 시 body 스크롤 활성화
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
    };
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSourceImage(event.target.result);
      setFilterResult(null);
      setSelectedFilter(null);
    };
    reader.readAsDataURL(file);
  };

  // 웹캠 촬영
  const handleCapture = async () => {
    if (!cameraReady) {
      alert('카메라가 준비되지 않았습니다.');
      return;
    }

    try {
      const image = await captureAndCropImage(webcamRef);
      setSourceImage(image);
      setShowCamera(false);
      setFilterResult(null);
      setSelectedFilter(null);
    } catch (error) {
      console.error('촬영 실패:', error);
      alert('사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 필터 선택 및 적용
  const handleFilterSelect = async (filter) => {
    if (!sourceImage) {
      alert('먼저 이미지를 업로드하거나 촬영해주세요.');
      return;
    }

    setSelectedFilter(filter);
    setIsProcessing(true);
    setFilterResult(null);

    try {
      const startTime = Date.now();
      const result = await applyFilter(sourceImage, filter.id);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (result.success) {
        setFilterResult({
          filterId: filter.id,
          filterName: filter.name,
          emoji: filter.emoji,
          image: result.image,
          duration: duration,
          success: true
        });
      } else {
        setFilterResult({
          filterId: filter.id,
          filterName: filter.name,
          emoji: filter.emoji,
          error: result.message,
          duration: duration,
          success: false
        });
      }
    } catch (error) {
      setFilterResult({
        filterId: filter.id,
        filterName: filter.name,
        emoji: filter.emoji,
        error: error.message,
        success: false
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="filter-test-wrapper">
      <div className="filter-test-screen">
      <div className="test-header">
        <button className="back-btn" onClick={onBack}>← 뒤로</button>
        <h2>🧪 필터 테스트</h2>
      </div>

      {/* 이미지 소스 선택 */}
      {!sourceImage && !showCamera && (
        <div className="source-selection">
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 이미지 업로드
          </button>
          <button
            className="camera-btn"
            onClick={() => setShowCamera(true)}
          >
            📷 카메라로 촬영
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* 카메라 화면 */}
      {showCamera && (
        <div className="camera-section">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMedia={() => setCameraReady(true)}
            className="webcam-preview"
          />
          <div className="camera-controls">
            <button onClick={handleCapture} disabled={!cameraReady}>
              📸 촬영
            </button>
            <button onClick={() => setShowCamera(false)}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 원본 이미지 */}
      {sourceImage && (
        <div className="source-image-section">
          <h3>원본 이미지</h3>
          <img src={sourceImage} alt="Source" className="source-image" />
          <div className="source-controls">
            <button onClick={() => fileInputRef.current?.click()}>
              🔄 다른 이미지 선택
            </button>
          </div>
        </div>
      )}

      {/* 필터 목록 */}
      {sourceImage && (
        <div className="filters-section">
          <h3>필터 선택</h3>
          <div className="filters-grid">
            {filters.filter(f => f.id !== 'none').map((filter) => (
              <button
                key={filter.id}
                className={`filter-btn ${selectedFilter?.id === filter.id ? 'selected' : ''}`}
                onClick={() => handleFilterSelect(filter)}
                disabled={isProcessing}
              >
                <span className="filter-emoji-large">{filter.emoji}</span>
                <span className="filter-name-text">{filter.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 진행 상태 */}
      {isProcessing && (
        <div className="processing-section">
          <div className="spinner"></div>
          <p>필터 적용 중...</p>
        </div>
      )}

      {/* 필터 결과 */}
      {filterResult && (
        <div className="result-section">
          <h3>
            {filterResult.emoji} {filterResult.filterName} 결과
            {filterResult.duration && <span className="duration-badge">{filterResult.duration}s</span>}
          </h3>

          <div className="comparison-view">
            <div className="image-box">
              <p className="image-label">원본</p>
              <img src={sourceImage} alt="Original" className="compare-image" />
            </div>

            <div className="arrow">→</div>

            <div className="image-box">
              <p className="image-label">필터 적용 후</p>
              {filterResult.success ? (
                <img src={filterResult.image} alt="Filtered" className="compare-image" />
              ) : (
                <div className="error-box">
                  <p>❌ 필터 적용 실패</p>
                  <p className="error-detail">{filterResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .filter-test-wrapper {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .filter-test-screen {
          max-width: 1400px;
          margin: 0 auto;
          padding-bottom: 60px;
        }

        @media (max-width: 768px) {
          .filter-test-wrapper {
            padding: 10px;
          }

          .filter-test-screen {
            padding-bottom: 40px;
          }
        }

        .test-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
        }

        .test-header h2 {
          color: white;
          margin: 0;
        }

        .back-btn {
          padding: 10px 20px;
          background: #333;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }

        .back-btn:hover {
          background: #555;
        }

        .source-selection {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin: 50px 0;
        }

        .upload-btn, .camera-btn {
          padding: 20px 40px;
          font-size: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .upload-btn:hover, .camera-btn:hover {
          transform: scale(1.05);
        }

        .camera-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .webcam-preview {
          width: 100%;
          max-width: 640px;
          border-radius: 12px;
        }

        .camera-controls {
          display: flex;
          gap: 10px;
        }

        .camera-controls button {
          padding: 12px 24px;
          font-size: 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .source-image-section {
          text-align: center;
          margin: 30px 0;
        }

        .source-image-section h3 {
          color: white;
        }

        .source-image {
          max-width: 300px;
          max-height: 450px;
          border-radius: 12px;
          margin: 20px 0;
        }

        .source-controls {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .source-controls button {
          padding: 12px 24px;
          font-size: 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        .filters-section {
          margin: 40px 0;
        }

        .filters-section h3 {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          color: white;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .filters-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 10px;
          }

          .filters-section h3 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .filters-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }

        .filter-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 10px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          border-color: #667eea;
        }

        .filter-btn.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
        }

        .filter-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .filter-emoji-large {
          font-size: 40px;
        }

        .filter-name-text {
          font-size: 14px;
          font-weight: 500;
          text-align: center;
        }

        .processing-section {
          text-align: center;
          padding: 40px;
        }

        .processing-section p {
          color: white;
          font-size: 18px;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .result-section {
          margin: 40px 0;
        }

        .result-section h3 {
          text-align: center;
          font-size: 24px;
          margin-bottom: 30px;
          color: white;
        }

        .duration-badge {
          font-size: 14px;
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          margin-left: 10px;
        }

        .comparison-view {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 30px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .comparison-view {
            gap: 20px;
          }

          .arrow {
            transform: rotate(90deg);
          }
        }

        .image-box {
          text-align: center;
        }

        .image-label {
          font-weight: bold;
          margin-bottom: 10px;
          font-size: 16px;
        }

        .compare-image {
          max-width: 400px;
          max-height: 600px;
          border-radius: 12px;
          border: 2px solid #ddd;
        }

        @media (max-width: 768px) {
          .compare-image {
            max-width: 300px;
            max-height: 450px;
          }
        }

        @media (max-width: 480px) {
          .compare-image {
            max-width: 90vw;
            max-height: 500px;
          }
        }

        .arrow {
          font-size: 40px;
          color: #667eea;
          font-weight: bold;
        }

        .error-box {
          width: 400px;
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #ffebee;
          border: 2px solid #f44336;
          border-radius: 12px;
        }

        .error-box p {
          margin: 10px 0;
          color: #c62828;
        }

        .error-detail {
          font-size: 14px;
          padding: 0 20px;
        }
      `}</style>
      </div>
    </div>
  );
}
