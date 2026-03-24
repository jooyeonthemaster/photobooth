/**
 * 천사 날개 / 악마 날개 고퀄리티 PNG 생성
 * - 검은색 라인아트 on 투명 배경
 * - source-atop 틴팅과 호환
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'stickers', 'accessories');
const SIZE = 800; // 고해상도

// ========== 천사 날개 ==========
function drawAngelWings() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  ctx.strokeStyle = '#000000';
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- 왼쪽 날개 ---
  ctx.beginPath();
  // 날개 상단 곡선 (몸통 연결부 → 위쪽 끝)
  ctx.moveTo(cx - 30, cy - 20);
  ctx.bezierCurveTo(cx - 80, cy - 180, cx - 250, cy - 300, cx - 340, cy - 240);
  // 날개 뒤쪽 곡선 (위쪽 끝 → 왼쪽 끝)
  ctx.bezierCurveTo(cx - 380, cy - 220, cx - 390, cy - 160, cx - 370, cy - 100);
  // 깃털 scallop 곡선 (아래로)
  ctx.bezierCurveTo(cx - 360, cy - 60, cx - 340, cy - 30, cx - 310, cy + 10);
  ctx.bezierCurveTo(cx - 290, cy + 40, cx - 260, cy + 60, cx - 230, cy + 70);
  ctx.bezierCurveTo(cx - 200, cy + 80, cx - 170, cy + 70, cx - 150, cy + 90);
  ctx.bezierCurveTo(cx - 130, cy + 100, cx - 100, cy + 90, cx - 80, cy + 100);
  ctx.bezierCurveTo(cx - 60, cy + 110, cx - 45, cy + 90, cx - 30, cy + 60);
  // 아래쪽 → 몸통 복귀
  ctx.bezierCurveTo(cx - 25, cy + 30, cx - 28, cy + 5, cx - 30, cy - 20);
  ctx.stroke();

  // 왼쪽 날개 내부 깃털 라인들
  ctx.lineWidth = 2.5;

  // 깃털 1
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 10);
  ctx.bezierCurveTo(cx - 120, cy - 100, cx - 220, cy - 180, cx - 310, cy - 200);
  ctx.stroke();

  // 깃털 2
  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + 10);
  ctx.bezierCurveTo(cx - 130, cy - 40, cx - 240, cy - 80, cx - 350, cy - 80);
  ctx.stroke();

  // 깃털 3
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 30);
  ctx.bezierCurveTo(cx - 120, cy + 10, cx - 220, cy - 10, cx - 320, cy + 10);
  ctx.stroke();

  // 깃털 4 (짧은)
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 50);
  ctx.bezierCurveTo(cx - 100, cy + 50, cx - 160, cy + 40, cx - 220, cy + 60);
  ctx.stroke();

  // 깃털 끝 곡선 장식 (scallop 디테일)
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const startX = cx - 370 + i * 30;
    const startY = cy - 100 + i * 35;
    ctx.beginPath();
    ctx.arc(startX + 15, startY + 10, 12, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();
  }

  // --- 오른쪽 날개 (좌우 반전) ---
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(-1, 1);
  ctx.translate(-cx, 0);

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 20);
  ctx.bezierCurveTo(cx - 80, cy - 180, cx - 250, cy - 300, cx - 340, cy - 240);
  ctx.bezierCurveTo(cx - 380, cy - 220, cx - 390, cy - 160, cx - 370, cy - 100);
  ctx.bezierCurveTo(cx - 360, cy - 60, cx - 340, cy - 30, cx - 310, cy + 10);
  ctx.bezierCurveTo(cx - 290, cy + 40, cx - 260, cy + 60, cx - 230, cy + 70);
  ctx.bezierCurveTo(cx - 200, cy + 80, cx - 170, cy + 70, cx - 150, cy + 90);
  ctx.bezierCurveTo(cx - 130, cy + 100, cx - 100, cy + 90, cx - 80, cy + 100);
  ctx.bezierCurveTo(cx - 60, cy + 110, cx - 45, cy + 90, cx - 30, cy + 60);
  ctx.bezierCurveTo(cx - 25, cy + 30, cx - 28, cy + 5, cx - 30, cy - 20);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 40, cy - 10);
  ctx.bezierCurveTo(cx - 120, cy - 100, cx - 220, cy - 180, cx - 310, cy - 200);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 38, cy + 10);
  ctx.bezierCurveTo(cx - 130, cy - 40, cx - 240, cy - 80, cx - 350, cy - 80);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 30);
  ctx.bezierCurveTo(cx - 120, cy + 10, cx - 220, cy - 10, cx - 320, cy + 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 40, cy + 50);
  ctx.bezierCurveTo(cx - 100, cy + 50, cx - 160, cy + 40, cx - 220, cy + 60);
  ctx.stroke();

  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const startX = cx - 370 + i * 30;
    const startY = cy - 100 + i * 35;
    ctx.beginPath();
    ctx.arc(startX + 15, startY + 10, 12, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();
  }

  ctx.restore();

  // --- 후광 (가운데 위) ---
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 180, 40, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 후광 두께감
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 180, 35, 12, 0, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  return canvas;
}

// ========== 악마 날개 ==========
function drawDevilWings() {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  ctx.strokeStyle = '#000000';
  ctx.fillStyle = 'transparent';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- 왼쪽 박쥐 날개 ---
  ctx.beginPath();
  // 상단 뼈대 (몸통 → 위쪽 뾰족 끝)
  ctx.moveTo(cx - 30, cy - 20);
  ctx.bezierCurveTo(cx - 60, cy - 100, cx - 150, cy - 260, cx - 280, cy - 280);
  // 첫 번째 막 뾰족점
  ctx.bezierCurveTo(cx - 310, cy - 285, cx - 330, cy - 270, cx - 350, cy - 250);
  // 첫 번째 막 안쪽 곡선 (들어가는 부분)
  ctx.bezierCurveTo(cx - 320, cy - 180, cx - 300, cy - 140, cx - 310, cy - 120);
  // 두 번째 막 뾰족점
  ctx.bezierCurveTo(cx - 330, cy - 140, cx - 360, cy - 160, cx - 380, cy - 140);
  // 두 번째 막 안쪽 곡선
  ctx.bezierCurveTo(cx - 360, cy - 80, cx - 340, cy - 40, cx - 330, cy - 10);
  // 세 번째 막 뾰족점
  ctx.bezierCurveTo(cx - 350, cy - 20, cx - 370, cy - 40, cx - 380, cy - 10);
  // 날개 하단
  ctx.bezierCurveTo(cx - 360, cy + 30, cx - 310, cy + 60, cx - 260, cy + 70);
  // 하단 막 뾰족점
  ctx.bezierCurveTo(cx - 250, cy + 40, cx - 230, cy + 20, cx - 200, cy + 40);
  // 몸통 복귀
  ctx.bezierCurveTo(cx - 150, cy + 60, cx - 80, cy + 50, cx - 30, cy + 30);
  ctx.bezierCurveTo(cx - 28, cy + 10, cx - 28, cy - 5, cx - 30, cy - 20);
  ctx.stroke();

  // 왼쪽 날개 뼈대 라인들 (내부 구조)
  ctx.lineWidth = 3;

  // 주 뼈대 1 (위쪽)
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy - 10);
  ctx.bezierCurveTo(cx - 100, cy - 120, cx - 200, cy - 220, cx - 290, cy - 270);
  ctx.stroke();

  // 주 뼈대 2 (중간)
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 5);
  ctx.bezierCurveTo(cx - 120, cy - 50, cx - 240, cy - 80, cx - 350, cy - 130);
  ctx.stroke();

  // 주 뼈대 3 (하단)
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 20);
  ctx.bezierCurveTo(cx - 120, cy + 10, cx - 230, cy - 10, cx - 340, cy - 5);
  ctx.stroke();

  // 뼈대 4 (최하단)
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 30);
  ctx.bezierCurveTo(cx - 100, cy + 40, cx - 180, cy + 50, cx - 250, cy + 60);
  ctx.stroke();

  // --- 오른쪽 박쥐 날개 (좌우 반전) ---
  ctx.save();
  ctx.translate(cx, 0);
  ctx.scale(-1, 1);
  ctx.translate(-cx, 0);

  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 20);
  ctx.bezierCurveTo(cx - 60, cy - 100, cx - 150, cy - 260, cx - 280, cy - 280);
  ctx.bezierCurveTo(cx - 310, cy - 285, cx - 330, cy - 270, cx - 350, cy - 250);
  ctx.bezierCurveTo(cx - 320, cy - 180, cx - 300, cy - 140, cx - 310, cy - 120);
  ctx.bezierCurveTo(cx - 330, cy - 140, cx - 360, cy - 160, cx - 380, cy - 140);
  ctx.bezierCurveTo(cx - 360, cy - 80, cx - 340, cy - 40, cx - 330, cy - 10);
  ctx.bezierCurveTo(cx - 350, cy - 20, cx - 370, cy - 40, cx - 380, cy - 10);
  ctx.bezierCurveTo(cx - 360, cy + 30, cx - 310, cy + 60, cx - 260, cy + 70);
  ctx.bezierCurveTo(cx - 250, cy + 40, cx - 230, cy + 20, cx - 200, cy + 40);
  ctx.bezierCurveTo(cx - 150, cy + 60, cx - 80, cy + 50, cx - 30, cy + 30);
  ctx.bezierCurveTo(cx - 28, cy + 10, cx - 28, cy - 5, cx - 30, cy - 20);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 35, cy - 10);
  ctx.bezierCurveTo(cx - 100, cy - 120, cx - 200, cy - 220, cx - 290, cy - 270);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 5);
  ctx.bezierCurveTo(cx - 120, cy - 50, cx - 240, cy - 80, cx - 350, cy - 130);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 20);
  ctx.bezierCurveTo(cx - 120, cy + 10, cx - 230, cy - 10, cx - 340, cy - 5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 35, cy + 30);
  ctx.bezierCurveTo(cx - 100, cy + 40, cx - 180, cy + 50, cx - 250, cy + 60);
  ctx.stroke();

  ctx.restore();

  return canvas;
}

// ========== 저장 ==========
function saveCanvas(canvas, filename) {
  const filePath = path.join(OUTPUT_DIR, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ ${filename} (${buffer.length} bytes)`);
}

// 실행
console.log('🎨 고퀄리티 날개 에셋 생성...');
saveCanvas(drawAngelWings(), 'acc_angel_wings.png');
saveCanvas(drawDevilWings(), 'acc_devil_wings.png');
console.log('✅ 완료! public/stickers/accessories/ 에서 확인하세요.');
