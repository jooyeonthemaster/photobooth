'use client';

// 편집 화면 컴포넌트 (필터 적용)
export default function EditScreen({
  previewComposite,
  filteredPhotos,
  editingSlotIndex,
  slotFilters,
  filters,
  isApplyingFilter,
  showBeforeAfter,
  onSlotClick,
  onApplyFilter,
  onConfirm,
  onBack,
  onBeforeAfterPress,
  onBeforeAfterRelease
}) {
  return (
    <div className="edit-screen">
      <h2>✨ 각 사진에 필터를 적용하세요</h2>
      <p className="edit-subtitle">사진을 클릭하여 필터를 선택할 수 있습니다</p>

      <div className="edit-layout">
        {/* 왼쪽: 합성된 4컷 미리보기 */}
        <div className="composite-preview">
          <h3>현재 미리보기</h3>
          {previewComposite && (
            <div className="composite-container">
              <img
                src={previewComposite}
                alt="composite preview"
                className="composite-image"
              />

              {/* 각 영역에 클릭 가능한 오버레이 */}
              <div className="composite-overlay">
                {[0, 1, 2, 3].map(slotIdx => (
                  <div
                    key={slotIdx}
                    className={`overlay-slot slot-${slotIdx} ${
                      editingSlotIndex === slotIdx ? 'editing' : ''
                    }`}
                    onClick={() => onSlotClick(slotIdx)}
                  >
                    <div className="slot-label">
                      {slotIdx + 1}번
                      {slotFilters[slotIdx] !== 'none' && (
                        <span className="filter-badge">
                          {filters.find(f => f.id === slotFilters[slotIdx])?.emoji}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 적용 전/후 비교 버튼 */}
          <button
            className="before-after-btn"
            onMouseDown={onBeforeAfterPress}
            onMouseUp={onBeforeAfterRelease}
            onMouseLeave={onBeforeAfterRelease}
            onTouchStart={onBeforeAfterPress}
            onTouchEnd={onBeforeAfterRelease}
          >
            👁️ 길게 눌러서 원본 보기
          </button>
        </div>

        {/* 오른쪽: 필터 선택 패널 */}
        <div className="filter-panel">
          {editingSlotIndex !== null ? (
            <>
              <h3>{editingSlotIndex + 1}번 사진 필터 선택</h3>
              <div className="filter-preview-box">
                <img
                  src={filteredPhotos[editingSlotIndex]}
                  alt={`slot ${editingSlotIndex + 1}`}
                  className="filter-preview-image"
                />
              </div>
              <div className="filter-options-grid">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    className={`filter-option-btn ${
                      slotFilters[editingSlotIndex] === filter.id ? 'active' : ''
                    }`}
                    onClick={() => onApplyFilter(editingSlotIndex, filter.id)}
                    disabled={isApplyingFilter}
                  >
                    <span className="filter-emoji">{filter.emoji}</span>
                    <span className="filter-name">{filter.name}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="filter-placeholder">
              <p>👆 왼쪽 사진을 클릭하여</p>
              <p>필터를 적용하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="edit-actions">
        <button
          className="confirm-btn"
          onClick={onConfirm}
          disabled={isApplyingFilter}
        >
          ✅ 완성하기
        </button>
        <button className="back-btn" onClick={onBack}>
          ← 사진 다시 선택
        </button>
      </div>

      {/* 필터 적용 중 로딩 오버레이 */}
      {isApplyingFilter && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner-large"></div>
            <p>AI 필터 적용 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}


