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
      <h2>🎉 4컷 완성!</h2>
      {finalImage && (
        <div className="final-image-container">
          <img src={finalImage} alt="final" className="final-image" />
        </div>
      )}
      <div className="result-actions">
        <button className="download-btn" onClick={onDownload}>
          📥 다운로드
        </button>
        <button className="print-preview-btn" onClick={onPrintPreview}>
          👁️ 프린터 미리보기
        </button>
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
            '🖨️ DNP 프린터 출력'
          )}
        </button>
        <button className="restart-btn" onClick={onRestart}>
          🏠 처음으로
        </button>
      </div>
    </div>
  );
}





