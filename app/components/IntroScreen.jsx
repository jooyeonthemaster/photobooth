'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMotionDetection } from '../hooks/useMotionDetection';

export default function IntroScreen({ onStart, streamRef, cameraMode, cameraReady }) {
  const motionDetection = useMotionDetection(streamRef, cameraMode, cameraReady);
  const { isAwake, motionCenter } = motionDetection;

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
