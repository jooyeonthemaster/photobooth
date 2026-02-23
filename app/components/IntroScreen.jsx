'use client';

// 인트로 시작 화면 컴포넌트
export default function IntroScreen({ onStart, onFilterTest }) {
  return (
    <div className="intro-screen robot-theme">
      <div className="robot-container">
        <div className="robot-head">
          <div className="robot-ear left"></div>
          <div className="robot-ear right"></div>
          <div className="robot-face" onClick={onStart}>
            <div className="robot-eyes">
              <div className="robot-eye">
                <div className="robot-pupil">
                  <div className="robot-sparkle"></div>
                </div>
              </div>
              <div className="robot-eye">
                <div className="robot-pupil">
                  <div className="robot-sparkle"></div>
                </div>
              </div>
            </div>
            <div className="robot-blush left"></div>
            <div className="robot-blush right"></div>
            <div className="robot-mouth-container">
              <button className="robot-mouth-btn">
                <span>START</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

