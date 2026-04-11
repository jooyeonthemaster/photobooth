'use client';

import { useState, useEffect, useRef } from 'react';
import { useMotionDetection } from '../hooks/useMotionDetection';

// 합성이 5분 넘게 끝나지 않으면 탈출 버튼 노출
const ESCAPE_TIMEOUT_MS = 5 * 60 * 1000;

export default function ScanningOverlay({ isVisible, mode = 'full', isPinMode = false, streamRef, cameraMode, cameraReady, onTimeout }) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showEscape, setShowEscape] = useState(false);
  const startTimeRef = useRef(null);

  const motionDetection = useMotionDetection(streamRef, cameraMode, cameraReady, isVisible);
  const { motionCenter } = motionDetection;

  // 5분 타임아웃: 탈출 버튼 노출
  useEffect(() => {
    if (!isVisible) {
      setShowEscape(false);
      return;
    }
    const timer = setTimeout(() => setShowEscape(true), ESCAPE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const phases = mode === 'full'
    ? isPinMode
      ? ['사진 분석 중...', "AC'SCENT AI 변환 중...", '4컷 합성 중...']
      : ['사진 분석 중...', 'AI 필터 생성 중...', '4컷 합성 중...']
    : ['사진 분석 중...', 'AI 필터 적용 중...'];

  const phaseTimings = mode === 'full'
    ? [5000, 20000]
    : [3000];

  useEffect(() => {
    if (!isVisible) {
      setCurrentPhase(0);
      startTimeRef.current = null;
      return;
    }
    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      let newPhase = 0;
      for (let i = 0; i < phaseTimings.length; i++) {
        if (elapsed >= phaseTimings[i]) newPhase = i + 1;
      }
      if (newPhase !== currentPhase) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 400);
        setCurrentPhase(newPhase);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible, currentPhase]);

  // 마스코트: 카메라 트래킹
  const mascotX = ((1 - motionCenter.x) - 0.5) * 2 * 250;
  const facingLeft = mascotX < 0;
  const mascotStyle = {
    transform: `translateX(${mascotX}px) scaleX(${facingLeft ? -1 : 1})`,
    transition: 'transform 0.3s ease-out',
  };

  if (!isVisible) return null;

  return (
    <div className="scanning-overlay">
      <div className="scanning-bg" />

      {/* 로봇 눈 */}
      <div className="scanning-eyes-container">
        <div className="scanning-eye">
          <div className="scanning-pupil">
            <div className="scanning-sparkle" />
          </div>
        </div>
        <div className="scanning-eye">
          <div className="scanning-pupil">
            <div className="scanning-sparkle" />
          </div>
        </div>
      </div>

      {/* 레이저 빔 */}
      <div className="scanning-laser-container">
        <div className="scanning-laser-beam left" />
        <div className="scanning-laser-beam right" />
      </div>

      {/* 스캔 라인 */}
      <div className="scanning-line" />

      {/* 단계 텍스트 */}
      <div className={`scanning-text-container ${isGlitching ? 'glitch-active' : ''}`}>
        <p className="scanning-phase-text">{phases[currentPhase]}</p>
        <div className="scanning-progress-dots">
          {phases.map((_, i) => (
            <span
              key={i}
              className={`scanning-dot ${i <= currentPhase ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* 마스코트 */}
      <div className="scanning-mascot" style={mascotStyle}>
        <img src="/hf_20260315_112709_ed482a5c-da4d-417d-90f7-85730bfcad19-removebg-preview.png" alt="" />
      </div>

      {/* 파티클 */}
      <div className="scanning-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="scanning-particle"
            style={{
              left: `${8 + (i * 7.5)}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* 5분 초과 시 탈출 버튼 */}
      {showEscape && onTimeout && (
        <button
          type="button"
          className="scanning-escape-btn"
          onClick={onTimeout}
        >
          처음 화면으로 돌아가기
        </button>
      )}
    </div>
  );
}
