'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const ANALYSIS_WIDTH = 160;
const ANALYSIS_HEIGHT = 120;
const PIXEL_THRESHOLD = 30;
const MOTION_THRESHOLD = 0.015;
const SLEEP_DELAY = 5000;
const ANALYSIS_INTERVAL = 200;

export function useMotionDetection(streamRef, cameraMode, cameraReady, enabled = true) {
  const [isAwake, setIsAwake] = useState(false);
  const [motionCenter, setMotionCenter] = useState({ x: 0.5, y: 0.5 });
  const [motionIntensity, setMotionIntensity] = useState(0);

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const prevFrameRef = useRef(null);
  const videoRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const rafRef = useRef(null);
  const lastAnalysisRef = useRef(0);
  const mountedRef = useRef(true);
  const isAwakeRef = useRef(false);

  const drawAndAnalyze = useCallback((source) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.drawImage(source, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);

    const imageData = ctx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
    const pixels = imageData.data;
    const totalPixels = ANALYSIS_WIDTH * ANALYSIS_HEIGHT;
    const grayFrame = new Uint8Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 4;
      grayFrame[i] = (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3;
    }

    const prev = prevFrameRef.current;
    if (prev) {
      let changedCount = 0;
      let sumX = 0;
      let sumY = 0;

      for (let i = 0; i < totalPixels; i++) {
        const diff = Math.abs(grayFrame[i] - prev[i]);
        if (diff > PIXEL_THRESHOLD) {
          changedCount++;
          sumX += i % ANALYSIS_WIDTH;
          sumY += Math.floor(i / ANALYSIS_WIDTH);
        }
      }

      const ratio = changedCount / totalPixels;
      const intensity = Math.min(ratio / 0.1, 1);

      if (ratio > MOTION_THRESHOLD) {
        const centerX = changedCount > 0 ? sumX / changedCount / ANALYSIS_WIDTH : 0.5;
        const centerY = changedCount > 0 ? sumY / changedCount / ANALYSIS_HEIGHT : 0.5;

        setMotionCenter({ x: centerX, y: centerY });
        setMotionIntensity(intensity);

        if (!isAwakeRef.current) {
          setIsAwake(true);
          isAwakeRef.current = true;
        }

        clearTimeout(sleepTimerRef.current);
        sleepTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setIsAwake(false);
            isAwakeRef.current = false;
            setMotionIntensity(0);
          }
        }, SLEEP_DELAY);
      }
    }

    prevFrameRef.current = grayFrame;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!enabled) return;

    const canvas = document.createElement('canvas');
    canvas.width = ANALYSIS_WIDTH;
    canvas.height = ANALYSIS_HEIGHT;
    canvasRef.current = canvas;
    ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });

    if (cameraMode === 'edsdk') {
      // EDSDK: IPC 프레임 콜백
      if (!window.electronAPI?.camera) return;

      const img = new Image();

      window.electronAPI.camera.onEvfFrame((base64Jpeg) => {
        if (!mountedRef.current) return;
        const now = performance.now();
        if (now - lastAnalysisRef.current < ANALYSIS_INTERVAL) return;
        lastAnalysisRef.current = now;

        img.onload = () => drawAndAnalyze(img);
        img.src = `data:image/jpeg;base64,${base64Jpeg}`;
      });
    } else {
      // 웹캠: 숨겨진 video + rAF
      const stream = streamRef?.current;
      if (!stream) return;

      const video = document.createElement('video');
      video.setAttribute('autoplay', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('muted', '');
      video.muted = true;
      video.srcObject = stream;
      video.play().catch(() => {});
      videoRef.current = video;

      const loop = (timestamp) => {
        if (!mountedRef.current) return;
        if (timestamp - lastAnalysisRef.current >= ANALYSIS_INTERVAL) {
          lastAnalysisRef.current = timestamp;
          if (video.readyState >= 2) {
            drawAndAnalyze(video);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      mountedRef.current = false;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      clearTimeout(sleepTimerRef.current);

      if (cameraMode === 'edsdk') {
        window.electronAPI?.camera?.offEvfFrame?.();
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current = null;
      }

      canvasRef.current = null;
      ctxRef.current = null;
      prevFrameRef.current = null;
    };
  }, [cameraMode, streamRef, cameraReady, enabled, drawAndAnalyze]);

  return { isAwake, motionCenter, motionIntensity };
}
