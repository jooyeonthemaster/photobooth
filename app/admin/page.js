'use client';

import { useState, useEffect } from 'react';
import { filters } from '../constants/filters';
import './admin.css';

export default function AdminPage() {
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('photoboothFilters');
    if (saved) {
      const config = JSON.parse(saved);
      setSelectedFilters(config.selectedFilters || []);
    }
  }, []);

  // 필터 선택/해제
  const toggleFilter = (filterId) => {
    if (selectedFilters.includes(filterId)) {
      setSelectedFilters(selectedFilters.filter(id => id !== filterId));
    } else {
      if (selectedFilters.length < 4) {
        setSelectedFilters([...selectedFilters, filterId]);
      } else {
        alert('최대 4개까지 선택 가능합니다.');
      }
    }
  };

  // 필터 분배 로직
  const distributeFilters = (selected) => {
    const count = selected.length;

    if (count === 0) {
      return ['none', 'none', 'none', 'none'];
    } else if (count === 1) {
      // 1개 선택 → 4개 모두 같은 필터
      return [selected[0], selected[0], selected[0], selected[0]];
    } else if (count === 2) {
      // 2개 선택 → 2개씩 할당
      return [selected[0], selected[0], selected[1], selected[1]];
    } else if (count === 3) {
      // 3개 선택 → 1개, 1개, 2개 할당
      return [selected[0], selected[1], selected[2], selected[2]];
    } else {
      // 4개 선택 → 각 1개씩
      return [selected[0], selected[1], selected[2], selected[3]];
    }
  };

  // 저장
  const handleSave = () => {
    const slotAssignment = distributeFilters(selectedFilters);

    const config = {
      selectedFilters: selectedFilters,
      slotAssignment: slotAssignment
    };

    localStorage.setItem('photoboothFilters', JSON.stringify(config));

    setSaveMessage('✅ 저장 완료!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  // 미리보기
  const previewAssignment = distributeFilters(selectedFilters);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🎨 포토부스 필터 설정</h1>
        <p>적용할 필터를 선택하세요 (최대 4개)</p>
      </div>

      <div className="filter-selection">
        <div className="selected-count">
          선택: {selectedFilters.length} / 4
        </div>

        <div className="filter-grid">
          {filters.filter(f => f.id !== 'none').map(filter => (
            <div
              key={filter.id}
              className={`filter-card ${selectedFilters.includes(filter.id) ? 'selected' : ''}`}
              onClick={() => toggleFilter(filter.id)}
            >
              <span className="filter-emoji">{filter.emoji}</span>
              <span className="filter-name">{filter.name}</span>
              {selectedFilters.includes(filter.id) && (
                <span className="selected-badge">✓</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedFilters.length > 0 && (
        <div className="preview-section">
          <h2>📋 적용 미리보기</h2>
          <div className="slot-preview">
            {previewAssignment.map((filterId, index) => {
              const filter = filters.find(f => f.id === filterId);
              return (
                <div key={index} className="preview-slot">
                  <div className="slot-number">슬롯 {index + 1}</div>
                  <div className="slot-filter">
                    {filter ? `${filter.emoji} ${filter.name}` : '필터 없음'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="admin-actions">
        <button className="save-btn" onClick={handleSave}>
          💾 저장하기
        </button>
        <a href="/" className="back-btn">
          ← 포토부스로 돌아가기
        </a>
      </div>

      {saveMessage && (
        <div className="save-message">{saveMessage}</div>
      )}
    </div>
  );
}
