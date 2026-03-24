const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 500;
const BASE = path.resolve(__dirname, '../public/stickers/');

// SVG → PNG 변환 (전문 아이콘 퀄리티)
async function gen(svgInner, relPath, opts = {}) {
  const { sw = 1.2, vb = '0 0 24 24', fill = 'none' } = opts;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="${vb}" fill="${fill}" stroke="white" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${svgInner}</svg>`;
  const img = await loadImage(Buffer.from(svg));
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const fullPath = path.join(BASE, relPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, canvas.toBuffer('image/png'));
  console.log('  ✓', relPath);
}

// 별 꼭지점 계산
function starPts(cx, cy, R, r, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = (i * Math.PI / n) - Math.PI / 2;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// 소용돌이 SVG path
function spiralSvg(cx, cy, startR, growth, turns) {
  const d = [];
  for (let deg = 0; deg <= 360 * turns; deg += 3) {
    const a = (deg * Math.PI) / 180;
    const r = startR + deg * growth;
    d.push(`${deg === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<path d="${d.join(' ')}"/>`;
}

// 물결선 SVG path
function waveSvg(y0, amp) {
  const d = [];
  for (let x = 1; x <= 23; x += 0.3) {
    const y = y0 + amp * Math.sin((x - 1) / 22 * Math.PI * 3);
    d.push(`${d.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(2)}`);
  }
  return `<path d="${d.join(' ')}"/>`;
}

// 물결 원 SVG path
function wavyCircleSvg(cx, cy, R, wR, waves) {
  const d = [];
  for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.04) {
    const r = R + wR * Math.sin(a * waves);
    d.push(`${d.length === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<path d="${d.join(' ')} Z"/>`;
}

async function main() {
  // ==================== SHAPES (8) ====================
  console.log('SHAPES:');

  await gen('<circle cx="12" cy="12" r="10.5"/>', 'shapes/shape_circle.png', { sw: 1.3 });

  await gen('<polygon points="12,1.5 22.5,20.5 1.5,20.5"/>', 'shapes/shape_triangle.png', { sw: 1.3 });

  await gen('<rect x="1.5" y="1.5" width="21" height="21" rx="2.5"/>', 'shapes/shape_square.png', { sw: 1.3 });

  await gen(`<polygon points="${starPts(12, 12, 11, 4.4, 5)}"/>`, 'shapes/shape_star.png', { sw: 1.3 });

  await gen('<polygon points="12,1 23,12 12,23 1,12"/>', 'shapes/shape_diamond.png', { sw: 1.3 });

  await gen('<polygon points="21.5,6.5 21.5,17.5 12,23 2.5,17.5 2.5,6.5 12,1"/>', 'shapes/shape_hexagon.png', { sw: 1.3 });

  // Lucide heart
  await gen('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>', 'shapes/shape_heart.png', { sw: 1.3 });

  await gen('<path d="M9 1h6v8h8v6h-8v8H9v-8H1V9h8z"/>', 'shapes/shape_cross.png', { sw: 1.3 });

  // ==================== SYMBOLS (15) ====================
  console.log('SYMBOLS:');

  // Lucide zap
  await gen('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>', 'symbols/symbol_lightning.png');

  // Lucide moon
  await gen('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>', 'symbols/symbol_crescent.png');

  // 4-point sparkle
  await gen('<path d="M12 1 L13.8 9.2 L22 12 L13.8 14.8 L12 23 L10.2 14.8 L2 12 L10.2 9.2 Z"/>', 'symbols/symbol_sparkle.png', { sw: 1.1 });

  // Lucide infinity
  await gen('<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>', 'symbols/symbol_infinity.png');

  // Crown
  await gen(`
    <path d="M4 20V8l4 5 4-9 4 9 4-5v12z"/>
    <line x1="3" y1="20" x2="21" y2="20"/>
  `, 'symbols/symbol_crown.png');

  // Lucide arrow-right
  await gen(`
    <line x1="4" y1="12" x2="20" y2="12"/>
    <polyline points="14 6 20 12 14 18"/>
  `, 'symbols/symbol_arrow.png', { sw: 1.4 });

  // Lucide music (double note)
  await gen(`
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6" cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  `, 'symbols/symbol_music.png');

  // 물결 (3줄)
  await gen(`
    ${waveSvg(7, 3)}
    ${waveSvg(12, 3)}
    ${waveSvg(17, 3)}
  `, 'symbols/symbol_wave.png');

  // Lucide message-square
  await gen('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', 'symbols/symbol_speech.png');

  // Lucide camera
  await gen(`
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  `, 'symbols/symbol_camera.png');

  // Lucide film
  await gen(`
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <line x1="7" y1="3" x2="7" y2="21"/>
    <line x1="17" y1="3" x2="17" y2="21"/>
    <line x1="3" y1="7.5" x2="7" y2="7.5"/>
    <line x1="3" y1="12" x2="7" y2="12"/>
    <line x1="3" y1="16.5" x2="7" y2="16.5"/>
    <line x1="17" y1="7.5" x2="21" y2="7.5"/>
    <line x1="17" y1="12" x2="21" y2="12"/>
    <line x1="17" y1="16.5" x2="21" y2="16.5"/>
  `, 'symbols/symbol_film.png');

  // Ribbon/bow
  await gen(`
    <path d="M12 12 C9 6, 2 6, 3 12 C4 18, 9 18, 12 12"/>
    <path d="M12 12 C15 6, 22 6, 21 12 C20 18, 15 18, 12 12"/>
    <line x1="10.5" y1="14" x2="6" y2="22"/>
    <line x1="13.5" y1="14" x2="18" y2="22"/>
    <circle cx="12" cy="12" r="1.5" fill="white"/>
  `, 'symbols/symbol_ribbon.png');

  // 소용돌이
  await gen(spiralSvg(12, 12, 0.8, 0.008, 3.5), 'symbols/symbol_spiral.png');

  // Lucide cloud
  await gen('<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>', 'symbols/symbol_cloud.png');

  // Lucide flame
  await gen('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', 'symbols/symbol_flame.png');

  // ==================== ACCESSORIES (8 original) ====================
  console.log('ACCESSORIES (original):');

  // 동그란안경
  await gen(`
    <circle cx="7" cy="13" r="5"/>
    <circle cx="17" cy="13" r="5"/>
    <path d="M12 11 Q12 9 12 11"/>
    <path d="M11.2 10.8 Q12 9 12.8 10.8"/>
    <line x1="2" y1="11" x2="0" y2="9.5"/>
    <line x1="22" y1="11" x2="24" y2="9.5"/>
  `, 'accessories/acc_round_glasses.png');

  // 에비에이터
  await gen(`
    <path d="M11.5 9.5 C10.5 7.5, 4.5 7, 3 10.5 C1.5 14, 4 17.5, 7 17.5 C10 17.5, 11.5 14.5, 11.5 9.5"/>
    <path d="M12.5 9.5 C13.5 7.5, 19.5 7, 21 10.5 C22.5 14, 20 17.5, 17 17.5 C14 17.5, 12.5 14.5, 12.5 9.5"/>
    <path d="M11.5 10 Q12 8.5 12.5 10"/>
    <line x1="3" y1="9" x2="0" y2="7.5"/>
    <line x1="21" y1="9" x2="24" y2="7.5"/>
  `, 'accessories/acc_aviator.png');

  // 캣아이
  await gen(`
    <path d="M11.5 13 C11.5 9.5, 7.5 7, 2.5 7 C4 9, 4.5 11, 4 13.5 C3.5 16.5, 7 17, 11.5 16.5 Z"/>
    <path d="M12.5 13 C12.5 9.5, 16.5 7, 21.5 7 C20 9, 19.5 11, 20 13.5 C20.5 16.5, 17 17, 12.5 16.5 Z"/>
    <path d="M11.5 13 Q12 11.5 12.5 13"/>
  `, 'accessories/acc_cat_eye.png');

  // 하트안경
  await gen(`
    <path d="M7 17 C5.5 15, 2.5 13.5, 2.5 11 C2.5 8.8, 4.2 8, 7 10 C9.8 8, 11.5 8.8, 11.5 11 C11.5 13.5, 8.5 15, 7 17"/>
    <path d="M17 17 C15.5 15, 12.5 13.5, 12.5 11 C12.5 8.8, 14.2 8, 17 10 C19.8 8, 21.5 8.8, 21.5 11 C21.5 13.5, 18.5 15, 17 17"/>
    <path d="M11.5 10.5 Q12 9 12.5 10.5"/>
    <line x1="2.5" y1="10" x2="0" y2="8.5"/>
    <line x1="21.5" y1="10" x2="24" y2="8.5"/>
  `, 'accessories/acc_heart_glasses.png');

  // 별안경
  await gen(`
    <polygon points="${starPts(7, 13, 5.5, 2.5, 5)}"/>
    <polygon points="${starPts(17, 13, 5.5, 2.5, 5)}"/>
    <line x1="11" y1="13" x2="13" y2="13"/>
    <line x1="1.5" y1="11" x2="0" y2="9.5"/>
    <line x1="22.5" y1="11" x2="24" y2="9.5"/>
  `, 'accessories/acc_star_glasses.png');

  // 픽셀안경
  const pxSvg = (() => {
    const ps = 1.3, ox = 0.3, oy = 10;
    const rects = [];
    const px = (gx, gy) => rects.push(`<rect x="${(ox + gx * ps).toFixed(1)}" y="${(oy + gy * ps).toFixed(1)}" width="${(ps - 0.15).toFixed(2)}" height="${(ps - 0.15).toFixed(2)}" fill="white" stroke="none"/>`);
    for (let x = 0; x <= 6; x++) { px(x, 0); px(x, 3); }
    for (let x = 11; x <= 17; x++) { px(x, 0); px(x, 3); }
    [1, 2].forEach(gy => { px(0, gy); px(6, gy); px(11, gy); px(17, gy); });
    [7, 8, 9, 10].forEach(x => px(x, 2));
    px(-1, 1); px(-2, 1);
    px(18, 1); px(19, 1);
    return rects.join('\n');
  })();
  await gen(pxSvg, 'accessories/acc_pixel_glasses.png', { sw: 0 });

  // 선글라스 (thuglife)
  await gen(`
    <rect x="1" y="10" width="9" height="5" rx="1"/>
    <rect x="14" y="10" width="9" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
    <line x1="1" y1="11" x2="-1" y2="9.5"/>
    <line x1="23" y1="11" x2="25" y2="9.5"/>
  `, 'accessories/acc_thuglife.png');

  // 파티안경
  await gen(`
    ${wavyCircleSvg(7, 13, 5, 1, 6)}
    ${wavyCircleSvg(17, 13, 5, 1, 6)}
    <line x1="11" y1="13" x2="13" y2="13"/>
    <line x1="2" y1="11" x2="0" y2="9.5"/>
    <line x1="22" y1="11" x2="24" y2="9.5"/>
  `, 'accessories/acc_party.png');

  // ==================== USER ASSETS ====================
  console.log('\nUSER ASSETS (from source files):');
  const mapping = [
    ['angel_wings-removebg-preview.png', 'acc_angel_wings.png'],
    ['bunny-ears-rabbit-icon-vector-260nw-1396838921-removebg-preview.png', 'acc_bunny_ears.png'],
    ['cat_ears-removebg-preview.png', 'acc_cat_ears.png'],
    ['cat_mouth-removebg-preview.png', 'acc_cat_mouth.png'],
    ['cute_fox_ears_1773568924120-removebg-preview.png', 'acc_fox_ears.png'],
    ['cute_rabbit_ears_1773568893502-removebg-preview.png', 'acc_rabbit_ears.png'],
    ['dog-jack-russell-ear-icon-vector-removebg-preview.png', 'acc_floppy_ears.png'],
  ];
  for (const [src, target] of mapping) {
    const srcPath = path.join(BASE, 'accessories', src);
    const tgtPath = path.join(BASE, 'accessories', target);
    if (!fs.existsSync(srcPath)) { console.log('  ✗ Missing:', src); continue; }
    const buf = fs.readFileSync(srcPath);
    const img = await loadImage(buf);
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    const scale = Math.min(460 / img.width, 460 / img.height);
    const w = img.width * scale, h = img.height * scale;
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    fs.writeFileSync(tgtPath, canvas.toBuffer('image/png'));
    console.log('  ✓', target);
  }

  console.log('\nDone! 31 SVG-rendered + 7 user assets.');
}

main().catch(console.error);
