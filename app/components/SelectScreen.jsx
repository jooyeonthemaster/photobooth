'use client';

// 사진 선택 화면 컴포넌트
import { useState, useEffect } from 'react';

export default function SelectScreen({
  capturedPhotos,
  selectedSlots,
  onSelectImage,
  onCreatePreview,
  onResetSelection,
  onRetake,
  isCombining,
  customerData,
  referenceImageUrl
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
        console.error('Failed to load dynamic frame:', err);
      }
    };
    loadDynamicFrame();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [customerData]);

  const isPinMode = !!customerData;
  const selectCount = isPinMode ? 1 : 4;

  return (
    <div className="select-screen">
      <h2>{isPinMode ? '가장 마음에 드는 사진 1장을 선택하세요' : '4개의 사진을 선택하세요'}</h2>
      <p className="select-subtitle">{isPinMode ? '선택한 사진으로 AI가 4컷을 생성합니다' : '원하는 사진을 클릭하여 4개 슬롯에 배치하세요'}</p>

      {/* AC'SCENT 참조 이미지 배너 */}
      {customerData && (
        <div className="acscent-banner">
          <div className="acscent-banner-content">
            {referenceImageUrl && (
              <img
                src={referenceImageUrl}
                alt="향수 프로필"
                className="acscent-ref-thumb"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="acscent-banner-text">
              <span className="acscent-badge">AC'SCENT</span>
              <strong>{customerData.idolName}</strong>
              <span className="acscent-perfume">{customerData.perfumeName}</span>
            </div>
          </div>
        </div>
      )}

      {isPinMode ? (
        /* PIN 모드: 프레임 없이 사진 3장만 나열 */
        <div className="pin-select-layout">
          <div className="pin-photos-grid">
            {capturedPhotos.map((photo, photoIdx) => (
              <div
                key={photoIdx}
                className={`pin-photo-card ${selectedSlots[0] === photoIdx ? 'pin-selected' : ''}`}
                onClick={() => {
                  if (selectedSlots[0] === photoIdx) {
                    onSelectImage(0, null);
                  } else {
                    onSelectImage(0, photoIdx);
                  }
                }}
              >
                <img
                  src={photo}
                  alt={`photo ${photoIdx + 1}`}
                  className="pin-photo-img"
                />
                {selectedSlots[0] === photoIdx && (
                  <div className="pin-selected-badge">✓</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 일반 모드: 기존 프레임 미리보기 + 6장 그리드 */
        <div className="selection-layout">
          <div className="frame-section">
            <div className="frame-container">
              <img
                alt="frame"
                className="frame-background"
                src={frameUrl}
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

          <div className="photos-section">
            <h3>촬영한 사진</h3>
            <div className="photos-grid-2x3">
              {capturedPhotos.map((photo, photoIdx) => (
                <div
                  key={photoIdx}
                  className={`photo-card ${selectedSlots.includes(photoIdx) ? 'selected' : ''}`}
                  onClick={() => {
                    const selectedIndex = selectedSlots.indexOf(photoIdx);
                    if (selectedIndex !== -1) {
                      onSelectImage(selectedIndex, null);
                    } else {
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
      )}

      <div className="select-actions">
        <button
          className="combine-btn"
          onClick={onCreatePreview}
          disabled={isCombining || selectedSlots.includes(null)}
        >
          {isCombining ? (
            <>
              <div className="spinner"></div>
              {customerData
                ? 'AC\'SCENT 향수 프로필 + AI 필터 합성 중...'
                : 'AI 필터 적용 중... 잠시만 기다려주세요'
              }
            </>
          ) : (
            customerData
              ? '✨ AC\'SCENT + AI 필터 합성하기'
              : '✨ AI 필터 자동 적용하기'
          )}
        </button>
        <button className="reset-btn" onClick={onResetSelection}>
          🔄 선택 초기화
        </button>
      </div>
    </div>
  );
}
