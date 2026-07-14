'use client';

// 화풍 선택 화면 (PIN 모드 전용) — 탭으로 선택 후 "다음으로"로 생성
// id는 백엔드 STYLE_PRESETS 키(seedream.js)와 일치, 미리보기 이미지는 public/styles/<id>.jpg
const STYLE_OPTIONS = [
  { id: 'webtoon', label: '소프트 감성', desc: '담백한 데일리 웹툰' },
  { id: 'semireal', label: '시크 리얼', desc: '성숙한 반실사' },
  { id: 'sunjeong', label: '러블리 순정', desc: '반짝 눈 로맨스' },
  { id: 'ropan', label: '로판 판타지', desc: '화려한 궁정' },
  { id: 'anime', label: '재패니메', desc: '쨍한 일본 애니' },
  { id: 'idoleye', label: '스타 아이', desc: '별 박힌 눈' },
  { id: 'cinematic', label: '시네마 무드', desc: '발광 감성 애니' },
  { id: 'watertoon', label: '수채 감성', desc: '포근한 손그림' },
  { id: 'chibi', label: '큐티 치비', desc: '초귀요미' },
  { id: 'figurine', label: '피규어 토이', desc: '광택 피규어' },
  { id: 'render3d', label: '몽글 3D', desc: '말랑 3D 렌더' },
  { id: 'watercolor', label: '드리미 워터', desc: '몽환 수채' },
];

export default function StyleSelectScreen({ onSelect, onConfirm, onBack, selectedStyle, customerData, isCombining }) {
  return (
    <div className="select-screen style-select-screen">
      <h2>어떤 그림체로 만들까요?</h2>
      <p className="select-subtitle">화풍을 고르고 <strong>다음으로</strong>를 눌러주세요 ✨</p>

      {customerData && (
        <div className="acscent-banner">
          <div className="acscent-banner-content">
            <div className="acscent-banner-text">
              <span className="acscent-badge">AC'SCENT</span>
              <strong>{customerData.idolName}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="style-grid">
        {STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`style-card ${selectedStyle === opt.id ? 'style-selected' : ''}`}
            onClick={() => onSelect(opt.id)}
            disabled={isCombining}
          >
            <img className="style-thumb" src={`/styles/${opt.id}.jpg`} alt={opt.label} draggable="false" />
            {selectedStyle === opt.id && <div className="style-check">✓</div>}
          </button>
        ))}
      </div>

      <div className="select-actions">
        <button className="reset-btn" onClick={onBack} disabled={isCombining}>
          ← 사진 다시 선택
        </button>
        <button className="combine-btn" onClick={onConfirm} disabled={isCombining}>
          {isCombining ? (
            <>
              <div className="spinner"></div>
              AI 합성 중...
            </>
          ) : (
            '다음으로 →'
          )}
        </button>
      </div>
    </div>
  );
}
