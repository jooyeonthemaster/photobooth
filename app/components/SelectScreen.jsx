'use client';

// 사진 선택 화면 컴포넌트
export default function SelectScreen({
  capturedPhotos,
  selectedSlots,
  onSelectImage,
  onCreatePreview,
  onResetSelection,
  onRetake,
  isCombining
}) {
  return (
    <div className="select-screen">
      <h2>4개의 사진을 선택하세요</h2>
      <p className="select-subtitle">원하는 사진을 클릭하여 4개 슬롯에 배치하세요</p>

      <div className="selection-layout">
        {/* 왼쪽: 프레임 미리보기 */}
        <div className="frame-section">
          <div className="frame-container">
            <img
              alt="frame"
              className="frame-background"
              src="/frame/NEANDER LAB AI PHOTOBOOTH.svg"
            />
            <div className="frame-slots">
              {[0, 1, 2, 3].map(slotIdx => (
                <div key={slotIdx} className={`frame-slot slot-${slotIdx}`}>
                  {selectedSlots[slotIdx] !== null ? (
                    <img
                      src={capturedPhotos[selectedSlots[slotIdx]]}
                      alt={`slot ${slotIdx + 1}`}
                      className="slot-photo"
                    />
                  ) : (
                    <div className="slot-number">{slotIdx + 1}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 촬영한 사진 2x3 그리드 */}
        <div className="photos-section">
          <h3>촬영한 사진</h3>
          <div className="photos-grid-2x3">
            {capturedPhotos.map((photo, photoIdx) => (
              <div
                key={photoIdx}
                className={`photo-card ${selectedSlots.includes(photoIdx) ? 'selected' : ''}`}
                onClick={() => {
                  // 이미 선택된 이미지를 다시 클릭하면 선택 해제
                  const selectedIndex = selectedSlots.indexOf(photoIdx);
                  if (selectedIndex !== -1) {
                    onSelectImage(selectedIndex, null);
                  } else {
                    // 새로 선택하는 경우
                    const emptySlot = selectedSlots.indexOf(null);
                    if (emptySlot !== -1) {
                      onSelectImage(emptySlot, photoIdx);
                    }
                  }
                }}
              >
                <img
                  src={photo}
                  alt={`photo ${photoIdx + 1}`}
                  className="photo-img"
                />
                <div className="photo-badge">{photoIdx + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="select-actions">
        <button
          className="combine-btn"
          onClick={onCreatePreview}
          disabled={isCombining || selectedSlots.includes(null)}
        >
          {isCombining ? (
            <>
              <div className="spinner"></div>
              AI 필터 적용 중... 잠시만 기다려주세요
            </>
          ) : (
            '✨ AI 필터 자동 적용하기'
          )}
        </button>
        <button className="reset-btn" onClick={onResetSelection}>
          🔄 선택 초기화
        </button>
      </div>
    </div>
  );
}








