'use client';

import { useState, useEffect, useCallback } from 'react';
import './photos.css';

const PAGE_SIZE = 24;

// ── KST 날짜 유틸 ──────────────────────────────────────────────
// "YYYY-MM-DD" (KST) → UTC ISO. end=true면 그날 끝(다음날 0시) 반환
function kstDateToUtcIso(dateStr, end = false) {
  if (!dateStr) return null;
  const base = new Date(`${dateStr}T00:00:00+09:00`).getTime();
  return new Date(end ? base + 86400000 : base).toISOString();
}

const fmtKst = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function PhotosAdminPage() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  const [stats, setStats] = useState(null);
  const [statTab, setStatTab] = useState('daily'); // daily | weekly | monthly

  // 세션 동안 비번 유지
  useEffect(() => {
    const saved = sessionStorage.getItem('photosAdminPw');
    if (saved) {
      setPw(saved);
      setAuthed(true);
    }
  }, []);

  const apiGet = useCallback(
    async (params, curPw) => {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/admin/photos?${qs}`, {
        headers: { 'x-admin-pw': curPw },
      });
      const data = await res.json();
      if (!res.ok) {
        const err = new Error(data.message || '요청 실패');
        err.status = res.status;
        throw err;
      }
      return data;
    },
    []
  );

  // 목록 조회 (reset=true면 처음부터)
  const loadList = useCallback(
    async (reset, curPw) => {
      const usePw = curPw ?? pw;
      const nextOffset = reset ? 0 : offset;
      setLoading(true);
      setListError('');
      try {
        const data = await apiGet(
          {
            mode: 'list',
            offset: nextOffset,
            limit: PAGE_SIZE,
            ...(from ? { after: kstDateToUtcIso(from) } : {}),
            ...(to ? { before: kstDateToUtcIso(to, true) } : {}),
          },
          usePw
        );
        setTotal(data.total);
        setOffset(nextOffset + data.photos.length);
        setPhotos((prev) => (reset ? data.photos : [...prev, ...data.photos]));
      } catch (e) {
        if (e.status === 401) {
          setAuthed(false);
          sessionStorage.removeItem('photosAdminPw');
          setAuthError('비밀번호가 틀렸습니다.');
        } else {
          setListError(e.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [apiGet, from, to, offset, pw]
  );

  const loadStats = useCallback(
    async (curPw) => {
      try {
        const data = await apiGet({ mode: 'stats' }, curPw ?? pw);
        setStats(data);
      } catch (e) {
        if (e.status === 401) {
          setAuthed(false);
          sessionStorage.removeItem('photosAdminPw');
        }
      }
    },
    [apiGet, pw]
  );

  // 인증되면 첫 로딩
  useEffect(() => {
    if (authed) {
      loadList(true, pw);
      loadStats(pw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await apiGet({ mode: 'stats' }, pw); // 비번 검증 겸 stats 프리로드
      sessionStorage.setItem('photosAdminPw', pw);
      setAuthed(true);
    } catch (err) {
      setAuthError(err.status === 401 ? '비밀번호가 틀렸습니다.' : err.message);
    }
  };

  const handleSearch = () => loadList(true, pw);
  const resetRange = () => {
    setFrom('');
    setTo('');
  };

  // 원본 다운로드 (cross-origin이라 blob으로 받아서 저장)
  const downloadPhoto = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, '_blank'); // 실패 시 새 탭으로
    }
  };

  // ── 로그인 화면 ──
  if (!authed) {
    return (
      <div className="ph-container">
        <form className="ph-login" onSubmit={handleLogin}>
          <h1>🔒 사진 관리</h1>
          <p>관리자 비밀번호를 입력하세요</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            autoFocus
          />
          <button type="submit">입장</button>
          {authError && <div className="ph-error">{authError}</div>}
          <a href="/admin" className="ph-link">← 필터 설정으로</a>
        </form>
      </div>
    );
  }

  const statRows = stats ? stats[statTab] || [] : [];
  const maxCount = statRows.reduce((m, r) => Math.max(m, r.count), 0) || 1;

  // ── 메인 ──
  return (
    <div className="ph-container">
      <div className="ph-header">
        <h1>📸 QR 사진 관리</h1>
        <p>업로드 시간순 정렬 · 재출력용 다운로드 · 사용량</p>
      </div>

      {/* 사용량 */}
      <section className="ph-card">
        <div className="ph-card-head">
          <h2>📊 사용량</h2>
          {stats && (
            <span className="ph-total">
              총 {stats.total.toLocaleString()}장 · {fmtSize(stats.totalBytes)}
            </span>
          )}
        </div>
        <div className="ph-tabs">
          {[
            ['daily', '일간'],
            ['weekly', '주간'],
            ['monthly', '월간'],
          ].map(([k, label]) => (
            <button
              key={k}
              className={statTab === k ? 'active' : ''}
              onClick={() => setStatTab(k)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ph-stat-list">
          {statRows.length === 0 && <div className="ph-muted">데이터 없음</div>}
          {statRows.map((r) => (
            <div className="ph-stat-row" key={r.key}>
              <span className="ph-stat-key">{r.key}</span>
              <div className="ph-bar-wrap">
                <div
                  className="ph-bar"
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="ph-stat-count">
                {r.count}장 · {fmtSize(r.bytes)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 날짜 필터 */}
      <section className="ph-card ph-filter">
        <div className="ph-filter-row">
          <label>
            시작일
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            종료일
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="ph-btn" onClick={handleSearch} disabled={loading}>
            🔍 조회
          </button>
          <button className="ph-btn ghost" onClick={() => { resetRange(); }}>
            초기화
          </button>
        </div>
        <div className="ph-result-info">
          {loading ? '불러오는 중…' : `조건에 맞는 사진 ${total.toLocaleString()}장`}
          {' '}(표시 {photos.length}장)
        </div>
        {listError && <div className="ph-error">{listError}</div>}
      </section>

      {/* 갤러리 */}
      <section className="ph-grid">
        {photos.map((p) => (
          <div className="ph-tile" key={p.name}>
            <a href={p.url} target="_blank" rel="noreferrer" className="ph-thumb">
              <img src={p.url} alt={p.name} loading="lazy" />
            </a>
            <div className="ph-meta">
              <div className="ph-time">{fmtKst.format(new Date(p.createdAt))}</div>
              <div className="ph-size">{fmtSize(p.size)}</div>
            </div>
            <button className="ph-dl" onClick={() => downloadPhoto(p.url, p.name)}>
              ⬇ 다운로드
            </button>
          </div>
        ))}
      </section>

      {!loading && photos.length < total && (
        <div className="ph-more">
          <button className="ph-btn" onClick={() => loadList(false, pw)}>
            더 보기 ({photos.length} / {total})
          </button>
        </div>
      )}

      <div className="ph-footer">
        <a href="/admin" className="ph-link">← 필터 설정</a>
        <a href="/" className="ph-link">← 포토부스</a>
      </div>
    </div>
  );
}
