'use client';

import { useState, useRef } from 'react';

export default function PinScreen({ onPinVerified, onSkip, onBack }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultsList, setResultsList] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const scrollRef = useRef(null);

  // 가상 키패드에서 숫자 입력
  const handleKeypadPress = (num) => {
    const currentIndex = pin.findIndex(d => d === '');
    if (currentIndex === -1) return; // 이미 4자리 다 입력됨

    const newPin = [...pin];
    newPin[currentIndex] = String(num);
    setPin(newPin);
    setError(null);

    // 4자리 다 입력되면 자동 조회
    if (currentIndex === 3) {
      const fullPin = newPin.join('');
      lookupPin(fullPin);
    }
  };

  // 백스페이스
  const handleKeypadDelete = () => {
    const filledCount = pin.filter(d => d !== '').length;
    if (filledCount === 0) return;

    const newPin = [...pin];
    newPin[filledCount - 1] = '';
    setPin(newPin);
    setError(null);
  };

  const lookupPin = async (pinCode) => {
    setIsLoading(true);
    setError(null);
    setResultsList(null);
    setSelectedIndex(null);

    try {
      const response = await fetch('/api/pin-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinCode })
      });

      const data = await response.json();

      if (data.success) {
        setResultsList(data.data);
        if (data.data.length === 1) {
          setSelectedIndex(0);
        }
      } else {
        setError(data.message || 'PIN 조회에 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (resultsList && selectedIndex !== null) {
      onPinVerified(resultsList[selectedIndex]);
    }
  };

  const resetPin = () => {
    setPin(['', '', '', '']);
    setResultsList(null);
    setSelectedIndex(null);
    setError(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hour}:${min}`;
  };

  return (
    <div className="pin-screen robot-theme">
      {/* PIN 입력 화면 */}
      {!resultsList && (
        <div className="pin-container">
          {/* 로봇 눈 장식 */}
          <div className="pin-robot-eyes">
            <div className="pin-robot-eye">
              <div className="pin-robot-pupil"></div>
            </div>
            <div className="pin-robot-eye">
              <div className="pin-robot-pupil"></div>
            </div>
          </div>

          <h1 className="pin-title">AC'SCENT x PHOTOBOOTH</h1>
          <p className="pin-subtitle">ENTER ACCESS PIN</p>

          {/* PIN 표시 (읽기 전용) */}
          <div className="pin-display-group">
            {pin.map((digit, index) => (
              <div
                key={index}
                className={`pin-display-cell ${error ? 'pin-error' : ''} ${digit ? 'pin-filled' : ''} ${
                  !digit && pin.filter(d => d !== '').length === index ? 'pin-active' : ''
                }`}
              >
                {digit ? (
                  <span className="pin-display-digit">{digit}</span>
                ) : (
                  <span className="pin-display-cursor"></span>
                )}
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="pin-loading">
              <div className="spinner"></div>
              <p>VERIFYING...</p>
            </div>
          )}

          {error && (
            <div className="pin-error-message">
              <p>{error}</p>
              <button className="pin-retry-btn" onClick={resetPin}>
                다시 입력
              </button>
            </div>
          )}

          {/* 가상 키패드 */}
          {!isLoading && !error && (
            <div className="pin-keypad">
              <div className="pin-keypad-row">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    className="pin-key"
                    onClick={() => handleKeypadPress(n)}
                    disabled={isLoading}
                  >
                    <span className="pin-key-num">{n}</span>
                  </button>
                ))}
              </div>
              <div className="pin-keypad-row">
                {[4, 5, 6].map(n => (
                  <button
                    key={n}
                    className="pin-key"
                    onClick={() => handleKeypadPress(n)}
                    disabled={isLoading}
                  >
                    <span className="pin-key-num">{n}</span>
                  </button>
                ))}
              </div>
              <div className="pin-keypad-row">
                {[7, 8, 9].map(n => (
                  <button
                    key={n}
                    className="pin-key"
                    onClick={() => handleKeypadPress(n)}
                    disabled={isLoading}
                  >
                    <span className="pin-key-num">{n}</span>
                  </button>
                ))}
              </div>
              <div className="pin-keypad-row">
                <button
                  className="pin-key pin-key-fn"
                  onClick={resetPin}
                  disabled={isLoading}
                >
                  <span className="pin-key-label">CLR</span>
                </button>
                <button
                  className="pin-key"
                  onClick={() => handleKeypadPress(0)}
                  disabled={isLoading}
                >
                  <span className="pin-key-num">0</span>
                </button>
                <button
                  className="pin-key pin-key-fn"
                  onClick={handleKeypadDelete}
                  disabled={isLoading}
                >
                  <span className="pin-key-label">DEL</span>
                </button>
              </div>
            </div>
          )}

          <div className="pin-actions">
            <button className="pin-back-btn" onClick={onBack}>
              [ RETURN ]
            </button>
          </div>
        </div>
      )}

      {/* 결과: 프로필 카드 선택 */}
      {resultsList && resultsList.length > 0 && (
        <div className="pin-results-screen">
          <div className="pin-results-header">
            <div className="pin-robot-eyes small">
              <div className="pin-robot-eye">
                <div className="pin-robot-pupil"></div>
              </div>
              <div className="pin-robot-eye">
                <div className="pin-robot-pupil"></div>
              </div>
            </div>
            <h2 className="pin-results-title">PROFILE DETECTED</h2>
            <p className="pin-results-count">
              {resultsList.length}개의 프로필 중 본인을 선택하세요
            </p>
          </div>

          <div className="pin-carousel-wrapper">
            <div className="pin-carousel" ref={scrollRef}>
              {resultsList.map((item, idx) => (
                <div
                  key={item.id}
                  className={`pin-card ${selectedIndex === idx ? 'selected' : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <div className="pin-card-image">
                    {item.userImageUrl ? (
                      <img
                        src={item.userImageUrl}
                        alt="분석 이미지"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="pin-card-no-image">
                        <div className="pin-card-robot-face">
                          <div className="mini-eye"></div>
                          <div className="mini-eye"></div>
                        </div>
                      </div>
                    )}
                    {selectedIndex === idx && (
                      <div className="pin-card-selected-badge">SELECTED</div>
                    )}
                    <div className="pin-card-date-overlay">{formatDate(item.createdAt)}</div>
                  </div>
                  <div className="pin-card-info">
                    <h3 className="pin-card-name">{item.idolName}</h3>
                    <p className="pin-card-perfume">{item.perfumeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pin-results-actions">
            <button
              className="pin-confirm-btn"
              onClick={handleConfirm}
              disabled={selectedIndex === null}
            >
              {selectedIndex !== null ? 'INITIALIZE PROFILE' : 'SELECT YOUR PROFILE'}
            </button>
            <button className="pin-retry-btn" onClick={resetPin}>
              다른 PIN 입력
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
