'use client';

// 편집 화면 컴포넌트 (필터 적용)
export default function EditScreen({
  capturedPhotos,
  selectedSlots,
  filteredPhotos,
  editingSlotIndex,
  slotFilters,
  filters,
  isApplyingFilter,
  onSlotClick,
  onApplyFilter,
  onConfirm,
  onBack
}) {
  return (
    <div className="edit-screen">
      <h2>✨ 각 사진에 필터를 적용하세요</h2>
      <p className="edit-subtitle">사진을 클릭하여 필터를 선택할 수 있습니다</p>

      <div className="edit-layout">
        {/* 왼쪽: 프레임 미리보기 (SelectScreen과 동일) */}
        <div className="frame-section">
          <h3>현재 미리보기</h3>
          <div className="frame-container">
            <img
              alt="frame"
              className="frame-background"
              src="/frame/NEANDER LAB AI PHOTOBOOTH.svg"
            />
            <div className="frame-slots">
              {[0, 1, 2, 3].map(slotIdx => (
                <div
                  key={slotIdx}
                  className={`frame-slot slot-${slotIdx} ${
                    editingSlotIndex === slotIdx ? 'editing' : ''
                  }`}
                  onClick={() => onSlotClick(slotIdx)}
                >
                  {selectedSlots[slotIdx] !== null ? (
                    <img
                      src={filteredPhotos[slotIdx]}
                      alt={`slot ${slotIdx + 1}`}
                      className="slot-photo"
                    />
                  ) : (
                    <div className="slot-number">{slotIdx + 1}</div>
                  )}
                  {/* 선택 표시 */}
                  {editingSlotIndex === slotIdx && (
                    <div className="editing-indicator">{slotIdx + 1}번</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 필터 선택 패널 */}
        <div className="filter-panel">
          {editingSlotIndex !== null ? (
            <>
              <h3>👆 {editingSlotIndex + 1}번 사진에</h3>
              <h3>필터를 적용하세요</h3>
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
