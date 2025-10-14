'use client';

// 프린터 미리보기 모달 컴포넌트
export default function PrintPreviewModal({
  show,
  previewImage,
  onPrint,
  onClose
}) {
  if (!show) return null;

  return (
    <div className="print-preview-modal" onClick={onClose}>
      <div className="print-preview-content" onClick={(e) => e.stopPropagation()}>
        <h2>🖨️ 프린터 출력 미리보기</h2>
        <p className="print-preview-subtitle">
          실제 DNP DS-620 프린터로 출력될 모습입니다
        </p>

        <div className="print-preview-paper">
          <div className="paper-size-label">4" x 6" (10 x 15 cm)</div>
          {previewImage && (
            <img
              src={previewImage}
              alt="print preview"
              className="print-preview-img"
            />
          )}
        </div>

        <div className="print-preview-actions">
          <button
            className="print-btn"
            onClick={() => {
              onClose();
              onPrint();
            }}
          >
            ✅ 출력하기
          </button>
          <button className="cancel-btn" onClick={onClose}>
            ❌ 취소
          </button>
        </div>
      </div>
    </div>
  );
}


