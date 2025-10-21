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
        {/* 왼쪽: 4개 슬롯 */}
        <div className="slots-container">
          <h3>프레임 슬롯 (위 → 아래 순서)</h3>
          {[0, 1, 2, 3].map(slotIdx => (
            <div key={slotIdx} className="slot-box">
              <div className="slot-number">{slotIdx + 1}번</div>
              {selectedSlots[slotIdx] !== null ? (
                <img
                  src={capturedPhotos[selectedSlots[slotIdx]]}
                  alt={`slot ${slotIdx + 1}`}
                  className="slot-image"
                />
              ) : (
                <div className="slot-placeholder">선택해주세요</div>
              )}
            </div>
          ))}
        </div>

        {/* 오른쪽: 6개 촬영본 */}
        <div className="photos-grid">
          <h3>촬영한 사진 (클릭하여 슬롯에 배치)</h3>
          <div className="photos-container">
            {capturedPhotos.map((photo, photoIdx) => (
              <div key={photoIdx} className="photo-item">
                <img
                  src={photo}
                  alt={`photo ${photoIdx + 1}`}
                  className="photo-thumbnail"
                  onClick={() => {
                    // 비어있는 첫 번째 슬롯에 할당
                    const emptySlot = selectedSlots.indexOf(null);
                    if (emptySlot !== -1) {
                      onSelectImage(emptySlot, photoIdx);
                    }
                  }}
                />
                <div className="photo-number">{photoIdx + 1}</div>
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
              4컷 미리보기 생성 중...
            </>
          ) : (
            '📸 4컷 미리보기 생성'
          )}
        </button>
        <button className="reset-btn" onClick={onResetSelection}>
          🔄 선택 초기화
        </button>
        <button className="retake-btn" onClick={onRetake}>
          📷 다시 촬영하기
        </button>
      </div>
    </div>
  );
}





