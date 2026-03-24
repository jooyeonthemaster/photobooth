/**
 * 새 액세서리 스티커 PNG 생성 스크립트
 * 기존 네온 스타일(더블아웃라인 + 글로우 + 투명배경)과 동일
 *
 * 실행: node scripts/generate-accessory-stickers.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'stickers', 'accessories');
const SIZE = 500;
const CYAN = '#00f3ff';
const PINK = '#ff69b4';

// 네온 글로우 스타일 적용 헬퍼
function applyNeonStyle(ctx, color, lineWidth = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
}

function applyInnerLineStyle(ctx, lineWidth = 2) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = lineWidth;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

// 각 스티커 그리기 함수
const stickerDrawers = {
  // 천사 날개
  acc_angel_wings(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2 + 20;

    function drawWing(flipX) {
      ctx.beginPath();
      const dir = flipX ? -1 : 1;
      // 큰 날개 윤곽
      ctx.moveTo(cx + dir * 20, cy - 10);
      ctx.bezierCurveTo(cx + dir * 60, cy - 120, cx + dir * 180, cy - 160, cx + dir * 200, cy - 80);
      ctx.bezierCurveTo(cx + dir * 210, cy - 40, cx + dir * 190, cy + 10, cx + dir * 160, cy + 30);
      // 깃털 디테일
      ctx.bezierCurveTo(cx + dir * 170, cy - 20, cx + dir * 150, cy - 60, cx + dir * 130, cy + 10);
      ctx.bezierCurveTo(cx + dir * 140, cy - 30, cx + dir * 110, cy - 50, cx + dir * 90, cy + 20);
      ctx.bezierCurveTo(cx + dir * 100, cy - 10, cx + dir * 70, cy - 30, cx + dir * 20, cy - 10);
      ctx.closePath();
    }

    // 글로우 (2번)
    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3);
      drawWing(false);
      ctx.stroke();
      drawWing(true);
      ctx.stroke();
    }
    // 내부 라인
    applyInnerLineStyle(ctx, 1.5);
    drawWing(false);
    ctx.stroke();
    drawWing(true);
    ctx.stroke();
  },

  // 악마 날개
  acc_devil_wings(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2 + 20;

    function drawBatWing(flipX) {
      ctx.beginPath();
      const dir = flipX ? -1 : 1;
      ctx.moveTo(cx + dir * 15, cy);
      // 날개 상단
      ctx.lineTo(cx + dir * 80, cy - 100);
      ctx.lineTo(cx + dir * 120, cy - 50);
      ctx.lineTo(cx + dir * 150, cy - 120);
      ctx.lineTo(cx + dir * 180, cy - 40);
      ctx.lineTo(cx + dir * 210, cy - 100);
      ctx.lineTo(cx + dir * 220, cy - 20);
      // 날개 하단
      ctx.bezierCurveTo(cx + dir * 200, cy + 40, cx + dir * 120, cy + 60, cx + dir * 15, cy);
      ctx.closePath();
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3);
      drawBatWing(false);
      ctx.stroke();
      drawBatWing(true);
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawBatWing(false);
    ctx.stroke();
    drawBatWing(true);
    ctx.stroke();
  },

  // 악마 뿔
  acc_devil_horns(ctx, color) {
    const cx = SIZE / 2;
    const baseY = SIZE / 2 + 60;

    function drawHorn(offsetX) {
      ctx.beginPath();
      const x = cx + offsetX;
      ctx.moveTo(x - 30, baseY);
      ctx.bezierCurveTo(x - 35, baseY - 60, x - 60, baseY - 120, x - 20, baseY - 170);
      ctx.bezierCurveTo(x + 10, baseY - 130, x + 20, baseY - 70, x + 30, baseY);
      ctx.closePath();
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3.5);
      drawHorn(-70);
      ctx.stroke();
      drawHorn(70);
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawHorn(-70);
    ctx.stroke();
    drawHorn(70);
    ctx.stroke();
  },

  // 천사 후광
  acc_angel_halo(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2 - 10;

    // 타원형 후광
    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 4);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 130, 40, -0.15, 0, Math.PI * 2);
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 2);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 130, 40, -0.15, 0, Math.PI * 2);
    ctx.stroke();

    // 빛줄기
    applyNeonStyle(ctx, color, 2);
    ctx.globalAlpha = 0.4;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 140, cy + Math.sin(angle) * 45);
      ctx.lineTo(cx + Math.cos(angle) * 160, cy + Math.sin(angle) * 55);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  // 토끼귀
  acc_bunny_ears(ctx, color) {
    const cx = SIZE / 2;
    const baseY = SIZE / 2 + 80;

    function drawEar(offsetX, tilt) {
      ctx.beginPath();
      const x = cx + offsetX;
      // 외부 윤곽
      ctx.moveTo(x - 25, baseY);
      ctx.bezierCurveTo(x - 35 + tilt, baseY - 100, x - 30 + tilt * 2, baseY - 210, x + tilt, baseY - 230);
      ctx.bezierCurveTo(x + 30 + tilt * 2, baseY - 210, x + 35 + tilt, baseY - 100, x + 25, baseY);
      ctx.closePath();
    }

    function drawInnerEar(offsetX, tilt) {
      ctx.beginPath();
      const x = cx + offsetX;
      ctx.moveTo(x - 12, baseY - 20);
      ctx.bezierCurveTo(x - 18 + tilt, baseY - 90, x - 15 + tilt * 1.5, baseY - 180, x + tilt * 0.5, baseY - 195);
      ctx.bezierCurveTo(x + 15 + tilt * 1.5, baseY - 180, x + 18 + tilt, baseY - 90, x + 12, baseY - 20);
      ctx.closePath();
    }

    // 외부
    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3.5);
      drawEar(-65, -8);
      ctx.stroke();
      drawEar(65, 8);
      ctx.stroke();
    }
    // 내부 라인
    applyNeonStyle(ctx, color, 2);
    ctx.globalAlpha = 0.5;
    drawInnerEar(-65, -8);
    ctx.stroke();
    drawInnerEar(65, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // 더블라인
    applyInnerLineStyle(ctx, 1.5);
    drawEar(-65, -8);
    ctx.stroke();
    drawEar(65, 8);
    ctx.stroke();
  },

  // 고양이귀
  acc_cat_ears(ctx, color) {
    const cx = SIZE / 2;
    const baseY = SIZE / 2 + 60;

    function drawCatEar(offsetX, dir) {
      ctx.beginPath();
      const x = cx + offsetX;
      ctx.moveTo(x - 55, baseY);
      ctx.lineTo(x + dir * 10, baseY - 160);
      ctx.lineTo(x + 55, baseY);
      ctx.closePath();
    }

    function drawInnerCatEar(offsetX, dir) {
      ctx.beginPath();
      const x = cx + offsetX;
      ctx.moveTo(x - 32, baseY - 15);
      ctx.lineTo(x + dir * 6, baseY - 120);
      ctx.lineTo(x + 32, baseY - 15);
      ctx.closePath();
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3.5);
      drawCatEar(-80, -1);
      ctx.stroke();
      drawCatEar(80, 1);
      ctx.stroke();
    }
    applyNeonStyle(ctx, color, 2);
    ctx.globalAlpha = 0.5;
    drawInnerCatEar(-80, -1);
    ctx.stroke();
    drawInnerCatEar(80, 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    applyInnerLineStyle(ctx, 1.5);
    drawCatEar(-80, -1);
    ctx.stroke();
    drawCatEar(80, 1);
    ctx.stroke();
  },

  // 콧수염
  acc_mustache(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2 + 20;

    function drawMustache() {
      ctx.beginPath();
      // 왼쪽 콧수염
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx - 30, cy - 30, cx - 80, cy - 50, cx - 140, cy - 40);
      ctx.bezierCurveTo(cx - 170, cy - 35, cx - 190, cy - 15, cx - 180, cy + 5);
      ctx.bezierCurveTo(cx - 165, cy + 25, cx - 130, cy + 15, cx - 100, cy + 5);
      ctx.bezierCurveTo(cx - 70, cy - 5, cx - 40, cy + 5, cx, cy + 15);
      // 오른쪽 콧수염 (대칭)
      ctx.bezierCurveTo(cx + 40, cy + 5, cx + 70, cy - 5, cx + 100, cy + 5);
      ctx.bezierCurveTo(cx + 130, cy + 15, cx + 165, cy + 25, cx + 180, cy + 5);
      ctx.bezierCurveTo(cx + 190, cy - 15, cx + 170, cy - 35, cx + 140, cy - 40);
      ctx.bezierCurveTo(cx + 80, cy - 50, cx + 30, cy - 30, cx, cy);
      ctx.closePath();
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3);
      drawMustache();
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawMustache();
    ctx.stroke();
  },

  // 나비넥타이
  acc_bowtie(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    function drawBowtie() {
      ctx.beginPath();
      // 왼쪽 나비
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx - 30, cy - 50, cx - 120, cy - 80, cx - 160, cy - 60);
      ctx.bezierCurveTo(cx - 180, cy - 50, cx - 180, cy - 20, cx - 170, cy);
      ctx.bezierCurveTo(cx - 180, cy + 20, cx - 180, cy + 50, cx - 160, cy + 60);
      ctx.bezierCurveTo(cx - 120, cy + 80, cx - 30, cy + 50, cx, cy);
      // 오른쪽 나비
      ctx.bezierCurveTo(cx + 30, cy - 50, cx + 120, cy - 80, cx + 160, cy - 60);
      ctx.bezierCurveTo(cx + 180, cy - 50, cx + 180, cy - 20, cx + 170, cy);
      ctx.bezierCurveTo(cx + 180, cy + 20, cx + 180, cy + 50, cx + 160, cy + 60);
      ctx.bezierCurveTo(cx + 120, cy + 80, cx + 30, cy + 50, cx, cy);
      ctx.closePath();
    }

    // 중앙 매듭
    function drawKnot() {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 18, 25, 0, 0, Math.PI * 2);
      ctx.closePath();
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3);
      drawBowtie();
      ctx.stroke();
      drawKnot();
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawBowtie();
    ctx.stroke();
    drawKnot();
    ctx.stroke();
  },

  // 티아라/왕관
  acc_tiara(ctx, color) {
    const cx = SIZE / 2;
    const baseY = SIZE / 2 + 40;

    function drawTiara() {
      ctx.beginPath();
      // 밴드
      ctx.moveTo(cx - 180, baseY);
      ctx.bezierCurveTo(cx - 160, baseY - 20, cx - 80, baseY - 30, cx, baseY - 25);
      ctx.bezierCurveTo(cx + 80, baseY - 30, cx + 160, baseY - 20, cx + 180, baseY);
      ctx.stroke();

      // 뾰족한 장식
      ctx.beginPath();
      const points = [
        { x: cx - 130, peakY: baseY - 70 },
        { x: cx - 65, peakY: baseY - 100 },
        { x: cx, peakY: baseY - 130 },
        { x: cx + 65, peakY: baseY - 100 },
        { x: cx + 130, peakY: baseY - 70 },
      ];

      ctx.moveTo(cx - 170, baseY - 15);
      for (const p of points) {
        ctx.lineTo(p.x, p.peakY);
        ctx.lineTo(p.x + 30, baseY - 25);
      }
      ctx.stroke();

      // 보석 (작은 원)
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.peakY + 15, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3);
      drawTiara();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawTiara();
  },

  // 입술
  acc_lips(ctx, color) {
    const cx = SIZE / 2;
    const cy = SIZE / 2;

    function drawLips() {
      ctx.beginPath();
      // 윗입술
      ctx.moveTo(cx - 120, cy);
      ctx.bezierCurveTo(cx - 100, cy - 50, cx - 40, cy - 70, cx, cy - 40);
      ctx.bezierCurveTo(cx + 40, cy - 70, cx + 100, cy - 50, cx + 120, cy);
      // 아랫입술
      ctx.bezierCurveTo(cx + 90, cy + 60, cx + 40, cy + 80, cx, cy + 65);
      ctx.bezierCurveTo(cx - 40, cy + 80, cx - 90, cy + 60, cx - 120, cy);
      ctx.closePath();
    }

    // 입술 중앙 라인
    function drawLipLine() {
      ctx.beginPath();
      ctx.moveTo(cx - 110, cy + 2);
      ctx.bezierCurveTo(cx - 50, cy + 15, cx + 50, cy + 15, cx + 110, cy + 2);
    }

    for (let i = 0; i < 2; i++) {
      applyNeonStyle(ctx, color, 3.5);
      drawLips();
      ctx.stroke();
      applyNeonStyle(ctx, color, 2);
      drawLipLine();
      ctx.stroke();
    }
    applyInnerLineStyle(ctx, 1.5);
    drawLips();
    ctx.stroke();
  },
};

// 메인 생성 로직
function generateSticker(name, drawFn, color) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');

  // 투명 배경
  ctx.clearRect(0, 0, SIZE, SIZE);

  // 스티커 그리기
  drawFn(ctx, color);

  // PNG로 저장
  const outPath = path.join(OUTPUT_DIR, `${name}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ ${name}.png 생성 완료`);
}

// 실행
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 새 액세서리 스티커 생성 시작...\n');

// 시안 계열
generateSticker('acc_angel_wings', stickerDrawers.acc_angel_wings, CYAN);
generateSticker('acc_bunny_ears', stickerDrawers.acc_bunny_ears, CYAN);
generateSticker('acc_angel_halo', stickerDrawers.acc_angel_halo, CYAN);
generateSticker('acc_mustache', stickerDrawers.acc_mustache, CYAN);
generateSticker('acc_tiara', stickerDrawers.acc_tiara, CYAN);

// 핑크 계열
generateSticker('acc_devil_wings', stickerDrawers.acc_devil_wings, PINK);
generateSticker('acc_devil_horns', stickerDrawers.acc_devil_horns, PINK);
generateSticker('acc_cat_ears', stickerDrawers.acc_cat_ears, PINK);
generateSticker('acc_bowtie', stickerDrawers.acc_bowtie, PINK);
generateSticker('acc_lips', stickerDrawers.acc_lips, PINK);

console.log('\n🎉 총 10개 스티커 생성 완료!');
