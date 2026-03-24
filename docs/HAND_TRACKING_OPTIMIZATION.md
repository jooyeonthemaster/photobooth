# 손 추적 인터랙티브 이펙트 — 리서치 & 최적화 가이드

## 현재 구현 상태

### 완료된 작업
- MediaPipe `@mediapipe/tasks-vision` 기반 손 추적
- Electron CSP 설정 (WASM 실행 허용)
- GPU→CPU 폴백, 모듈 싱글턴 패턴
- Lerp 보간 (7-8fps 추론 → 60fps 렌더링)
- 파티클 필드 (70개), 에너지 트레일, 제스처 감지/반응
- DebugHUD 실시간 상태 표시

### 현재 성능 설정값
| 항목 | 값 |
|------|-----|
| 추론 간격 | 150ms (~6.7Hz) |
| numHands | 4 |
| 비디오 해상도 | 1920x1080 |
| 스무딩 | Lerp 0.25 |
| detection confidence | 0.55 |
| tracking confidence | 0.45 |
| running mode | VIDEO (동기) |

---

## 성능 최적화 계획

### 문제점 분석
1. **1080p 비디오 → 추론**: 모델 내부적으로 224x224 리사이즈. 1080p GPU 텍스처 업로드가 불필요한 병목
2. **numHands: 4**: 1인 사용인데 4배 부하. 손 추가마다 ~50% 부하 증가
3. **단순 Lerp 0.25**: 속도 무관 일률 보간. 빠른 동작=지연, 느린 동작=떨림
4. **높은 confidence**: 트래킹 자주 lost → 비싼 palm detector 재실행
5. **150ms 추론 간격**: 빠른 손 동작 놓침

### 최적화 5단계

#### Step 1: numHands 4→2
- 파일: `app/hooks/useHandTracking.js`
- 추론 시간 ~2배 단축
- 양손 사용 가능 유지

#### Step 2: 추론 입력 해상도 낮추기
- 파일: `app/hooks/useHandTracking.js`
- 카메라 스트림은 표시용 1080p 유지
- OffscreenCanvas에 640x480으로 축소 후 추론에 전달
- GPU 텍스처 업로드 크기 1/6 감소

#### Step 3: One Euro Filter 도입 (Lerp 교체)
- 새 파일: `app/utils/oneEuroFilter.js`
- 수정: `app/hooks/useHandTracking.js`
- 느린 동작 = 강한 스무딩(떨림 제거), 빠른 동작 = 약한 스무딩(즉시 반응)
- 파라미터: `minCutoff = 1.0`, `beta = 0.007`
- 랜드마크 21개 x 좌표 3개 x 손 2개 = 126개 필터 인스턴스

#### Step 4: Confidence 임계값 낮추기
- detection: 0.55 → 0.5
- tracking: 0.45 → 0.3
- palm detector 재실행 빈도 감소, 트래킹 연속성 향상

#### Step 5: 추론 간격 150ms→80ms (~12fps)
- Step 1-2로 추론 자체가 빨라졌으므로 더 자주 실행 가능
- One Euro Filter가 12fps 입력 → 60fps 출력으로 부드럽게 보간

### 추가 고려사항 (선택)
- **LIVE_STREAM 모드**: VIDEO(동기) → LIVE_STREAM(비동기 콜백)으로 전환하면 메인 스레드 블로킹 해소. 코드 변경 큼
- **Web Worker + OffscreenCanvas**: 추론을 별도 스레드로 분리. GPU delegate가 Worker에서 안 될 수 있음
- **ImageBitmap 전달**: video 대신 `createImageBitmap(video)` 전달로 내부 canvas 복사 회피

### 퀄리티 영향 평가
| Step | 퀄리티 영향 |
|------|------------|
| numHands 4→2 | 없음 (1인 양손 충분) |
| 해상도 640x480 | 거의 없음 (모델이 224x224 사용) |
| One Euro Filter | 올라감 (적응형 스무딩) |
| Confidence 낮추기 | 미미한 오탐 가능성, 포토부스 환경에서 무시 가능 |
| 추론 간격 단축 | 올라감 (입력 갱신 빈도 증가) |

---

## 참고 GitHub 레포 모음

### 직접 참고용 (이펙트 + 트래킹)

| 레포 | 스타 | 핵심 | 기술스택 |
|------|------|------|----------|
| [dkpython7/Modern-Hand-Tracking-HUD](https://github.com/dkpython7/Modern-Hand-Tracking-HUD) | 4 | 사이버펑크 HUD + 파티클 트레일 + 리플 웨이브. 바닐라JS 3파일 | MediaPipe, Canvas, JS |
| [MeXiousArz/Hand-Tracked-Particle-Simulator](https://github.com/MeXiousArz/Hand-Tracked-Particle-Simulator) | 0 | 2만개 파티클 + Bloom 후처리. 비주얼 최고 | Three.js, GLSL, MediaPipe |
| [VoxDroid/VoxSpace](https://github.com/VoxDroid/VoxSpace) | 4 | React + Three.js, 제스처로 파티클 조작 | React 19, TypeScript, R3F, MediaPipe |
| [Krishna71340/Gesture-Particles](https://github.com/Krishna71340/Gesture-Particles) | 0 | 제스처별 파티클 모핑 + 카메라 자동 복구 | Three.js, GLSL, MediaPipe |
| [bhavishyasingla1/particle-system](https://github.com/bhavishyasingla1/particle-system) | 0 | 3000개 파티클 + 물리 기반 인터랙션 | Three.js, MediaPipe |

### 제스처 인식 참고

| 레포 | 스타 | 핵심 |
|------|------|------|
| [kinivi/hand-gesture-recognition-mediapipe](https://github.com/kinivi/hand-gesture-recognition-mediapipe) | 747 | MLP 분류기 기반 제스처 인식 |
| [LingDong-/handpose-facemesh-demos](https://github.com/LingDong-/handpose-facemesh-demos) | 193 | CMU 제작, p5.js/Three.js 템플릿 8종 |
| [collidingScopes/threejs-handtracking-101](https://github.com/collidingScopes/threejs-handtracking-101) | 143 | Three.js + MediaPipe 입문용 |

### 인터랙티브 설치 / 포토부스 참고

| 레포 | 스타 | 핵심 |
|------|------|------|
| [yemount/pose-animator](https://github.com/yemount/pose-animator) | 8,800 | 몸 움직임으로 2D 캐릭터 실시간 애니메이션 |
| [jeeliz/jeelizFaceFilter](https://github.com/jeeliz/jeelizFaceFilter) | 2,900 | 브라우저 실시간 얼굴 AR 필터 |
| [torinmb/mediapipe-touchdesigner](https://github.com/torinmb/mediapipe-touchdesigner) | 2,100 | 프로 설치미술용 MediaPipe 플러그인 |
| [tuqire/webcam-particles](https://github.com/tuqire/webcam-particles) | 19 | 웹캠 실루엣→파티클 변환 (Three.js GPGPU) |
| [PhotoboothProject/photobooth](https://github.com/PhotoboothProject/photobooth) | 546 | 셀프 포토부스 웹앱 (인쇄, 크로마키) |

---

## 렌더링 업그레이드 옵션 (향후)

현재 Canvas 2D → 더 높은 비주얼 퀄리티를 원할 경우:

| 방식 | 파티클 @60fps | 비주얼 | 미니PC 적합도 |
|------|-------------|--------|-------------|
| Canvas 2D (현재) | ~3,000 | 기본 | 최적 |
| PixiJS | ~15,000-30,000 | 좋음 (2D WebGL) | 좋음 |
| Three.js (가벼운 설정) | ~50,000+ | 훌륭함 (쉐이더) | 후처리 최소화 필요 |

- **PixiJS**: Canvas 2D 유지하면서 WebGL 배칭으로 5-10배 파티클 가능. 학습 비용 낮음
- **Three.js / R3F**: Points + BufferGeometry로 대량 파티클. Bloom 후처리는 미니PC에서 부담될 수 있음
- **추천**: 미니PC 기준 PixiJS가 가장 안전한 업그레이드 경로

---

## 대안 트래킹 기술 (참고)

| 방식 | 비용 | 특징 |
|------|------|------|
| MediaPipe (현재) | 무료 | 소프트웨어 한정 최선. 조명 민감 |
| TF.js hand-pose-detection | 무료 | 내부적으로 MediaPipe 사용, 큰 차이 없음 |
| Handtrack.js | 무료 | 바운딩박스만 (손가락 추적 불가), 매우 가벼움 |
| ONNX Runtime Web | 무료 | MediaPipe WASM 대비 소폭 성능 향상 가능 |

---

## 남은 작업

- [ ] 위 최적화 5단계 적용
- [ ] 구체적인 이펙트 디자인/종류 결정
- [ ] ScanningOverlay에도 이펙트 적용
- [ ] DebugHUD 제거 (프로덕션 전)
- [ ] electron-builder.config.js 패키징 설정
- [ ] 미니PC 실기 성능 테스트
- [ ] 렌더링 업그레이드 검토 (PixiJS or Three.js)
