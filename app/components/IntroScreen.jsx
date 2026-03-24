'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useHandTracking, FINGER_TIPS, PALM_CENTER, detectGesture } from '../hooks/useHandTracking';
import { useMotionDetection } from '../hooks/useMotionDetection';

// ── 파티클 필드: 화면에 항상 떠다니는 빛 입자 ──
function createFieldParticles(count, W, H) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      homeX: 0, homeY: 0, // 초기 위치 기억
      vx: 0, vy: 0,
      size: 1.5 + Math.random() * 3,
      alpha: 0.2 + Math.random() * 0.4,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    });
  }
  particles.forEach(p => { p.homeX = p.x; p.homeY = p.y; });
  return particles;
}

// ── 이펙트 오버레이 ──
function HandEffectsOverlay({ hands, isDetecting }) {
  const canvasRef = useRef(null);
  const handsRef = useRef(hands);
  handsRef.current = hands; // 매 렌더마다 ref 갱신 (effect 재시작 없이)

  const stateRef = useRef({
    trailParticles: [],
    burstParticles: [],
    fieldParticles: [],
    waves: [],
    prevPos: {},
    prevGestures: {},
    initialized: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!stateRef.current.initialized) {
        stateRef.current.fieldParticles = createFieldParticles(70, canvas.width, canvas.height);
        stateRef.current.initialized = true;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      const W = canvas.width;
      const H = canvas.height;
      const s = stateRef.current;
      const hands = handsRef.current; // ref에서 읽기

      ctx.clearRect(0, 0, W, H);

      // ═══════════════════════════════════════════════
      // A. 파티클 필드 (항상 활성)
      // ═══════════════════════════════════════════════
      const handPositions = []; // 픽셀 좌표 수집

      if (hands.length > 0) {
        hands.forEach((hand) => {
          const palm = hand.landmarks[PALM_CENTER];
          handPositions.push({
            x: (1 - palm.x) * W,
            y: palm.y * H,
          });
        });
      }

      for (const fp of s.fieldParticles) {
        fp.pulse += fp.pulseSpeed;

        // 손과의 상호작용
        let forceX = 0, forceY = 0;
        for (const hp of handPositions) {
          const dx = fp.x - hp.x;
          const dy = fp.y - hp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = 180;
          if (dist < radius && dist > 0) {
            const strength = (1 - dist / radius) * 8;
            forceX += (dx / dist) * strength;
            forceY += (dy / dist) * strength;
          }
        }

        // 물리 적용
        fp.vx += forceX;
        fp.vy += forceY;
        // 홈으로 복귀 (스프링)
        fp.vx += (fp.homeX - fp.x) * 0.005;
        fp.vy += (fp.homeY - fp.y) * 0.005;
        // 마찰
        fp.vx *= 0.92;
        fp.vy *= 0.92;

        fp.x += fp.vx;
        fp.y += fp.vy;

        // 렌더
        const pulseAlpha = fp.alpha * (0.6 + 0.4 * Math.sin(fp.pulse));
        const displaced = Math.sqrt(fp.vx * fp.vx + fp.vy * fp.vy);
        const brightness = Math.min(1, displaced * 0.3);

        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size * (1 + brightness * 0.5), 0, Math.PI * 2);
        const r = Math.round(brightness * 255);
        const g = Math.round(200 + brightness * 55);
        const b = Math.round(220 + brightness * 35);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${pulseAlpha})`;
        ctx.fill();

        if (displaced > 1.5) {
          ctx.beginPath();
          ctx.arc(fp.x, fp.y, fp.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 220, ${pulseAlpha * 0.15})`;
          ctx.fill();
        }
      }

      // ═══════════════════════════════════════════════
      // B. 에너지 트레일 + 제스처 반응 (손 있을 때)
      // ═══════════════════════════════════════════════
      if (hands.length > 0) {
        hands.forEach((hand, hi) => {
          const key = `h${hi}`;
          const tip = hand.landmarks[FINGER_TIPS.INDEX];
          const x = (1 - tip.x) * W;
          const y = tip.y * H;
          const palm = hand.landmarks[PALM_CENTER];
          const px = (1 - palm.x) * W;
          const py = palm.y * H;

          const prev = s.prevPos[key];
          const gesture = detectGesture(hand);
          const prevGesture = s.prevGestures[key];

          if (prev) {
            const dx = x - prev.x;
            const dy = y - prev.y;
            const speed = Math.sqrt(dx * dx + dy * dy);

            // ── 에너지 트레일 ──
            if (speed > 2) {
              const count = Math.min(Math.floor(speed / 3), 12);
              for (let i = 0; i < count; i++) {
                const spread = Math.min(speed * 0.3, 30);
                s.trailParticles.push({
                  x: x + (Math.random() - 0.5) * spread,
                  y: y + (Math.random() - 0.5) * spread,
                  vx: dx * (0.1 + Math.random() * 0.2) + (Math.random() - 0.5) * 2,
                  vy: dy * (0.1 + Math.random() * 0.2) + (Math.random() - 0.5) * 2,
                  life: 1,
                  decay: 0.015 + Math.random() * 0.02,
                  size: speed > 15 ? 3 + Math.random() * 7 : 2 + Math.random() * 4,
                  hue: speed > 20 ? 40 + Math.random() * 30 : 180 + Math.random() * 30,
                  brightness: Math.min(speed / 30, 1),
                });
              }
            }

            // ── 빠른 스와이프: 빛의 궤적 ──
            if (speed > 40) {
              for (let i = 0; i < 20; i++) {
                const t = i / 20;
                s.trailParticles.push({
                  x: prev.x + dx * t + (Math.random() - 0.5) * 10,
                  y: prev.y + dy * t + (Math.random() - 0.5) * 10,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  life: 1,
                  decay: 0.01,
                  size: 4 + Math.random() * 6,
                  hue: 50 + Math.random() * 20,
                  brightness: 1,
                });
              }
            }
          }

          // ── 제스처 반응 ──
          if (gesture !== prevGesture) {
            if (gesture === 'open' && prevGesture === 'fist') {
              // 주먹 → 펼침: 에너지 폭발!
              for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.3;
                const spd = 5 + Math.random() * 12;
                s.burstParticles.push({
                  x: px, y: py,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  life: 1,
                  decay: 0.01 + Math.random() * 0.01,
                  size: 3 + Math.random() * 8,
                  hue: 30 + Math.random() * 40,
                });
              }
              // 웨이브 링
              s.waves.push({ x: px, y: py, radius: 0, maxRadius: 300, life: 1, hue: 50 });
            }

            if (gesture === 'fist') {
              // 펼침 → 주먹: 에너지 수축
              s.waves.push({ x: px, y: py, radius: 200, maxRadius: 0, life: 1, hue: 200, implode: true });
            }

            if (gesture === 'open') {
              // 손 펼침: 원형 웨이브
              s.waves.push({ x: px, y: py, radius: 0, maxRadius: 250, life: 1, hue: 180 });
            }

            if (gesture === 'peace') {
              // 피스: 하트/별 파티클
              for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                s.burstParticles.push({
                  x: px, y: py - 30,
                  vx: Math.cos(angle) * (3 + Math.random() * 5),
                  vy: Math.sin(angle) * (3 + Math.random() * 5) - 3,
                  life: 1,
                  decay: 0.008 + Math.random() * 0.008,
                  size: 4 + Math.random() * 6,
                  hue: 320 + Math.random() * 40, // 핑크-마젠타
                });
              }
            }
          }

          s.prevPos[key] = { x, y };
          s.prevGestures[key] = gesture;

          // ── 손끝 포인터 ──
          // 글로우
          ctx.save();
          ctx.shadowBlur = 25;
          ctx.shadowColor = 'rgba(0, 255, 220, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 255, 220, 0.6)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();
          ctx.restore();

          // 손가락 연결 (반투명)
          const fingerIds = [4, 8, 12, 16, 20];
          ctx.save();
          ctx.strokeStyle = 'rgba(0, 255, 220, 0.15)';
          ctx.lineWidth = 1;
          fingerIds.forEach((fi) => {
            const ft = hand.landmarks[fi];
            const fx = (1 - ft.x) * W;
            const fy = ft.y * H;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(fx, fy);
            ctx.stroke();

            // 끝점 소형 글로우
            ctx.beginPath();
            ctx.arc(fx, fy, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 220, 0.4)';
            ctx.fill();
          });
          ctx.restore();

          // 제스처 텍스트 (디버그)
          if (gesture !== 'unknown') {
            ctx.save();
            ctx.font = '14px monospace';
            ctx.fillStyle = 'rgba(0, 255, 220, 0.7)';
            ctx.fillText(gesture.toUpperCase(), px - 20, py - 35);
            ctx.restore();
          }
        });
      } else {
        // 손 사라지면 prev 초기화
        s.prevPos = {};
        s.prevGestures = {};
      }

      // ═══════════════════════════════════════════════
      // 파티클 렌더링 (트레일 + 버스트)
      // ═══════════════════════════════════════════════

      // 트레일 파티클
      for (let i = s.trailParticles.length - 1; i >= 0; i--) {
        const p = s.trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.95;
        p.vy *= 0.95;

        if (p.life <= 0) { s.trailParticles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.life * p.brightness;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.life})`;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 90%, ${p.life})`);
        grad.addColorStop(0.4, `hsla(${p.hue}, 100%, 70%, ${p.life * 0.6})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 버스트 파티클
      for (let i = s.burstParticles.length - 1; i >= 0; i--) {
        const p = s.burstParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy += 0.1; // 약간의 중력

        if (p.life <= 0) { s.burstParticles.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, ${p.life})`;

        // 별 모양
        ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${p.life})`;
        ctx.beginPath();
        const spikes = 4;
        for (let s2 = 0; s2 < spikes * 2; s2++) {
          const r = s2 % 2 === 0 ? p.size : p.size * 0.4;
          const angle = (s2 * Math.PI) / spikes - Math.PI / 2;
          const sx = p.x + Math.cos(angle) * r;
          const sy = p.y + Math.sin(angle) * r;
          if (s2 === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 웨이브 링
      for (let i = s.waves.length - 1; i >= 0; i--) {
        const w = s.waves[i];
        w.life -= 0.02;

        if (w.implode) {
          w.radius = w.radius + (w.maxRadius - w.radius) * 0.15;
        } else {
          w.radius += (w.maxRadius - w.radius) * 0.08;
        }

        if (w.life <= 0) { s.waves.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = w.life * 0.6;
        ctx.strokeStyle = `hsla(${w.hue}, 100%, 70%, ${w.life})`;
        ctx.lineWidth = 3 * w.life;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${w.hue}, 100%, 60%, ${w.life * 0.5})`;
        ctx.beginPath();
        ctx.arc(w.x, w.y, Math.max(0, w.radius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 파티클 수 제한
      if (s.trailParticles.length > 300) s.trailParticles.splice(0, s.trailParticles.length - 300);
      if (s.burstParticles.length > 200) s.burstParticles.splice(0, s.burstParticles.length - 200);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []); // hands는 ref로 읽으므로 deps 불필요

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
}

// ── 디버그 HUD ──
function DebugHUD({ handTracking, mode }) {
  const gesture = handTracking.hands.length > 0
    ? detectGesture(handTracking.hands[0])
    : '-';

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      left: 10,
      color: '#0f0',
      fontSize: 13,
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.7)',
      padding: '8px 12px',
      borderRadius: 6,
      zIndex: 9999,
      lineHeight: 1.6,
    }}>
      <div>Hand: {handTracking.isDetecting ? '✅' : '❌'} | Hands: {handTracking.hands.length}</div>
      <div>FPS: {handTracking.fps} | Mode: {mode}</div>
      <div>Gesture: {gesture}</div>
    </div>
  );
}

export default function IntroScreen({ onStart, streamRef, cameraMode, cameraReady }) {
  const handTracking = useHandTracking(streamRef, cameraMode, cameraReady);
  const motionDetection = useMotionDetection(streamRef, cameraMode, cameraReady);

  const handCompat = handTracking.getMotionCompat();
  const activeMode = handCompat.isAwake ? 'HAND' : 'MOTION';
  const { isAwake, motionCenter } = handCompat.isAwake
    ? handCompat
    : motionDetection;

  const MAX_OFFSET_X = 70;
  const MAX_OFFSET_Y = 45;
  const pupilX = isAwake ? ((1 - motionCenter.x) - 0.5) * 2 * MAX_OFFSET_X : 0;
  const pupilY = isAwake ? (motionCenter.y - 0.5) * 2 * MAX_OFFSET_Y : 0;

  const trackStyle = {
    transform: `translate(${pupilX}px, ${pupilY}px)`,
    transition: 'transform 0.15s ease-out',
  };

  const stateClass = isAwake ? 'robot-awake' : 'robot-sleeping';

  const mascotX = isAwake ? ((1 - motionCenter.x) - 0.5) * 2 * 250 : 0;
  const facingLeft = mascotX < 0;
  const mascotStyle = {
    transform: `translateX(${mascotX}px) scaleX(${facingLeft ? -1 : 1})`,
    transition: 'transform 0.3s ease-out',
  };

  return (
    <div className={`intro-screen robot-theme ${stateClass}`}>
      <DebugHUD handTracking={handTracking} mode={activeMode} />
      <HandEffectsOverlay hands={handTracking.hands} isDetecting={handTracking.isDetecting} />

      <div className="robot-container">
        <div className="robot-head">
          <div className="robot-ear left"></div>
          <div className="robot-ear right"></div>
          <div className="robot-face" onClick={onStart}>
            <div className="robot-eyes">
              <div className="robot-eye-wrapper">
                <div className="robot-eye">
                  <div className="robot-pupil-track" style={trackStyle}>
                    <div className="robot-pupil">
                      <div className="robot-sparkle"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="robot-eye-wrapper">
                <div className="robot-eye">
                  <div className="robot-pupil-track" style={trackStyle}>
                    <div className="robot-pupil">
                      <div className="robot-sparkle"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="robot-blush left"></div>
            <div className="robot-blush right"></div>
            <div className="robot-mouth-container">
              <button className="robot-mouth-btn">
                <span>START</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="robot-mascot" style={mascotStyle}>
        <img src="/hf_20260315_112709_ed482a5c-da4d-417d-90f7-85730bfcad19-removebg-preview.png" alt="Robot Mascot" />
      </div>
    </div>
  );
}
