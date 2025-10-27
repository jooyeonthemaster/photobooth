'use client';

// 인트로 시작 화면 컴포넌트
export default function IntroScreen({ onStart, onFilterTest }) {
  return (
    <div className="intro-screen">
      <h1 className="logo">📸 Life4Cut</h1>
      <p className="subtitle">당신만의 특별한 네컷 사진</p>

      <div className="intro-buttons">
        <button className="start-btn" onClick={onStart}>
          시작하기 ✨
        </button>
        {/* <a href="/admin" className="admin-link">
          ⚙️ 필터 설정
        </a> */}
        {/* <button className="filter-test-btn" onClick={onFilterTest}>
          🧪 필터 테스트
        </button> */}
      </div>
    </div>
  );
}

