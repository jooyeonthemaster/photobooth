'use client';

// 편집 화면 컴포넌트 (필터 적용)
import { useState, useEffect } from 'react';

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
  onBack,
  customerData
}) {
  const [frameUrl, setFrameUrl] = useState('/frame/NEANDER LAB AI PHOTOBOOTH.svg');

  useEffect(() => {
    let objectUrl = null;
    const loadDynamicFrame = async () => {
      try {
        const res = await fetch('/frame/NEANDER LAB AI PHOTOBOOTH.svg');
        let svgText = await res.text();

        const now = new Date();
        const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

        if (customerData?.idolName) {
          svgText = svgText.replace('{{CUSTOM_TEXT}}', customerData.idolName);
        } else {
          svgText = svgText.replace('{{CUSTOM_TEXT}} // ', '');
        }
        svgText = svgText.replace('{{CURRENT_DATE}}', formattedDate);

        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        objectUrl = URL.createObjectURL(blob);
        setFrameUrl(objectUrl);
      } catch (err) {
        console.error('Failed to load dynamic frame in EditScreen:', err);
      }
    };
    loadDynamicFrame();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [customerData]);

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
              src={frameUrl}
            />
            <div className="frame-slots">
              {[0, 1, 2, 3].map(slotIdx => (
                <div
                  key={slotIdx}
                  className={`frame-slot slot-${slotIdx} ${editingSlotIndex === slotIdx ? 'editing' : ''
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
                    className={`filter-option-btn ${slotFilters[editingSlotIndex] === filter.id ? 'active' : ''
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

    </div>
  );
}


