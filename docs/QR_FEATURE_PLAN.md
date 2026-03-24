# QR 코드 사진 공유 기능 구현 계획서

> 작성일: 2026-03-09
> 상태: 미구현 (계획 완료)

## 개요

포토부스에서 사진 프린트 후, QR 코드를 화면에 표시하여 사용자가 스마트폰으로 스캔 → 사진을 확인/저장할 수 있는 기능.

---

## 기술 선택

| 항목 | 선택 | 이유 |
|------|------|------|
| 클라우드 스토리지 | **Supabase Storage** | `@supabase/supabase-js` 이미 설치됨, 추가 dependency 없음, 무료 1GB |
| QR 코드 생성 | **`qrcode` npm** | 경량(~50KB), toDataURL()로 바로 img 태그에 사용 |
| QR 스캔 결과 | **이미지 직접 열기** | Phase 1은 Supabase public URL로 바로 이미지 표시 |

### 왜 Supabase인가?
- `@supabase/supabase-js@^2.97.0` 이미 package.json에 있음 (AC'SCENT 연동용)
- 새 Supabase 프로젝트 생성하여 사진 전용 Storage로 사용
- 무료 티어: 1GB 저장소, 2GB/월 대역폭
- 하루 200장 x 500KB x 7일 보관 = ~700MB로 무료 한도 내

### 오프라인 안전 설계
- 인터넷 없으면 QR 기능만 자동 비활성화, 프린트는 정상 동작
- `isUploadAvailable()` 함수로 env 설정 여부 체크
- 업로드 실패 시 try/catch로 조용히 무시

---

## 구현 순서

### Step 1. Supabase 프로젝트 설정 (수동, 1회)

1. https://supabase.com 에서 새 프로젝트 생성 (AC'SCENT 프로젝트와 별도)
2. 대시보드 → **Storage** → 새 버킷 생성:
   - 이름: `photos`
   - Public: **ON**
   - Max file size: 5MB
   - Allowed MIME: `image/jpeg`
3. **Settings > API** 에서 Project URL과 anon key 복사
4. `.env.local` 에 추가:

```env
# QR 사진 공유용 Supabase (AC'SCENT과 별도 프로젝트)
NEXT_PUBLIC_SUPABASE_PHOTO_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PHOTO_ANON_KEY=eyJ...your-anon-key...
```

> `NEXT_PUBLIC_` 접두사 필수 — 클라이언트 사이드(React)에서 접근해야 하므로
> 기존 AC'SCENT 변수(`NEXT_PUBLIC_ACSCENT_SUPABASE_*`)와 이름 충돌 없음

---

### Step 2. 의존성 설치

```bash
npm install qrcode
```

---

### Step 3. 업로드 서비스 생성

**새 파일: `app/utils/uploadService.js`**

```javascript
// QR 코드 사진 공유용 Supabase 업로드 서비스
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_ANON_KEY;

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * 업로드 서비스 사용 가능 여부 체크
 * env가 설정되지 않았으면 false -> QR 기능 전체 비활성화
 */
export function isUploadAvailable() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * 사진을 Supabase Storage에 업로드하고 public URL 반환
 * @param {string} base64Image - Base64 JPEG (data:image/jpeg;base64,...)
 * @returns {Promise<{ photoId: string, url: string }>}
 */
export async function uploadPhoto(base64Image) {
  const client = getSupabase();
  if (!client) throw new Error('Upload service not configured');

  // UUID 기반 파일명 (추측 불가능)
  const photoId = crypto.randomUUID();
  const filename = `${photoId}.jpg`;

  // Base64 data URL -> Uint8Array 변환
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Supabase Storage 업로드
  const { error } = await client.storage
    .from('photos')
    .upload(filename, bytes.buffer, {
      contentType: 'image/jpeg',
      cacheControl: '604800', // 7일
      upsert: false,
    });

  if (error) {
    console.error('[UploadService] Upload failed:', error);
    throw error;
  }

  // Public URL 가져오기
  const { data: urlData } = client.storage
    .from('photos')
    .getPublicUrl(filename);

  console.log('[UploadService] Photo uploaded:', photoId);
  return { photoId, url: urlData.publicUrl };
}
```

---

### Step 4. QR 코드 컴포넌트 생성

**새 파일: `app/components/QRCodeDisplay.jsx`**

```javascript
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QR 코드 표시 컴포넌트
 * URL을 받아 QR 코드 이미지를 생성/렌더링
 */
export default function QRCodeDisplay({ url, size = 250 }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(dataUrl => setQrDataUrl(dataUrl))
      .catch(err => console.error('[QRCode] Generation failed:', err));
  }, [url, size]);

  if (!qrDataUrl) return null;

  return (
    <div className="qr-code-container">
      <img
        src={qrDataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="qr-code-image"
        draggable={false}
      />
    </div>
  );
}
```

---

### Step 5. page.js 수정

**파일: `app/page.js`**

#### (a) import 추가 (line 25 부근)
```javascript
import { isUploadAvailable, uploadPhoto } from './utils/uploadService';
```

#### (b) state 추가 (line 53 `printDone` 뒤)
```javascript
const [qrUrl, setQrUrl] = useState(null);
const [isUploading, setIsUploading] = useState(false);
```

#### (c) 업로드 함수 추가 (line 467 `handleStickerSkip` 뒤)
```javascript
// ========== QR 코드 업로드 ==========
const startPhotoUpload = async (image) => {
  if (!isUploadAvailable()) {
    console.log('[QR] Upload service not configured, skipping');
    return;
  }
  setIsUploading(true);
  try {
    const { url } = await uploadPhoto(image);
    setQrUrl(url);
    console.log('[QR] Photo uploaded, URL:', url);
  } catch (err) {
    console.warn('[QR] Upload failed (offline?):', err.message);
    // 조용히 실패 - 프린트는 정상 작동, QR만 안 보임
  } finally {
    setIsUploading(false);
  }
};
```

#### (d) handleStickerComplete 수정 (line 460)
```javascript
const handleStickerComplete = (newFinalImage) => {
  setFinalImage(newFinalImage);
  setStep('result');
  startPhotoUpload(newFinalImage);  // <- 추가
};
```

#### (e) handleStickerSkip 수정 (line 465)
```javascript
const handleStickerSkip = () => {
  setStep('result');
  startPhotoUpload(finalImage);  // <- 추가
};
```

#### (f) restart() 함수에 초기화 추가 (line 504)
```javascript
const restart = () => {
  // ... 기존 초기화 코드 ...
  setQrUrl(null);        // <- 추가
  setIsUploading(false); // <- 추가
};
```

#### (g) ResultScreen에 새 props 전달 (line 610)
```jsx
{step === 'result' && (
  <ResultScreen
    finalImage={finalImage}
    onDownload={downloadImage}
    onPrint={handlePrintImage}
    onRestart={restart}
    onBack={() => setStep('sticker')}
    isPrinting={isPrinting}
    printDone={printDone}
    qrUrl={qrUrl}              // <- 추가
    isUploading={isUploading}   // <- 추가
  />
)}
```

---

### Step 6. ResultScreen 수정

**파일: `app/components/ResultScreen.jsx`**

**레이아웃 원칙: 사진 미리보기가 항상 가장 크게, QR은 하단 버튼 영역에 배치**

```
+----------------------------------+
|                                  |
|                                  |
|    [사진 미리보기 - 크게]         |
|                                  |
|                                  |
+----------------------------------+
|  [← 뒤로]  [QR+안내]  [출력하기] |  <- 프린트 전
|  [← 뒤로]  [QR+안내]  [홈으로]   |  <- 프린트 후
+----------------------------------+
```

```javascript
'use client';

import { useState, useEffect } from 'react';
import QRCodeDisplay from './QRCodeDisplay';

export default function ResultScreen({
  finalImage,
  onDownload,
  onPrint,
  onRestart,
  onBack,
  isPrinting,
  printDone,
  qrUrl,
  isUploading,
}) {
  // 프린트 완료 후 30초 자동 홈 복귀 (키오스크 정체 방지)
  const [autoRestartCountdown, setAutoRestartCountdown] = useState(null);

  useEffect(() => {
    if (!printDone) return;
    setAutoRestartCountdown(30);
    const interval = setInterval(() => {
      setAutoRestartCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onRestart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [printDone, onRestart]);

  return (
    <div className="result-screen">
      {/* 사진 미리보기 - 항상 가장 크게 */}
      {finalImage && (
        <div className="final-image-container">
          <img src={finalImage} alt="final" className="final-image" />
        </div>
      )}

      {/* 하단 액션 영역: 버튼 + QR 코드 */}
      <div className="result-actions">
        <button
          className="back-btn"
          onClick={printDone ? undefined : onBack}
          disabled={isPrinting || printDone}
          style={printDone ? { visibility: 'hidden' } : {}}
        >
          ← 뒤로
        </button>

        {/* QR 코드 영역 (버튼 사이 중앙) */}
        {qrUrl ? (
          <div className="qr-section">
            <QRCodeDisplay url={qrUrl} size={150} />
            <p className="qr-hint">스캔하여 저장</p>
          </div>
        ) : isUploading ? (
          <div className="qr-section">
            <div className="qr-loading-small">
              <div className="spinner-small"></div>
            </div>
            <p className="qr-hint">QR 준비 중...</p>
          </div>
        ) : null}

        {printDone ? (
          <button className="home-btn" onClick={onRestart}>
            홈으로 가기
            {autoRestartCountdown !== null && (
              <span className="auto-restart-timer"> ({autoRestartCountdown}초)</span>
            )}
          </button>
        ) : (
          <button
            className="print-btn"
            onClick={onPrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <><div className="spinner"></div>출력 중...</>
            ) : '출력하기'}
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Step 7. CSS 추가

**파일: `app/page.css`** (기존 result-actions 스타일 뒤에 추가)

```css
/* ========== QR 코드 (하단 버튼 영역에 배치) ========== */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.qr-code-container {
  background: white;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.qr-code-image {
  display: block;
  border-radius: 4px;
}

.qr-hint {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

.qr-loading-small {
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.auto-restart-timer {
  font-size: 0.85em;
  opacity: 0.7;
}
```

> **참고:** 기존 `.result-actions`가 `display: flex; justify-content: center; gap: ...`
> 스타일이면 QR 섹션이 버튼 사이에 자연스럽게 배치됨.
> 필요 시 `align-items: center`를 추가하여 세로 정렬 맞출 것.

---

## 데이터 흐름도

```
스티커 완료/스킵
  |
  v
startPhotoUpload(finalImage)  <-- 백그라운드 실행 (2~5초)
  |                                |
  v                                v
setStep('result')           base64 -> Uint8Array
  |                                |
  v                                v
ResultScreen 표시            Supabase Storage 업로드
[사진 크게] + [뒤로|QR로딩|출력]    |
  |                                v
  v                         setQrUrl(publicUrl)
QR 로딩 -> QR 코드 표시             |
(하단 버튼 사이에 작게)              v
  |                         QR 코드 준비 완료
  v
출력 버튼 클릭
  |
  v
프린트 (5~15초)
  |
  v
printDone = true
  |
  v
[사진 크게] + [뒤로(숨김)|QR|홈으로(30초)]
  |
  v
30초 후 자동 홈 복귀
```

---

## 수정 파일 요약

| 파일 | 작업 |
|------|------|
| `package.json` | `qrcode` 의존성 추가 |
| `.env.local` | Supabase Photo 프로젝트 credentials 추가 |
| `app/utils/uploadService.js` | **새 파일** -- Supabase 업로드 서비스 |
| `app/components/QRCodeDisplay.jsx` | **새 파일** -- QR 코드 표시 컴포넌트 |
| `app/page.js` | state 2개 추가, 업로드 트리거, restart 초기화, props 전달 |
| `app/components/ResultScreen.jsx` | 프린트 후 QR 코드 화면으로 변경 |
| `app/page.css` | QR 관련 CSS 스타일 추가 |

---

## 주의사항

### Supabase 무료 티어 한도
- 저장소 1GB, 대역폭 2GB/월
- 대역폭 초과 시: 업로드 해상도를 줄여서 대응 (1200x1800, quality 0.85)

### Electron 빌드 시 환경변수
- `NEXT_PUBLIC_` 접두사 변수는 `next build` 시점에 번들에 포함됨
- `.env.local` 파일이 빌드 시 프로젝트 루트에 있어야 함
- `electron-builder.config.js` 수정 불필요

### 보안
- UUID 기반 파일명으로 추측 불가능 (128bit 랜덤)
- Public 버킷이지만 URL을 모르면 접근 불가
- 사용자 인증 불필요 (QR 가진 사람 = 사진 찍은 본인)

---

## Phase 2 계획 (추후 구현)

### 전용 뷰어 페이지
- `app/view/[id]/page.js` -- 브랜딩된 모바일 다운로드 페이지
- Vercel에 배포, QR URL을 직접 이미지 대신 뷰어로 변경
- "NEANDER LAB AI PHOTOBOOTH" 브랜딩 + "사진 저장하기" 버튼

### 자동 삭제
- Supabase Edge Function (cron) -> 7일 지난 사진 자동 삭제
- 뷰어 페이지에 "이 사진은 7일 후 삭제됩니다" 안내

---

## 검증 체크리스트

- [ ] Supabase 프로젝트 생성 & `photos` 버킷 (Public) 설정
- [ ] `.env.local`에 credentials 추가
- [ ] `npm install qrcode` 실행
- [ ] `electron:dev`로 실행하여 전체 플로우 테스트
- [ ] 사진 촬영 -> 스티커 -> 결과 화면에서 QR 코드 표시 확인
- [ ] 스마트폰으로 QR 스캔 -> 사진이 브라우저에서 열리는지 확인
- [ ] 인터넷 끊고 테스트 -> 프린트 정상, QR만 안 보이는지 확인
- [ ] Supabase 대시보드에서 업로드된 사진 확인
