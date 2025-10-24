'use client';

export default function PrintSuccessModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="print-success-modal-overlay" onClick={onClose}>
      <div className="print-success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon">✅</div>
        <h2>출력을 시작했습니다!</h2>
        <p>잠시 후 사진이 출력됩니다</p>
        <div className="success-animation">
          <div className="printer-icon">🖨️</div>
          <div className="dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
