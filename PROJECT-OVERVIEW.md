# NEANDER LAB AI Photobooth - 프로젝트 종합 문서

> **마지막 업데이트:** 2026-03-15
> **버전:** 1.0.0
> **패키지명:** 20251005photo

---

## 1. 프로젝트 개요

Canon EOS DSLR 카메라와 연동되는 AI 기반 4컷 포토부스 키오스크 애플리케이션.

### 기술 스택
| 영역 | 기술 |
|------|------|
| 데스크톱 | Electron 40 (Windows 키오스크) |
| 웹 프레임워크 | Next.js 15 (Standalone) + React 19 |
| 카메라 | Canon EDSDK (koffi FFI 바인딩), 웹캠 폴백 |
| AI 필터 | Google Gemini 3 Pro Image (18종), fal.ai Seedream 5.0 Lite (PIN 모드) |
| 이미지 합성 | Node.js Canvas (2400x3600 SVG 프레임) |
| 인쇄 | C# DnpPrinter.exe → DNP DP-DS620 |
| 공유 | Supabase Storage + QR 코드 |
| 스티커 | React Konva (드래그/회전/리사이즈) |

### 2개 운영 모드
- **PIN 모드 (AC'SCENT):** PIN 입력 → 참조 이미지 조회 → 3장 촬영 → 1장 선택 → Seedream 4컷 그리드 자동 생성
- **일반 모드:** 6장 촬영 → 4장 선택 → Admin 설정 필터 적용 (Gemini)

---

## 2. 디렉토리 구조

```
ai photo booth/
├── app/                               # Next.js App Router
│   ├── page.js                        # 메인 페이지 (상태관리, 화면전환) ~410줄
│   ├── layout.js                      # Root 레이아웃
│   ├── admin/page.js                  # Admin 필터 설정 페이지
│   │
│   ├── api/                           # API 라우트
│   │   ├── apply-filter/
│   │   │   ├── route.js               # AI 필터 적용 (Gemini/Seedream)
│   │   │   ├── seedream.js            # PIN 모드 Seedream 프롬프트 빌더
│   │   │   ├── gridPrompt.js          # 그리드 모드 프롬프트 래핑
│   │   │   ├── utils.js               # fetchImageAsBase64 등
│   │   │   └── prompts/
│   │   │       ├── index.js           # 프롬프트 통합 export
│   │   │       ├── beauty.js          # 뷰티 필터 (K-POP, 보그, 인스타, 드래그퀸, 아기)
│   │   │       ├── art.js             # 아트 필터 (르네상스, 팝아트, 유화, 픽사, 애니메)
│   │   │       ├── fantasy.js         # 판타지 필터 (인어, 크리스탈, 슈퍼히어로, 사이버펑크, 외계인)
│   │   │       └── horror.js          # 공포 필터 (좀비, 뱀파이어, 디즈니악당, 광대, 노인)
│   │   ├── combine/
│   │   │   └── route.js               # 4컷 Canvas 합성 (2400x3600)
│   │   ├── pin-lookup/
│   │   │   └── route.js               # AC'SCENT PIN 조회 (Supabase)
│   │   ├── capture/
│   │   │   └── route.js               # 사진 저장 (레거시)
│   │   └── photos/
│   │       └── route.js               # 사진 목록 조회
│   │
│   ├── components/                    # React 컴포넌트
│   │   ├── IntroScreen.jsx            # 시작 화면 (로봇 캐릭터)
│   │   ├── PinScreen.jsx              # PIN 입력 + 프로필 선택
│   │   ├── ReadyScreen.jsx            # 카메라 준비 + 필터 안내 모달
│   │   ├── ShootingScreen.jsx         # 촬영 중 (카운트다운, 진행률)
│   │   ├── SelectScreen.jsx           # 사진 선택 (6→4장 또는 3→1장)
│   │   ├── EditScreen.jsx             # 필터 편집 (슬롯별 필터 변경)
│   │   ├── StickerScreen.jsx          # 스티커 배치 (Konva 캔버스)
│   │   ├── ResultScreen.jsx           # 최종 결과 (프린트/QR/다운로드)
│   │   ├── QRCodeDisplay.jsx          # QR 코드 표시
│   │   ├── CameraView.jsx             # 카메라 렌더링 (EDSDK/웹캠)
│   │   ├── FilterTestScreen.jsx       # 필터 테스트 (개발용)
│   │   └── PrintSuccessModal.jsx      # 프린트 성공 모달
│   │
│   ├── hooks/                         # 커스텀 훅
│   │   ├── useCamera.js               # 카메라 초기화 (EDSDK→웹캠 폴백)
│   │   └── useShooting.js             # 연속 촬영 시퀀스
│   │
│   ├── services/
│   │   └── photoProcessingService.js  # 필터 적용 오케스트레이션 (PIN/그리드/개별 분기)
│   │
│   ├── utils/
│   │   ├── apiService.js              # API 호출 (필터, 합성, 그리드)
│   │   ├── imageProcessing.js         # 이미지 캡처, 크롭 (1600x2400)
│   │   └── uploadService.js           # Supabase 업로드 (QR 공유)
│   │
│   ├── constants/
│   │   ├── filters.js                 # 24개 AI 필터 정의
│   │   ├── frames.js                  # 프레임 옵션
│   │   ├── stickers.js                # 스티커 메타데이터
│   │   ├── camera.js                  # 웹캠 제약 조건
│   │   └── filterMessages.js          # 필터 안내 메시지
│   │
│   └── styles/                        # CSS
│       ├── index.css                  # 통합 import
│       ├── global.css                 # 전역 스타일
│       ├── animations.css             # @keyframes
│       ├── intro.css
│       ├── pin/                       # PIN 화면 (3파일)
│       ├── ready.css
│       ├── shooting.css
│       ├── select.css
│       ├── edit.css
│       ├── sticker.css
│       ├── result.css
│       ├── frame-selection.css
│       ├── filter-modal.css
│       ├── filter-selection.css
│       └── print-modal.css
│
├── electron/                          # Electron 데스크톱
│   ├── main.js                        # 메인 프로세스 (~291줄)
│   ├── preload.js                     # Context Bridge IPC
│   ├── launch.js                      # Electron 실행기
│   ├── camera-service.js              # 카메라 오케스트레이터 (EDSDK↔웹캠)
│   ├── printer-service.js             # 프린터 서비스 (~172줄)
│   ├── kiosk-guard.js                 # 키오스크 보안 (단축키 차단)
│   └── edsdk/
│       ├── camera-service.js          # EDSDK 구현 (초기화/Live View/캡처)
│       └── bindings.js                # koffi FFI 바인딩 (DLL 함수/구조체)
│
├── printer-service/                   # C# 프린터 드라이버
│   ├── DnpPrinter.cs                  # DNP DP-DS620 연동
│   └── DnpPrinter.exe                 # 컴파일된 실행 파일
│
├── edsdk-dlls/                        # Canon EDSDK DLL (EDSDK64.dll 등)
│
├── public/
│   ├── frame/
│   │   ├── NEANDER LAB AI PHOTOBOOTH.svg       # 검은색 프레임 (2400x3600)
│   │   └── NEANDER LAB AI PHOTOBOOTH WHITE.svg # 흰색 프레임
│   └── stickers/                      # 스티커 PNG 파일
│
├── scripts/
│   └── generate-stickers.js           # 네온 스티커 자동 생성
│
├── next.config.js                     # output: 'standalone'
├── electron-builder.config.js         # Windows DIR 빌드 설정
├── copy-static.js                     # 빌드 후 파일 복사 스크립트
├── server.js                          # Next.js Standalone 실행기
├── package.json
├── .env.local                         # API 키 (Gemini, fal.ai, Supabase)
└── CODE-STRUCTURE-GUIDE.md            # 코드 구조화 규칙
```

---

## 3. 사용자 플로우

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌───────────┐
│  Intro   │────▶│   PIN   │────▶│  Ready  │────▶│ Shooting  │
│ (시작)   │     │(인증/스킵)│     │(카메라)  │     │(3~6장촬영) │
└─────────┘     └─────────┘     └─────────┘     └───────────┘
                                                       │
     ┌──────────┐     ┌─────────┐     ┌─────────┐     │
     │  Result  │◀────│ Sticker │◀────│  Edit   │◀────┘
     │(프린트/QR)│     │(스티커)  │     │(필터편집) │  Select
     └──────────┘     └─────────┘     └─────────┘  (사진선택)
```

### PIN 모드 (AC'SCENT)
1. PIN 4자리 입력 → Supabase에서 프로필 조회
2. 프로필 선택 (향수 성향 + 참조 이미지)
3. **3장** 촬영 → **1장** 선택
4. Seedream이 참조 이미지 스타일로 **4컷 그리드 자동 생성**
5. 프레임에 고객 이름 삽입

### 일반 모드
1. PIN 건너뛰기
2. **6장** 촬영 → **4장** 선택
3. Admin 설정 필터 적용 (Gemini)
   - 그리드 모드: 4장 같은 필터 → 한 번에 처리 (효율적)
   - 개별 모드: 슬롯별 다른 필터 → 각각 처리

---

## 4. 핵심 파일별 역할

| 파일 | 역할 |
|------|------|
| `app/page.js` | **메인 오케스트레이터** — 전체 상태 관리, 8개 화면 전환, 핸들러 정의 |
| `app/hooks/useCamera.js` | EDSDK 모드 확인 → 실패 시 웹캠 폴백 (해상도 점진적 완화) |
| `app/hooks/useShooting.js` | 3초 카운트다운 → 촬영 → 2초 대기 → 반복 (totalShots까지) |
| `app/services/photoProcessingService.js` | PIN/그리드/개별 필터 분기 처리, 실패 시 폴백 |
| `app/utils/apiService.js` | API 호출 래퍼 (createPhotoGrid, splitPhotoGrid, applyFilter, combinePhotos) |
| `app/utils/imageProcessing.js` | 웹캠/EDSDK 이미지 → 2:3 크롭 → 1600x2400 PNG |
| `app/utils/uploadService.js` | Supabase Storage 업로드 (UUID 파일명, 7일 캐시) |
| `app/api/apply-filter/route.js` | Gemini 3 Pro Image + fal.ai Seedream 호출, 재시도 2회 |
| `app/api/apply-filter/seedream.js` | PIN 모드 프롬프트 (4카테고리 랜덤 포즈 생성) |
| `app/api/apply-filter/gridPrompt.js` | 그리드 2x2 프롬프트 래핑 (일관된 스타일 + 다른 포즈) |
| `app/api/combine/route.js` | Canvas 2400x3600 + SVG 프레임 + 4컷 Cover 배치 + JPEG Q=0.98 |
| `app/api/pin-lookup/route.js` | AC'SCENT Supabase에서 PIN 기반 프로필 조회 |
| `electron/main.js` | 키오스크 모드, Next.js Standalone 서버 시작, IPC 설정 |
| `electron/preload.js` | Context Bridge (camera, printer API 노출) |
| `electron/camera-service.js` | EDSDK↔웹캠 오케스트레이터 (모드 자동 전환) |
| `electron/edsdk/camera-service.js` | EDSDK 초기화, Live View 50ms 폴링, 셔터+다운로드 |
| `electron/edsdk/bindings.js` | koffi FFI — EDSDK64.dll 함수/구조체 바인딩 |
| `electron/printer-service.js` | DnpPrinter.exe 실행, 임시 파일 관리, 타임아웃 30초 |
| `electron/kiosk-guard.js` | 단축키 차단 (Alt+Tab 등), 관리자 탈출 (Ctrl+Shift+Alt+Esc) |
| `printer-service/DnpPrinter.cs` | C# — DNP DP-DS620 검출, 이미지 회전, 고품질 인쇄 |
| `app/admin/page.js` | 관리자 페이지 — 슬롯별 필터 선택, localStorage 저장 |

---

## 5. API 엔드포인트

### `POST /api/apply-filter`
AI 필터 적용 (핵심 API)
```
요청: { image, filterType, mode?, referenceImageUrl?, customerData? }
응답: { success, image (base64), filterName, message }
```
- `filterType='acscent-composite'` + customerData → **Seedream** (PIN 모드)
- 그 외 → **Gemini 3 Pro Image** (일반 모드)
- `mode='grid'` → 2x2 그리드 일괄 처리
- 재시도 2회, 2초 대기

### `GET /api/apply-filter`
필터 목록 조회 (18개)

### `POST /api/combine`
4컷 이미지 합성
```
요청: { photos[4], frame, filterType?, customText?, frameVariant? }
응답: { success, path (base64 JPEG), filename }
```
- Canvas 2400x3600 (600DPI 4x6 inch)
- SVG 프레임 오버레이 (`{{CUSTOM_TEXT}}`, `{{CURRENT_DATE}}` 치환)
- 4개 영역 Cover 배치: (150,200), (1250,200), (150,1650), (1250,1650) — 각 1000x1350

### `POST /api/pin-lookup`
AC'SCENT PIN 조회
```
요청: { pin: "123456" }
응답: { success, count, data: [{ id, userImageUrl, idolName, perfumeName, ... }] }
```

---

## 6. AI 모델 연동

### Google Gemini 3 Pro Image
- **용도:** 일반 필터 18종
- **모델:** `gemini-3-pro-image-preview`
- **출력:** `responseModalities: ['TEXT', 'IMAGE']`
- **해상도:** 그리드 4K / 개별 2K
- **재시도:** 최대 2회 (2초 대기)

### fal.ai Seedream 5.0 Lite
- **용도:** PIN 모드 4컷 그리드 생성
- **모델:** `fal-ai/bytedance/seedream/v5/lite/edit`
- **입력:** 사용자 이미지 + AC'SCENT 참조 이미지
- **포즈:** 4카테고리(클로즈업/상반신/전신/유니크) 랜덤 선택
- **해상도:** 그리드 auto_3K / 싱글 auto_2K

### 18개 필터 목록
| 카테고리 | 필터 |
|---------|------|
| Beauty | K-POP 아이돌, 보그 매거진, 인스타 필터, 드래그퀸, 아기 |
| Art | 르네상스 유화, 팝아트, 인상주의 유화, 픽사 3D, 애니메이션 |
| Fantasy | 인어공주, 크리스탈, 슈퍼히어로, 사이버펑크, 외계인 |
| Horror | 좀비, 뱀파이어, 디즈니 악당, 서커스 광대, 80년 후 나 |

---

## 7. 이미지 처리 파이프라인

```
카메라 (EDSDK 또는 웹캠)
  ↓
cropToPortrait() → 1600x2400 PNG (2:3 비율, 5% 트림)
  ↓
[PIN 모드]                              [일반 모드]
1장 선택                                4장 선택
  ↓                                       ↓
applyFilterGrid()                     createPhotoGrid() → 2x2 그리드 (2400x3600)
  (Seedream 4컷 자동)                       ↓
  ↓                                    applyFilterGrid() or applyFilter()
splitPhotoGrid()                         (Gemini 필터)
  (3% 트림)                                ↓
  ↓                                    splitPhotoGrid() (그리드일 때)
4장 개별 이미지                             ↓
  ↓                                    4장 필터 적용 이미지
  └───────────────┬───────────────────────┘
                  ↓
          combinePhotos()
          Canvas 2400x3600 + SVG 프레임
                  ↓
          StickerScreen (Konva)
          고해상도 내보내기 (2400x3600, JPEG Q=0.98)
                  ↓
          최종 이미지
          ├── 프린트 (DnpPrinter.exe)
          ├── Supabase 업로드 → QR 코드
          └── 다운로드 (lifefourcut_timestamp.jpg)
```

---

## 8. 환경변수 (.env.local)

```env
# Google Gemini API
GOOGLE_GEMINI_API_KEY=

# fal.ai (ByteDance Seedream)
FAL_KEY=

# AC'SCENT Supabase (읽기 전용 - PIN 프로필 조회)
NEXT_PUBLIC_ACSCENT_SUPABASE_URL=
NEXT_PUBLIC_ACSCENT_SUPABASE_ANON_KEY=

# QR 사진 공유용 Supabase (별도 프로젝트)
NEXT_PUBLIC_SUPABASE_PHOTO_URL=
NEXT_PUBLIC_SUPABASE_PHOTO_ANON_KEY=
```

---

## 9. 빌드/실행 명령어

```bash
# 개발 모드 (Next.js + Electron 동시 실행)
npm run electron:dev

# Next.js만 개발 실행
npm run dev

# 프로덕션 빌드 (Next.js Build → 파일 복사 → Electron 패키징)
npm run electron:build

# Electron 직접 실행
npm run electron:start
```

### 빌드 프로세스
1. `next build` → `.next/standalone` 생성
2. `node copy-static.js` → static, public, printer-service, edsdk-dlls, .env.local 복사
3. `electron-builder` → `dist/win-unpacked/` 포터블 앱 생성

### 배포 구조
```
dist/win-unpacked/
├── NEANDER LAB Photobooth.exe
└── resources/
    ├── app.asar
    └── standalone/
        ├── server.js
        ├── .next/
        ├── public/
        ├── printer-service/DnpPrinter.exe
        └── edsdk-dlls/EDSDK64.dll
```

---

## 10. 주요 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| next | ^15.5.12 | React SSR 프레임워크 |
| react / react-dom | ^19.2.0 | UI 라이브러리 |
| electron | ^40.6.0 | 데스크톱 앱 |
| @google/genai | ^1.22.0 | Gemini API |
| @fal-ai/client | ^1.9.4 | Seedream API |
| @supabase/supabase-js | ^2.97.0 | Supabase 클라이언트 |
| canvas | ^3.2.0 | Node.js Canvas (서버 합성) |
| koffi | ^2.15.1 | Canon EDSDK FFI 바인딩 |
| konva / react-konva | ^10.2.0 / ^19.2.3 | 스티커 캔버스 |
| qrcode | ^1.5.4 | QR 코드 생성 |
| react-webcam | ^7.2.0 | 웹캠 캡처 |
| electron-builder | ^25.0.0 | Electron 패키징 |

---

## 11. IPC 통신 구조

### Electron ↔ React (preload.js Context Bridge)

```
window.electronAPI = {
  app: { isElectron: true },
  camera: {
    getMode()          → 'edsdk' | 'webcam'
    capture()          → base64 이미지 (EDSDK 셔터)
    getStatus()        → { mode, isConnected, isLiveViewActive, cameraModel }
    onEvfFrame(cb)     → Live View JPEG 스트림 (50ms 간격)
    offEvfFrame()
    onModeChanged(cb)  → 모드 변경 알림
  },
  printImage(base64)   → DnpPrinter.exe 실행
  checkPrinter()       → 프린터 상태 확인
}
```

### EDSDK 호출 흐름
```
React → IPC → CameraService → EdsdkCameraService → EDSDK64.dll → Canon EOS
```

### EDSDK 초기화 순서
1. `EdsInitializeSDK()`
2. `EdsGetCameraList()` → `EdsGetChildCount()`
3. `EdsGetChildAtIndex(0)` → `EdsGetDeviceInfo()`
4. 이벤트 핸들러 등록
5. `EdsOpenSession()`
6. `EdsSetPropertyData(SaveTo_Host)` — PC 저장
7. `EdsSetCapacity()` — 가짜 디스크 용량
8. 60초 간격 KeepAlive

---

## 12. 키오스크 보안

### 차단 항목
- `F1~F12`, `Ctrl+R/W/T/N/Shift+I`
- `Alt+Tab`, `Alt+F4`
- 우클릭, 텍스트 선택, 드래그
- Ctrl+스크롤 줌, 더블탭 줌, 핀치 줌
- 외부 URL 네비게이션

### 관리자 탈출
- `Ctrl + Shift + Alt + Escape` → DevTools 열기 또는 앱 종료

### 자동 복구
- 창 blur 시 100ms 후 자동 포커스 + alwaysOnTop
- 권한 자동 승인 (media, mediaKeySystem, display-capture)

---

## 13. 상태 관리 (page.js)

```javascript
// 화면 전환
step: 'intro' | 'pin' | 'ready' | 'shooting' | 'select' | 'edit' | 'sticker' | 'result'

// 사진 데이터
capturedPhotos: []                    // 촬영 원본 (3~6장)
selectedSlots: [null,null,null,null]  // 4개 슬롯 배치
filteredPhotos: []                    // AI 필터 적용 후
previewComposite: null               // 합성 미리보기
finalImage: null                     // 최종 이미지

// 필터
selectedFilter: 'kpop-idol'
slotFilters: ['none','none','none','none']
editingSlotIndex: null
isApplyingFilter: boolean

// PIN 모드
customerData: null                   // { idolName, perfumeName, userImageUrl }
referenceImageUrl: null
isPinMode: !!(referenceImageUrl && customerData)
totalShots: isPinMode ? 3 : 6

// 스티커/프레임
placedStickers: []
frameVariant: 'black' | 'white'

// 인쇄
isPrinting, printDone, showPrintSuccess, qrUrl
```

---

## 14. 에러 처리 전략

| 상황 | 처리 |
|------|------|
| EDSDK 카메라 연결 실패 | 웹캠으로 자동 폴백 |
| 웹캠 고해상도 실패 | 기본 해상도 → 개별 카메라 순차 시도 |
| Gemini API 실패 | 2초 대기 후 재시도 (최대 2회) → 502 반환 |
| 그리드 필터 실패 | 개별 모드로 자동 전환 |
| 개별 필터 실패 | 원본 사진 사용 |
| 필터 설정 없음 | alert 표시 + Admin 페이지 안내 |
| Supabase 업로드 실패 | 조용히 무시 (프린트는 정상) |
| 프린터 타임아웃 | 30초 후 에러 메시지 |
| 촬영 실패 | 1초 대기 후 1회 재시도 |

---

## 15. 4컷 합성 좌표 (2400x3600)

```
┌───────────────────────────────────┐
│           SVG 프레임               │
│  ┌──────────┐  ┌──────────┐      │
│  │ (150,200)│  │(1250,200)│      │
│  │ 1000x1350│  │ 1000x1350│      │
│  │  사진 1   │  │  사진 2   │      │
│  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐      │
│  │(150,1650)│  │(1250,1650)│     │
│  │ 1000x1350│  │ 1000x1350│      │
│  │  사진 3   │  │  사진 4   │      │
│  └──────────┘  └──────────┘      │
│         NEANDER LAB               │
│     {{CUSTOM_TEXT}}               │
│     {{CURRENT_DATE}}              │
└───────────────────────────────────┘
```

---

## 16. 코드 구조 규칙 (CODE-STRUCTURE-GUIDE.md 요약)

- 모든 파일 **500줄 이내**
- 분리 순서: 타입 → 상수 → 유틸 → API → 훅 → 컴포넌트
- 미사용 코드 즉시 삭제
- Import 순서: React → 외부 → 타입 → 상수 → 유틸 → 훅 → 컴포넌트
