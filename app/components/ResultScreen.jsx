'use client';

// 결과 화면 컴포넌트
export default function ResultScreen({
  finalImage,
  onDownload,
  onPrintPreview,
  onPrint,
  onRestart,
  isPrinting
}) {
  return (
    <div className="result-screen">
      {finalImage && (
        <div className="final-image-container">
          <img src={finalImage} alt="final" className="final-image" />
        </div>
      )}
      <div className="result-actions">
        <button
          className="print-btn"
          onClick={onPrint}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <>
              <div className="spinner"></div>
              출력 중...
            </>
          ) : (
            '🖨️ 출력하기'
          )}
        </button>
      </div>
    </div>
  );
}









