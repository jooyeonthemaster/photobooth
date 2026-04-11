'use client';

import { useState, useEffect, useRef } from 'react';
import QRCodeDisplay from './QRCodeDisplay';

// 결과 화면 컴포넌트
export default function ResultScreen({
  finalImage,
  onDownload,
  onPrint,
  onRestart,
  onBack,
  isPrinting,
  printDone,
  qrUrl,
  isUploading,
}) {
  const [copies, setCopies] = useState(1);
  // 프린트 완료 후 30초 자동 홈 복귀 카운트다운
  const [countdown, setCountdown] = useState(null);
  const onRestartRef = useRef(onRestart);

  // ref 최신 상태 유지 (useEffect 재실행 방지)
  useEffect(() => {
    onRestartRef.current = onRestart;
  }, [onRestart]);

  useEffect(() => {
    if (!printDone) return;
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onRestartRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [printDone]);

  return (
    <div className="result-screen">
      {/* 왼쪽: 최종 이미지 */}
      {finalImage && (
        <div className="final-image-container">
          <img src={finalImage} alt="final" className="final-image" />
        </div>
      )}

      {/* 오른쪽: QR + 버튼 */}
      <div className="result-right-panel">
        {/* QR 코드 영역 */}
        {qrUrl ? (
          <div className="qr-section">
            <QRCodeDisplay url={qrUrl} size={200} />
            <p className="qr-hint">QR을 스캔하여 사진 저장</p>
          </div>
        ) : isUploading ? (
          <div className="qr-section">
            <div className="qr-loading">
              <div className="spinner-small"></div>
            </div>
            <p className="qr-hint">QR 준비 중...</p>
          </div>
        ) : null}

        {/* 장수 선택 + 버튼 영역 */}
        <div className="result-actions">
          {printDone ? (
            <button className="home-btn" onClick={onRestart}>
              홈으로 가기
              {countdown !== null && (
                <span className="auto-restart-timer"> ({countdown}초)</span>
              )}
            </button>
          ) : (
            <>
              <div className="copies-grid">
                {[1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    className={`copies-btn ${copies === n ? 'active' : ''}`}
                    onClick={() => setCopies(n)}
                    disabled={isPrinting}
                  >
                    {n}<span>장</span>
                  </button>
                ))}
              </div>
              <button
                className="print-btn"
                onClick={() => onPrint(copies)}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <>
                    <div className="spinner"></div>
                    출력 중...
                  </>
                ) : (
                  `${copies}장 출력하기`
                )}
              </button>
              <button
                className="back-btn"
                onClick={onBack}
                disabled={isPrinting}
              >
                ← 뒤로
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
