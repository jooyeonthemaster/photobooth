'use client';

import { useState, useRef, useEffect } from 'react';

export default function PinScreen({ onPinVerified, onSkip, onBack }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultsList, setResultsList] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const scrollRef = useRef(null);

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(null);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (value && index === 3) {
      const fullPin = newPin.join('');
      if (fullPin.length === 4) {
        lookupPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'Enter') {
      const fullPin = pin.join('');
      if (fullPin.length === 4) {
        lookupPin(fullPin);
      }
    }
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
    inputRefs[0].current?.focus();
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
      {/* 결과가 없을 때: 기존 PIN 입력 UI */}
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

          <div className="pin-input-group">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`pin-input ${error ? 'pin-error' : ''} ${digit ? 'pin-filled' : ''}`}
                disabled={isLoading}
              />
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

          <div className="pin-actions">
            <button className="pin-skip-btn" onClick={onSkip}>
              BYPASS PIN
            </button>
            <button className="pin-back-btn" onClick={onBack}>
              [ RETURN ]
            </button>
          </div>
        </div>
      )}

      {/* 결과가 있을 때: 풀스크린 가로 카드 선택 */}
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
                  {/* 이미지 */}
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

                  {/* 정보: 이름 + 향수명만 */}
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
