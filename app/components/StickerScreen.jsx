'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { stickerCategories, stickers, stickerColors } from '../constants/stickers';

// 네온 글로우 스티커 생성 (흰색 라인아트 → 네온 발광 효과)
function applyColorTint(sourceImage, targetHex) {
  return new Promise((resolve) => {
    const w = sourceImage.naturalWidth || sourceImage.width;
    const h = sourceImage.naturalHeight || sourceImage.height;

    // 1) 색상 입히기: 흰색 라인아트를 대상 색상으로 변환
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = w;
    colorCanvas.height = h;
    const colorCtx = colorCanvas.getContext('2d');
    colorCtx.drawImage(sourceImage, 0, 0);
    colorCtx.globalCompositeOperation = 'source-atop';
    colorCtx.fillStyle = targetHex;
    colorCtx.fillRect(0, 0, w, h);

    // 2) 외곽 글로우 레이어 (큰 블러 - 멀리 퍼지는 빛)
    const outerGlow = document.createElement('canvas');
    outerGlow.width = w;
    outerGlow.height = h;
    const ogCtx = outerGlow.getContext('2d');
    ogCtx.filter = 'blur(12px)';
    ogCtx.globalAlpha = 0.6;
    ogCtx.drawImage(colorCanvas, 0, 0);
    ogCtx.drawImage(colorCanvas, 0, 0);

    // 3) 내부 글로우 레이어 (작은 블러 - 가까운 발광)
    const innerGlow = document.createElement('canvas');
    innerGlow.width = w;
    innerGlow.height = h;
    const igCtx = innerGlow.getContext('2d');
    igCtx.filter = 'blur(4px)';
    igCtx.globalAlpha = 0.8;
    igCtx.drawImage(colorCanvas, 0, 0);

    // 4) 밝은 중심선 (흰색 하이라이트)
    const highlight = document.createElement('canvas');
    highlight.width = w;
    highlight.height = h;
    const hlCtx = highlight.getContext('2d');
    hlCtx.drawImage(sourceImage, 0, 0);
    hlCtx.globalCompositeOperation = 'source-atop';
    hlCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    hlCtx.fillRect(0, 0, w, h);

    // 5) 최종 합성: 외곽글로우 → 내부글로우 → 색상본체 → 하이라이트
    const final = document.createElement('canvas');
    final.width = w;
    final.height = h;
    const fCtx = final.getContext('2d');

    fCtx.drawImage(outerGlow, 0, 0);    // 외곽 발광
    fCtx.drawImage(innerGlow, 0, 0);    // 내부 발광
    fCtx.drawImage(colorCanvas, 0, 0);  // 색상 본체
    fCtx.globalAlpha = 0.6;
    fCtx.drawImage(highlight, 0, 0);    // 중심 하이라이트
    fCtx.globalAlpha = 1.0;

    const img = new window.Image();
    img.onload = () => resolve(img);
    img.src = final.toDataURL('image/png');
  });
}

// 흰색 아웃라인 텍스트 이미지 생성 (깔끔한 외곽 테두리만)
function generateWhiteText(text, size = 500) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = Math.floor(size * 0.45);
    const ctx = canvas.getContext('2d');

    const fontSize = Math.min(100, Math.floor(size / (text.length * 0.55 + 0.8)));
    ctx.font = `900 ${fontSize}px "Segoe UI Black", "Arial Black", "Noto Sans KR", "맑은 고딕", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // 1) 두꺼운 stroke로 외곽선 그리기
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(6, fontSize * 0.12);
    ctx.strokeText(text, cx, cy);

    // 2) destination-out으로 내부 도려내기 → 깔끔한 외곽 테두리만 남음
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, cx, cy);
    ctx.globalCompositeOperation = 'source-over';

    const img = new window.Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL('image/png');
  });
}

// 스티커 꾸미기 화면 컴포넌트
export default function StickerScreen({ finalImage, onComplete, onSkip, onHome, frameVariant = 'black', onFrameVariantChange, placedStickers, setPlacedStickers, customerData }) {
  const [bgImage, setBgImage] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('shapes');
  const [selectedColor, setSelectedColor] = useState(stickerColors[0]); // 기본: 시안
  const [isExporting, setIsExporting] = useState(false);
  const [isChangingFrame, setIsChangingFrame] = useState(false);
  const [canvasSize, setCanvasSize] = useState(() => {
    // 동기적 초기 계산 (리마운트 시 위치 깜빡임 방지)
    const availableWidth = (typeof window !== 'undefined' ? window.innerWidth : 1920) * 0.55;
    const availableHeight = (typeof window !== 'undefined' ? window.innerHeight : 1080) - 40;
    const aspectRatio = 2 / 3;
    let h = availableHeight;
    let w = h * aspectRatio;
    if (w > availableWidth * 0.9) {
      w = availableWidth * 0.9;
      h = w / aspectRatio;
    }
    return { width: Math.floor(w), height: Math.floor(h) };
  });

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const lastPinchRef = useRef({ dist: 0, angle: 0 });
  const imageCache = useRef(new Map());

  // 배경 이미지 로드
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setBgImage(img);
    img.src = finalImage;
  }, [finalImage]);

  // 카테고리별 스티커 필터링
  const filteredStickers = useMemo(
    () => stickers.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  // 카테고리 변경 시 스티커 이미지 프리로드
  useEffect(() => {
    filteredStickers.forEach(s => {
      if (s.generatedText) return;
      const src = `/stickers/${s.category}/${s.file}`;
      if (!imageCache.current.has(src)) {
        const img = new window.Image();
        img.src = src;
        img.onload = () => imageCache.current.set(src, img);
      }
    });
  }, [filteredStickers]);

  // Transformer 바인딩
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedId) {
      const stage = stageRef.current;
      const node = stage.findOne('#' + selectedId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer().batchDraw();
      }
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, placedStickers]);

  // 스티커 추가 (색상 적용, 크기 정규화)
  const addSticker = useCallback(async (stickerDef) => {
    // 텍스트 스티커: 코드로 생성 (generatedText가 있는 경우)
    if (stickerDef.generatedText) {
      const whiteText = await generateWhiteText(stickerDef.generatedText);
      const coloredImg = await applyColorTint(whiteText, selectedColor.hex);

      const aspectRatio = whiteText.naturalHeight / whiteText.naturalWidth;
      const width = Math.min(stickerDef.defaultWidth, canvasSize.width * 0.28);
      const height = width * aspectRatio;

      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;

      const newSticker = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        stickerId: stickerDef.id,
        src: 'dynamic',
        image: coloredImg,
        originalImage: whiteText,
        baseHue: 0,
        colorId: selectedColor.id,
        x: canvasSize.width / 2 - width / 2 + offsetX,
        y: canvasSize.height / 2 - height / 2 + offsetY,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      };

      setPlacedStickers(prev => [...prev, newSticker]);
      setSelectedId(newSticker.id);
      return;
    }

    const src = `/stickers/${stickerDef.category}/${stickerDef.file}`;

    const placeSticker = async (originalImg) => {
      // 선택된 색상으로 hue-rotate 적용 (비동기 - 로드 완료 대기)
      const img = await applyColorTint(originalImg, selectedColor.hex);

      const aspectRatio = originalImg.naturalHeight / originalImg.naturalWidth;
      // 캔버스 대비 적정 크기로 스케일 (최대 28%)
      const width = Math.min(stickerDef.defaultWidth, canvasSize.width * 0.28);
      const height = width * aspectRatio;

      // 약간의 랜덤 오프셋으로 겹침 방지
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;

      const newSticker = {
        id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        stickerId: stickerDef.id,
        src,
        image: img,
        originalImage: originalImg,
        baseHue: stickerDef.baseHue,
        colorId: selectedColor.id,
        x: canvasSize.width / 2 - width / 2 + offsetX,
        y: canvasSize.height / 2 - height / 2 + offsetY,
        width,
        height,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      };

      setPlacedStickers(prev => [...prev, newSticker]);
      setSelectedId(newSticker.id);
    };

    if (imageCache.current.has(src)) {
      await placeSticker(imageCache.current.get(src));
    } else {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        imageCache.current.set(src, img);
        await placeSticker(img);
      };
      img.src = src;
    }
  }, [canvasSize, selectedColor, setPlacedStickers]);

  // 최애 이름 스티커 추가 (흰색 텍스트 → applyColorTint 파이프라인)
  const addIdolNameSticker = useCallback(async () => {
    if (!customerData?.idolName) return;

    // 1) 흰색 텍스트 생성 (originalImage로 저장)
    const whiteText = await generateWhiteText(customerData.idolName);
    // 2) 선택된 색상으로 네온 글로우 적용
    const coloredImg = await applyColorTint(whiteText, selectedColor.hex);

    const aspectRatio = whiteText.naturalHeight / whiteText.naturalWidth;
    const width = Math.min(220, canvasSize.width * 0.28);
    const height = width * aspectRatio;

    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;

    const newSticker = {
      id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      stickerId: 'text_idol_name',
      src: 'dynamic',
      image: coloredImg,
      originalImage: whiteText,
      baseHue: 0,
      colorId: selectedColor.id,
      x: canvasSize.width / 2 - width / 2 + offsetX,
      y: canvasSize.height / 2 - height / 2 + offsetY,
      width,
      height,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };

    setPlacedStickers(prev => [...prev, newSticker]);
    setSelectedId(newSticker.id);
  }, [customerData, canvasSize, selectedColor, setPlacedStickers]);

  // 드래그 완료
  const handleDragEnd = useCallback((e, id) => {
    setPlacedStickers(prev => prev.map(s =>
      s.id === id ? { ...s, x: e.target.x(), y: e.target.y() } : s
    ));
  }, [setPlacedStickers]);

  // Transform 완료 (리사이즈/회전)
  const handleTransformEnd = useCallback((e, id) => {
    const node = e.target;
    setPlacedStickers(prev => prev.map(s =>
      s.id === id ? {
        ...s,
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      } : s
    ));
  }, [setPlacedStickers]);

  // 캔버스 빈 영역 클릭 → 선택 해제
  const handleStageClick = useCallback((e) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  }, []);

  // 색상 변경: 선택된 스티커가 있으면 실시간 리틴팅
  const changeColor = useCallback(async (color) => {
    setSelectedColor(color);

    if (!selectedId) return;

    const sticker = placedStickers.find(s => s.id === selectedId);
    if (!sticker || sticker.colorId === color.id) return;

    let newImg;
    if (!sticker.originalImage || sticker.baseHue === null) return;

    // 모든 스티커 동일: 원본 흰색 이미지에서 새 색상으로 틴팅
    newImg = await applyColorTint(sticker.originalImage, color.hex);

    setPlacedStickers(prev => prev.map(s =>
      s.id === selectedId ? { ...s, image: newImg, colorId: color.id } : s
    ));
  }, [selectedId, placedStickers, setPlacedStickers]);

  // 핀치 줌/회전 (2-finger)
  const handleTouchMove = useCallback((e) => {
    const touches = e.evt.touches;
    if (touches.length === 2 && selectedId) {
      e.evt.preventDefault();

      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      if (lastPinchRef.current.dist > 0) {
        const scaleDelta = dist / lastPinchRef.current.dist;
        const angleDelta = angle - lastPinchRef.current.angle;

        setPlacedStickers(prev => prev.map(s => {
          if (s.id !== selectedId) return s;
          return {
            ...s,
            scaleX: Math.max(0.2, Math.min(5, s.scaleX * scaleDelta)),
            scaleY: Math.max(0.2, Math.min(5, s.scaleY * scaleDelta)),
            rotation: s.rotation + angleDelta,
          };
        }));
      }

      lastPinchRef.current = { dist, angle };
    }
  }, [selectedId, setPlacedStickers]);

  const handleTouchEnd = useCallback(() => {
    lastPinchRef.current = { dist: 0, angle: 0 };
  }, []);

  // 선택된 스티커 삭제
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    setPlacedStickers(prev => prev.filter(s => s.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setPlacedStickers]);

  // 모든 스티커 초기화
  const handleReset = useCallback(() => {
    setPlacedStickers([]);
    setSelectedId(null);
  }, [setPlacedStickers]);

  // 고해상도 내보내기 (2400x3600)
  const exportWithStickers = useCallback(async () => {
    if (placedStickers.length === 0) {
      onSkip();
      return;
    }

    setIsExporting(true);
    try {
      const EXPORT_WIDTH = 2400;
      const EXPORT_HEIGHT = 3600;
      const scaleFactorX = EXPORT_WIDTH / canvasSize.width;
      const scaleFactorY = EXPORT_HEIGHT / canvasSize.height;

      const canvas = document.createElement('canvas');
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 배경 그리기
      const bgImg = new window.Image();
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
        bgImg.src = finalImage;
      });
      ctx.drawImage(bgImg, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

      // 각 스티커 그리기
      for (const sticker of placedStickers) {
        ctx.save();

        const exportW = sticker.width * sticker.scaleX * scaleFactorX;
        const exportH = sticker.height * sticker.scaleY * scaleFactorY;
        const exportX = sticker.x * scaleFactorX;
        const exportY = sticker.y * scaleFactorY;

        // Konva와 동일하게 (x, y) 원점 기준 회전
        ctx.translate(exportX, exportY);
        ctx.rotate((sticker.rotation * Math.PI) / 180);
        ctx.drawImage(sticker.image, 0, 0, exportW, exportH);

        ctx.restore();
      }

      const result = canvas.toDataURL('image/jpeg', 0.98);
      onComplete(result);
    } catch (error) {
      console.error('스티커 내보내기 실패:', error);
      onSkip();
    } finally {
      setIsExporting(false);
    }
  }, [placedStickers, canvasSize, finalImage, onComplete, onSkip]);

  return (
    <div className="sticker-screen">
      {/* 왼쪽: 캔버스 영역 */}
      <div className="sticker-canvas-area">
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onTap={handleStageClick}
          onClick={handleStageClick}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Layer listening={false}>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                width={canvasSize.width}
                height={canvasSize.height}
              />
            )}
          </Layer>
          <Layer>
            {placedStickers.map((sticker) => (
              <KonvaImage
                key={sticker.id}
                id={sticker.id}
                image={sticker.image}
                x={sticker.x}
                y={sticker.y}
                width={sticker.width}
                height={sticker.height}
                scaleX={sticker.scaleX}
                scaleY={sticker.scaleY}
                rotation={sticker.rotation}
                draggable
                onTap={() => setSelectedId(sticker.id)}
                onClick={() => setSelectedId(sticker.id)}
                onDragEnd={(e) => handleDragEnd(e, sticker.id)}
                onTransformEnd={(e) => handleTransformEnd(e, sticker.id)}
              />
            ))}
            <Transformer
              ref={trRef}
              anchorSize={20}
              anchorCornerRadius={10}
              rotateAnchorOffset={40}
              borderStroke="#00f3ff"
              anchorStroke="#00f3ff"
              anchorFill="#111111"
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 30 || newBox.height < 30) return oldBox;
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      {/* 오른쪽: 스티커 팔레트 + 툴바 */}
      <div className="sticker-right-panel">
        {/* 색상 팔레트 */}
        <div className="sticker-color-palette">
          <span className="color-palette-label">스티커 색상</span>
          <div className="color-palette-options">
            {stickerColors.map(color => (
              <button
                key={color.id}
                className={`color-dot ${selectedColor.id === color.id ? 'active' : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => changeColor(color)}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="sticker-palette">
          <div className="sticker-category-tabs">
            {stickerCategories.map(cat => (
              <button
                key={cat.id}
                className={`sticker-category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>
          <div className="sticker-items-grid">
            {/* 텍스트 카테고리일 때 최애 이름 스티커를 최상단에 표시 */}
            {activeCategory === 'text' && customerData?.idolName && (
              <div
                className="sticker-thumb idol-name-thumb"
                onClick={addIdolNameSticker}
              >
                <span className="idol-name-label">{customerData.idolName}</span>
              </div>
            )}
            {filteredStickers.map(sticker => (
              <div
                key={sticker.id}
                className={`sticker-thumb${sticker.generatedText ? ' idol-name-thumb' : ''}`}
                onClick={() => addSticker(sticker)}
              >
                {sticker.generatedText ? (
                  <span className="idol-name-label">{sticker.generatedText}</span>
                ) : (
                  <img
                    src={`/stickers/${sticker.category}/${sticker.file}`}
                    alt={sticker.name}
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 프레임 색상 선택 */}
        <div className="frame-variant-selector">
          <span className="frame-variant-label">프레임 색상</span>
          <div className="frame-variant-options">
            <button
              className={`frame-variant-btn variant-black ${frameVariant === 'black' ? 'active' : ''}`}
              onClick={async () => {
                if (frameVariant === 'black' || isChangingFrame) return;
                setIsChangingFrame(true);
                await onFrameVariantChange('black');
                setIsChangingFrame(false);
              }}
              disabled={isChangingFrame}
            >
              BLACK
            </button>
            <button
              className={`frame-variant-btn variant-white ${frameVariant === 'white' ? 'active' : ''}`}
              onClick={async () => {
                if (frameVariant === 'white' || isChangingFrame) return;
                setIsChangingFrame(true);
                await onFrameVariantChange('white');
                setIsChangingFrame(false);
              }}
              disabled={isChangingFrame}
            >
              WHITE
            </button>
          </div>
          {isChangingFrame && <span className="frame-variant-loading">변경 중...</span>}
        </div>

        <div className="sticker-toolbar">
          <button className="sticker-home-btn" onClick={onHome}>
            홈으로
          </button>
          <button className="sticker-skip-btn" onClick={onSkip}>
            건너뛰기
          </button>
          <button
            className="sticker-reset-btn"
            onClick={handleReset}
            disabled={placedStickers.length === 0}
          >
            초기화
          </button>
          <button
            className="sticker-delete-btn"
            onClick={handleDelete}
            disabled={!selectedId}
          >
            삭제
          </button>
          <button
            className="sticker-done-btn"
            onClick={exportWithStickers}
            disabled={isExporting}
          >
            {isExporting ? '처리 중...' : '완료'}
          </button>
        </div>
      </div>

      {/* 내보내기 로딩 오버레이 */}
      {isExporting && (
        <div className="sticker-export-overlay">
          <div className="spinner"></div>
          <p>스티커 합성 중...</p>
        </div>
      )}
    </div>
  );
}
