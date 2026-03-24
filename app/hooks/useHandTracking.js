'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// 성능 설정 (미니PC 대응)
const DETECTION_INTERVAL_MS = 150;
const MAX_HANDS = 4;
const MIN_DETECTION_CONFIDENCE = 0.55;
const MIN_TRACKING_CONFIDENCE = 0.45;
const FPS_SAMPLE_SIZE = 30;
const LOW_FPS_THRESHOLD = 4;
const CRITICAL_FPS_THRESHOLD = 2;
const LERP_FACTOR = 0.25;

export const FINGER_TIPS = {
  THUMB: 4, INDEX: 8, MIDDLE: 12, RING: 16, PINKY: 20,
};
export const PALM_CENTER = 9;
export const WRIST = 0;

// ── Lerp 유틸 ──
function lerpLandmark(current, target, t) {
  return {
    x: current.x + (target.x - current.x) * t,
    y: current.y + (target.y - current.y) * t,
    z: current.z + (target.z - current.z) * t,
  };
}

function lerpHands(current, target, t) {
  if (!target || target.length === 0) return [];
  if (!current || current.length === 0) return target;

  return target.map((targetHand, i) => {
    const currentHand = current[i];
    if (!currentHand || currentHand.landmarks.length !== targetHand.landmarks.length) {
      return targetHand;
    }
    return {
      ...targetHand,
      landmarks: targetHand.landmarks.map((tl, j) =>
        lerpLandmark(currentHand.landmarks[j], tl, t)
      ),
    };
  });
}

// ── 제스처 감지 ──
export function detectGesture(hand) {
  if (!hand || !hand.landmarks) return 'unknown';
  const lm = hand.landmarks;

  // 손가락 끝 vs MCP 관절 비교 (y가 작을수록 위)
  const fingersExtended = [
    lm[8].y < lm[6].y,   // 검지
    lm[12].y < lm[10].y,  // 중지
    lm[16].y < lm[14].y,  // 약지
    lm[20].y < lm[18].y,  // 소지
  ];

  const extendedCount = fingersExtended.filter(Boolean).length;

  if (extendedCount >= 3) return 'open';
  if (extendedCount === 0) return 'fist';
  if (fingersExtended[0] && fingersExtended[1] && !fingersExtended[2] && !fingersExtended[3]) return 'peace';
  if (fingersExtended[0] && !fingersExtended[1]) return 'point';
  return 'unknown';
}

// ── 모듈 레벨 싱글턴 (React StrictMode 영향 안 받음) ──
let _handLandmarker = null;
let _initPromise = null;
let _initFailed = false;

async function getHandLandmarker() {
  if (_handLandmarker) return _handLandmarker;
  if (_initFailed) return null;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const { FilesetResolver, HandLandmarker } = await import(
        /* webpackIgnore: true */ '/mediapipe/vision_bundle.mjs'
      );
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

      try {
        _handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task', delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: MAX_HANDS,
          minHandDetectionConfidence: MIN_DETECTION_CONFIDENCE,
          minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
        });
        console.log('[HandTracking] Initialized (GPU delegate)');
      } catch (gpuErr) {
        console.warn('[HandTracking] GPU failed, trying CPU:', gpuErr.message);
        _handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task', delegate: 'CPU' },
          runningMode: 'VIDEO',
          numHands: MAX_HANDS,
          minHandDetectionConfidence: MIN_DETECTION_CONFIDENCE,
          minTrackingConfidence: MIN_TRACKING_CONFIDENCE,
        });
        console.log('[HandTracking] Initialized (CPU fallback)');
      }

      return _handLandmarker;
    } catch (err) {
      console.error('[HandTracking] Failed to initialize:', err);
      _initFailed = true;
      _initPromise = null;
      return null;
    }
  })();

  return _initPromise;
}

// ──────────────────────────────────────────────────────────────

export function useHandTracking(streamRef, cameraMode, cameraReady, enabled = true) {
  const [hands, setHands] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [fps, setFps] = useState(0);
  const [fallbackToMotion, setFallbackToMotion] = useState(false);

  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const lastDetectionRef = useRef(0);
  const mountedRef = useRef(true);
  const fpsTimesRef = useRef([]);
  const detectionIntervalRef = useRef(DETECTION_INTERVAL_MS);
  const handsRef = useRef([]);
  const isDetectingRef = useRef(false);
  const debugCountRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const errorCountRef = useRef(0);

  // ── 스무딩용 refs ──
  const targetHandsRef = useRef([]);
  const smoothedHandsRef = useRef([]);
  const smoothRafRef = useRef(null);
  const smoothFrameRef = useRef(0);

  const updateFps = useCallback((timestamp) => {
    const times = fpsTimesRef.current;
    times.push(timestamp);
    if (times.length > FPS_SAMPLE_SIZE) times.shift();
    if (times.length >= 2) {
      const elapsed = times[times.length - 1] - times[0];
      const currentFps = Math.round(((times.length - 1) / elapsed) * 1000);
      setFps(currentFps);

      if (currentFps < CRITICAL_FPS_THRESHOLD && times.length >= FPS_SAMPLE_SIZE) {
        setFallbackToMotion(true);
      } else if (currentFps < LOW_FPS_THRESHOLD && times.length >= FPS_SAMPLE_SIZE) {
        detectionIntervalRef.current = 250;
      }
    }
  }, []);

  // ── 스무딩 루프: 매 rAF마다 lerp 보간 ──
  useEffect(() => {
    if (!enabled || fallbackToMotion) return;

    let mounted = true;
    const smoothLoop = () => {
      if (!mounted) return;

      const target = targetHandsRef.current;
      const current = smoothedHandsRef.current;

      if (target.length > 0) {
        const smoothed = lerpHands(current, target, LERP_FACTOR);
        smoothedHandsRef.current = smoothed;
        // 3프레임마다 React 상태 업데이트 (60fps → ~20fps 리렌더)
        if (++smoothFrameRef.current % 3 === 0) {
          setHands(smoothed);
        }
      } else if (current.length > 0) {
        smoothedHandsRef.current = [];
        setHands([]);
      }

      smoothRafRef.current = requestAnimationFrame(smoothLoop);
    };
    smoothRafRef.current = requestAnimationFrame(smoothLoop);

    return () => {
      mounted = false;
      if (smoothRafRef.current) {
        cancelAnimationFrame(smoothRafRef.current);
        smoothRafRef.current = null;
      }
    };
  }, [enabled, fallbackToMotion]);

  // ── 메인 effect: 초기화 완료 후 카메라 프레임 루프 시작 ──
  useEffect(() => {
    mountedRef.current = true;

    if (!enabled || fallbackToMotion || !cameraReady) return;

    let localRaf = null;
    let localVideo = null;

    function detectFrame(source, timestamp) {
      if (!_handLandmarker || !mountedRef.current) return;

      // 연속 에러 10회 초과 시 감지 중단
      if (errorCountRef.current > 10) return;

      if (timestamp <= lastTimestampRef.current) {
        timestamp = lastTimestampRef.current + 1;
      }
      lastTimestampRef.current = timestamp;

      try {
        const result = _handLandmarker.detectForVideo(source, timestamp);
        errorCountRef.current = 0; // 성공 시 리셋

        if (++debugCountRef.current % 60 === 0) {
          console.log('[HandTracking] detect:', {
            landmarks: result.landmarks?.length || 0,
            ts: Math.round(timestamp),
          });
        }

        if (result.landmarks && result.landmarks.length > 0) {
          const handData = result.landmarks.map((landmarks, i) => ({
            landmarks,
            handedness: result.handedness?.[i]?.[0]?.categoryName || 'Unknown',
            score: result.handedness?.[i]?.[0]?.score || 0,
          }));

          targetHandsRef.current = handData;
          handsRef.current = handData;

          if (!isDetectingRef.current) {
            isDetectingRef.current = true;
            setIsDetecting(true);
            console.log('[HandTracking] ✅ Hand detected!', handData.length, 'hands');
          }
        } else {
          if (handsRef.current.length > 0) {
            targetHandsRef.current = [];
            handsRef.current = [];
          }
          if (isDetectingRef.current) {
            isDetectingRef.current = false;
            setIsDetecting(false);
          }
        }

        updateFps(timestamp);
      } catch (err) {
        errorCountRef.current++;
        if (errorCountRef.current <= 3) {
          console.error('[HandTracking] detectForVideo error:', err.message);
        } else if (errorCountRef.current === 10) {
          console.error('[HandTracking] Too many errors, stopping detection');
        }
      }
    }

    getHandLandmarker().then((detector) => {
      if (!mountedRef.current) return;
      if (!detector) {
        setFallbackToMotion(true);
        return;
      }
      console.log('[HandTracking] Detector ready, starting camera loop');

      if (cameraMode === 'edsdk') {
        if (!window.electronAPI?.camera) return;

        const img = new Image();
        window.electronAPI.camera.onEvfFrame((base64Jpeg) => {
          if (!mountedRef.current || !_handLandmarker) return;
          const now = performance.now();
          if (now - lastDetectionRef.current < detectionIntervalRef.current) return;
          lastDetectionRef.current = now;
          img.onload = () => detectFrame(img, now);
          img.src = `data:image/jpeg;base64,${base64Jpeg}`;
        });
      } else {
        const stream = streamRef?.current;
        if (!stream) {
          console.warn('[HandTracking] No stream available');
          return;
        }

        const video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('muted', '');
        video.muted = true;
        video.srcObject = stream;
        localVideo = video;
        videoRef.current = video;

        video.addEventListener('loadeddata', () => {
          if (!mountedRef.current) return;
          console.log('[HandTracking] Video loadeddata, readyState:', video.readyState,
            'size:', video.videoWidth, 'x', video.videoHeight);

          const loop = (timestamp) => {
            if (!mountedRef.current) return;
            if (
              _handLandmarker &&
              timestamp - lastDetectionRef.current >= detectionIntervalRef.current
            ) {
              lastDetectionRef.current = timestamp;
              if (video.readyState >= 2) {
                detectFrame(video, timestamp);
              }
            }
            localRaf = requestAnimationFrame(loop);
            rafRef.current = localRaf;
          };
          localRaf = requestAnimationFrame(loop);
          rafRef.current = localRaf;
        }, { once: true });

        video.play().catch((err) => {
          console.error('[HandTracking] Video play failed:', err);
        });
      }
    });

    return () => {
      mountedRef.current = false;

      if (localRaf) cancelAnimationFrame(localRaf);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (cameraMode === 'edsdk') {
        window.electronAPI?.camera?.offEvfFrame?.();
      }

      if (localVideo) localVideo.srcObject = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }

      fpsTimesRef.current = [];
    };
  }, [cameraMode, cameraReady, streamRef, enabled, fallbackToMotion, updateFps]);

  const getFingerTips = useCallback((fingerIndex = FINGER_TIPS.INDEX) => {
    return hands.map((hand) => ({
      x: hand.landmarks[fingerIndex].x,
      y: hand.landmarks[fingerIndex].y,
      z: hand.landmarks[fingerIndex].z,
      handedness: hand.handedness,
    }));
  }, [hands]);

  const getPalmCenters = useCallback(() => {
    return hands.map((hand) => ({
      x: hand.landmarks[PALM_CENTER].x,
      y: hand.landmarks[PALM_CENTER].y,
      z: hand.landmarks[PALM_CENTER].z,
      handedness: hand.handedness,
    }));
  }, [hands]);

  const getMotionCompat = useCallback(() => {
    if (hands.length === 0) {
      return { isAwake: false, motionCenter: { x: 0.5, y: 0.5 }, motionIntensity: 0 };
    }
    const closest = hands.reduce((a, b) =>
      a.landmarks[PALM_CENTER].z < b.landmarks[PALM_CENTER].z ? a : b
    );
    return {
      isAwake: true,
      motionCenter: {
        x: closest.landmarks[PALM_CENTER].x,
        y: closest.landmarks[PALM_CENTER].y,
      },
      motionIntensity: 1,
    };
  }, [hands]);

  return {
    hands, isDetecting, fps, fallbackToMotion,
    getFingerTips, getPalmCenters, getMotionCompat,
  };
}
