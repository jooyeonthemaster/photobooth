// ─────────────────────────────────────────────────────────────────────────
// PIN 합성 모델 A/B 라이브 테스트 (v2 — 파라미터 교정판)
//
// 신규 후보 Wan 2.7 edit vs HiDream-O1 dev/edit 를 동일 입력/프롬프트로 비교.
// (Seedream v5 lite 는 짱구에서 content_policy_violation 으로 거부 확인됨 → 기본 비활성)
//
// 교정 내역:
//  - Wan 은 prompt 최대 2000자 → 프롬프트를 핵심만 담아 ~1.6K로 압축(SHORT_PROMPT)
//  - HiDream 은 레퍼런스 최소 512x512 → 작은 레퍼런스(짱구 259x320)를 흰 배경에 업스케일
//  - 입력은 fal.storage.upload 로 올려 URL 전달
//
// 실행:  node scripts/model-ab-test.mjs            (셀피 1,2,3 전부)
//        node scripts/model-ab-test.mjs public/1.jpg   (특정 셀피만)
// ─────────────────────────────────────────────────────────────────────────

import { fal } from '@fal-ai/client';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── 입력 ───────────────────────────────────────────────────────────────────
const SELFIES = process.argv.length > 2
  ? process.argv.slice(2).map((p) => resolve(ROOT, p))
  : ['public/1.jpg', 'public/2.jpg', 'public/3.jpg'].map((p) => resolve(ROOT, p));
const REFERENCE = resolve(ROOT, 'public/reference.png'); // 짱구
const CALL_TIMEOUT_MS = 180000;
const REF_MIN_SIDE = 768; // 레퍼런스 최소 변 (HiDream 512 하한 + 여유)

// 강화판: 유저를 '레퍼런스 그림체 캐릭터로 리드로우' + '한 컷에 함께'를 강하게 명시 (HiDream 실패 대응).
const SHORT_PROMPT = [
  'Image 1 is a photo of the real user(s). Image 2 is a reference cartoon/illustrated character.',
  'Generate a 2x2 grid of 4 panels, edge-to-edge, no borders or gaps.',
  "CRITICAL — FULL RESTYLE: Redraw the user(s) from image 1 as fully illustrated cartoon characters in image 2's EXACT art style (same line weight, shading, coloring, proportions, eye style). The user must NOT remain a photograph — convert them completely into a drawn character that looks like it belongs in image 2's cartoon.",
  'In EVERY panel, the redrawn user and the character from image 2 appear TOGETHER in one shared photobooth frame, same drawing style, same world, interacting like friends taking a photo together.',
  "Keep the user's facial features recognizable within that cartoon style, and preserve the reference character's exact design (face, hair, outfit, colors).",
  'Panel 1: leaning in close, looking at camera. Panel 2: one behind, chin on the other\'s shoulder. Panel 3: peace signs. Panel 4: high-angle from above, both looking up.',
  'Keep both subjects fully inside each panel with margin; vary camera distance and angle per panel.',
  'Forbidden: keeping the user photographic, placing them in separate panels, tongue out, duck face. Background: white-to-light-gray gradient. No text, watermarks, or logos.',
].join(' ');

// ── 모델별 입력 스키마 ──────────────────────────────────────────────────────
const MODELS = [
  {
    key: 'nb2-lite-edit-1K',
    id: 'google/nano-banana-2-lite/edit',
    build: (prompt, urls) => ({ prompt, image_urls: urls, num_images: 1 }),
  },
  {
    key: 'nb2-full-edit-2K',
    id: 'fal-ai/nano-banana-2/edit',
    build: (prompt, urls) => ({ prompt, image_urls: urls, resolution: '2K', num_images: 1, safety_tolerance: 6 }),
  },
  // 이전 라운드: qwen-2511=왜곡 / flux-2-dev=화풍부족 / wan-2.7=IP거부 / hidream=융합실패. 필요시 주석 해제.
  // { key: 'qwen-image-edit-2511', id: 'fal-ai/qwen-image-edit-2511', build: (p, u) => ({ prompt: p, image_urls: u, image_size: { width: 2048, height: 2048 }, num_images: 1, enable_safety_checker: false, output_format: 'jpeg' }) },
  // { key: 'flux-2-dev-edit', id: 'fal-ai/flux-2/edit', build: (p, u) => ({ prompt: p, image_urls: u, image_size: { width: 2048, height: 2048 }, num_images: 1, enable_safety_checker: false, output_format: 'jpeg' }) },
];

// ── 유틸 ───────────────────────────────────────────────────────────────────
function loadFalKey() {
  const m = readFileSync(resolve(ROOT, '.env.local'), 'utf8').match(/^\s*FAL_KEY\s*=\s*(.+)\s*$/m);
  if (!m) throw new Error('.env.local 에서 FAL_KEY 를 찾지 못했습니다.');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

async function uploadBuffer(buf, type) {
  return fal.storage.upload(new Blob([buf], { type }));
}
async function uploadLocal(path) {
  return uploadBuffer(readFileSync(path), MIME[extname(path).slice(1).toLowerCase()] || 'image/jpeg');
}

// 작은 레퍼런스를 흰 배경 위에 업스케일 → 최소 변 REF_MIN_SIDE 이상 보장(투명 PNG 평탄화)
async function uploadUpscaledReference(path) {
  const img = await loadImage(path);
  const scale = Math.max(1, REF_MIN_SIDE / Math.min(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const cv = createCanvas(w, h);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  console.log(`  레퍼런스 업스케일: ${img.width}x${img.height} → ${w}x${h}`);
  return uploadBuffer(cv.toBuffer('image/jpeg', { quality: 0.95 }), 'image/jpeg');
}

function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms (${label})`)), ms))]);
}
async function downloadTo(url, outPath) {
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return buf.length;
}

// ── 실행 ───────────────────────────────────────────────────────────────────
async function main() {
  fal.config({ credentials: loadFalKey() });
  console.log(`프롬프트 길이: ${SHORT_PROMPT.length}자 (Wan 한도 2000)`);

  const outDir = resolve(__dirname, 'ab-output');
  mkdirSync(outDir, { recursive: true });

  console.log('레퍼런스 업로드(업스케일):', basename(REFERENCE));
  const refUrl = await uploadUpscaledReference(REFERENCE);
  console.log('  →', refUrl);

  const summary = [];
  for (const selfiePath of SELFIES) {
    const selfieName = basename(selfiePath, extname(selfiePath));
    console.log(`\n=== 셀피 ${basename(selfiePath)} 업로드 ===`);
    const selfieUrl = await uploadLocal(selfiePath);
    const urls = [selfieUrl, refUrl]; // image1=유저, image2=레퍼런스(짱구)

    for (const model of MODELS) {
      const t0 = Date.now();
      process.stdout.write(`▶ ${selfieName} × ${model.key} ...`);
      try {
        const result = await withTimeout(fal.subscribe(model.id, { input: model.build(SHORT_PROMPT, urls) }), CALL_TIMEOUT_MS, model.key);
        const img = result?.data?.images?.[0] || result?.images?.[0];
        const sec = ((Date.now() - t0) / 1000).toFixed(1);
        if (!img?.url) throw new Error('결과 이미지 없음: ' + JSON.stringify(result?.data ?? result).slice(0, 200));
        const outPath = resolve(outDir, `${selfieName}__${model.key}.jpg`);
        const bytes = await downloadTo(img.url, outPath);
        console.log(` ✅ ${sec}s → ${basename(outPath)} (${(bytes / 1024).toFixed(0)}KB)`);
        summary.push({ selfie: selfieName, model: model.key, result: 'OK', sec });
      } catch (err) {
        const sec = ((Date.now() - t0) / 1000).toFixed(1);
        let detail = err?.message || String(err);
        if (err?.body) { try { detail += ' :: ' + JSON.stringify(err.body).slice(0, 300); } catch {} }
        if (err?.status) detail = `HTTP ${err.status} — ` + detail;
        console.log(` ❌ ${sec}s → ${detail}`);
        summary.push({ selfie: selfieName, model: model.key, result: 'FAIL', sec, note: detail });
      }
    }
  }

  console.log('\n──────────────── 요약 ────────────────');
  for (const s of summary) {
    console.log(`${s.result === 'OK' ? '✅' : '❌'} ${s.selfie} × ${s.model.padEnd(20)} ${String(s.sec).padStart(6)}s${s.note ? '  (' + s.note.slice(0, 80) + ')' : ''}`);
  }
  console.log(`\n결과 폴더: ${outDir}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
