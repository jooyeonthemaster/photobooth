// 스타일 레퍼런스 갤러리 생성 — 셀피 1장을 각 화풍으로 단일 초상 렌더(NB2 Lite) → 갤러리 HTML
import { fal } from '@fal-ai/client';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(__dirname, 'style-gallery');
mkdirSync(OUT, { recursive: true });

const FAL_KEY = readFileSync(resolve(ROOT, '.env.local'), 'utf8').match(/^\s*FAL_KEY\s*=\s*(.+)$/m)[1].trim().replace(/^["']|["']$/g, '');
fal.config({ credentials: FAL_KEY });

const SELFIE = resolve(ROOT, 'public/1.jpg');

const CATS = { webtoon: '#ff6f9c', anime: '#5b8cff', cute: '#3fe0b0', render3d: '#ffb454', niche: '#b98cff' };
const CATLABEL = { webtoon: '웹툰·만화', anime: '일본 애니', cute: '큐트·데포르메', render3d: '3D·렌더·토이', niche: '트렌디·니치' };

const STYLES = [
  ['감성 웹툰', 'Soft Casual Webtoon', 'webtoon', 'a soft casual Korean slice-of-life webtoon style — thin nearly-lineless outlines, flat soft shading, a warm muted pastel palette, calm medium eyes, cozy and understated'],
  ['반실사 웹툰', 'Detailed Semi-Real Manhwa', 'webtoon', 'a polished semi-realistic Korean manhwa style — crisp precise linework, realistic proportions and facial anatomy, small refined eyes with a strong upper-lash line, smooth airbrush gradient rendering with glossy skin, a deep-blue and warm-brown cinematic palette, mature'],
  ['순정 웹툰', 'Sparkly Romance Webtoon', 'webtoon', 'a dreamy Korean sunjeong romance webtoon — delicate thin linework, huge glittering sparkling eyes with star highlights, long flowing detailed hair, soft pastel colors with flower and glow accents, idol-pretty'],
  ['로판 웹툰', 'Fantasy-Romance Webtoon', 'webtoon', 'an opulent Korean fantasy-romance (otome-isekai) webtoon — elegant delicate linework, large jewel-like eyes, an ornate royal outfit and jewelry, luminous sparkles over hair and eyes, saturated jewel-tone colors with soft glow, luxurious and fairytale-like'],
  ['모던 하이임팩트 셀', 'Modern High-Impact Anime Cel', 'anime', 'a bold modern Japanese TV-anime cel style — crisp thick clean outlines, flat cel shading with hard sharp shadow edges, punchy high-saturation colors, glossy rim light and subtle digital glow, big glossy anime eyes, sleek and polished'],
  ['아이돌 스타아이', 'Idol Star-Eye (Oshi no Ko)', 'anime', 'a modern idol-anime style with hyper-detailed eyes — a clean simple face contrasted with elaborate glossy eyes full of star and galaxy-shaped highlights and color gradients, vivid colorful hair, sleek trendy idol styling, bright and glittery'],
  ['신카이 마코토', 'Makoto Shinkai Cinematic', 'anime', 'a Makoto Shinkai cinematic anime style — soft clean linework, warm golden-hour lighting with lens flare and glowing bokeh, a deep-blue-shadow to orange-highlight color grade, large glossy emotional eyes, dreamy and romantic'],
  ['지브리 손그림', 'Studio Ghibli Hand-Painted', 'anime', 'a Studio Ghibli hand-drawn style — gentle clean line art, a flat soft-colored character against a warm hand-painted watercolor background, soft natural daylight, a cozy nostalgic muted palette, a rounded friendly face with simple expressive eyes, storybook-like'],
  ['큐트 치비', 'Chibi (Super-Deformed)', 'cute', 'a cute Japanese chibi super-deformed style — an oversized round head on a tiny body, huge glossy sparkling anime eyes, a tiny nose and mouth, clean bold outlines, soft flat cel shading, candy-pastel colors, adorable'],
  ['카톡 이모티콘', 'Messenger Emoticon Sticker', 'cute', 'a Korean messenger emoticon sticker style — very thick uniform rounded outlines, extremely simplified flat pastel fills with almost no shading, a big round head with tiny dot eyes and an expressive mouth, exaggerated cute emotion, a clean sticker look on plain white'],
  ['3D 피규어', 'Glossy Collectible Figurine', 'render3d', 'a glossy collectible chibi figurine style — a smooth hard PVC/vinyl toy with big-head small-body proportions, a glossy plastic surface with soft reflective highlights, simplified cute sculpted features, Pop Mart blind-box studio product lighting'],
  ['디즈니 프린세스 3D', 'Disney Heroine 3D', 'render3d', 'a Walt Disney heroine 3D style — soft dewy porcelain skin, large sparkling doe eyes with long lashes, delicate rounded features, glossy voluminous hair, rosy blush, warm magical rim lighting, a Disney princess movie render'],
  ['플러시 인형', 'Soft Plush (Jellycat)', 'render3d', 'a soft plush stuffed-toy style — the person reimagined as a cuddly fabric plushie with fuzzy fleece texture, visible stitched seams, small shiny embroidered bead eyes, a chubby rounded stuffed body, soft studio lighting, cozy and huggable'],
  ['클레이 스톱모션', 'Claymation', 'render3d', 'a handmade claymation clay style — sculpted from soft matte modeling clay with visible fingerprints and slight asymmetry, oversized round eyes, simplified sculpted features, warm tactile stop-motion studio lighting'],
  ['아케인 페인터리 3D', 'Arcane / Fortiche Painterly 3D', 'render3d', 'an Arcane (Fortiche) painterly 3D style — hand-painted oil-brush textures over 3D forms, visible brushstrokes and slightly shaky linework, moody dramatic cinematic lighting, a gritty graphic-novel atmosphere with rich teal-and-amber color'],
  ['스파이더버스 3D', 'Spider-Verse Stylized 3D', 'render3d', 'a Spider-Verse stylized 3D comic style — bold inked outlines, Ben-Day halftone dots and cross-hatching on the shading, subtle chromatic-aberration RGB color offset, a punchy oversaturated comic-book palette, dynamic pop energy'],
  ['Y2K 사이버 크롬', 'Y2K Cyber Chrome', 'niche', 'a Y2K cyber-chrome aesthetic — glossy liquid-chrome and iridescent holographic surfaces, bubbly rounded forms, candy metallic gradients, twinkling sparkles and lens flare, a hot-pink cyan and silver palette, an optimistic techno-pop mood'],
  ['색연필 키드코어', 'Colored-Pencil Kidcore', 'niche', 'a naive colored-pencil and crayon style — wobbly childlike hand-drawn outlines, waxy crayon and pencil texture, bright unblended kidcore colors, charmingly imperfect proportions, a cozy hand-doodled scrapbook warmth'],
  ['몽환 수채화', 'Dreamy Watercolor', 'niche', 'a soft watercolor storybook style — gentle wet watercolor washes and gouache texture, a muted dreamy pastel palette, delicate simplified features, warm golden picture-book lighting, hand-painted tenderness on textured paper'],
];

const slug = s => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
async function uploadLocal(p) {
  return fal.storage.upload(new Blob([readFileSync(p)], { type: 'image/jpeg' }));
}
function withTimeout(pr, ms) { return Promise.race([pr, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]); }
async function toThumb(buf, max = 560) {
  const img = await loadImage(buf);
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  const cv = createCanvas(w, h); cv.getContext('2d').drawImage(img, 0, 0, w, h);
  return cv.toBuffer('image/jpeg', { quality: 0.82 });
}

async function main() {
  console.log('셀피 업로드...');
  const selfieUrl = await uploadLocal(SELFIE);
  const cards = [];

  for (let i = 0; i < STYLES.length; i++) {
    const [kr, en, cat, desc] = STYLES[i];
    const prompt = `Redraw the person in the photo as a single clean upper-body portrait, fully converted into the following illustration art style — NOT a photograph: ${desc}. Keep the person's face, distinctive features and ethnicity clearly recognizable as the same person (do not Westernize them). A simple soft plain background. No text or watermark.`;
    process.stdout.write(`[${i + 1}/${STYLES.length}] ${kr} ...`);
    try {
      const r = await withTimeout(fal.subscribe('google/nano-banana-2-lite/edit', {
        input: { prompt, image_urls: [selfieUrl], num_images: 1, safety_tolerance: 6 },
      }), 120000);
      const url = r?.data?.images?.[0]?.url || r?.images?.[0]?.url;
      if (!url) throw new Error('no image');
      const raw = Buffer.from(await (await fetch(url)).arrayBuffer());
      const thumb = await toThumb(raw);
      writeFileSync(resolve(OUT, `${String(i + 1).padStart(2, '0')}_${slug(en)}.jpg`), thumb);
      cards.push({ kr, en, cat, desc, uri: `data:image/jpeg;base64,${thumb.toString('base64')}` });
      console.log(' ✅');
    } catch (e) {
      console.log(' ❌ ' + e.message);
      cards.push({ kr, en, cat, desc, uri: null });
    }
  }

  // ---- gallery HTML ----
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const cardHtml = cards.map(c => `
    <figure class="card" style="--catc:${CATS[c.cat]}">
      <div class="imgwrap">${c.uri ? `<img loading="lazy" src="${c.uri}" alt="${esc(c.kr)}">` : `<div class="fail">생성 실패</div>`}</div>
      <figcaption>
        <div class="cat">${esc(CATLABEL[c.cat])}</div>
        <div class="nm">${esc(c.kr)}</div>
        <div class="en">${esc(c.en)}</div>
        <p class="desc">${esc(c.desc)}</p>
      </figcaption>
    </figure>`).join('');

  const html = `<title>NEANDER LAB — 화풍 실물 갤러리</title>
<style>
  :root{--bg:#080b10;--panel:#0f1621;--line:#1d2a3a;--line2:#26384c;--ink:#e9f1f8;--dim:#9fb0c2;--faint:#65788c;--cyan:#00f3ff;
    --mono:ui-monospace,"SF Mono","Cascadia Code","Roboto Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.5;
    background-image:radial-gradient(1200px 700px at 50% -10%,rgba(0,243,255,.06),transparent 60%),linear-gradient(rgba(0,243,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,243,255,.025) 1px,transparent 1px);
    background-size:100% 100%,34px 34px,34px 34px;}
  .wrap{max-width:1180px;margin:0 auto;padding:34px 22px 70px}
  .sysbar{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--faint);text-transform:uppercase}
  .sysbar .on{color:var(--cyan)}
  h1{font-size:clamp(26px,5vw,50px);font-weight:900;letter-spacing:.13em;margin:22px 0 6px;text-transform:uppercase}
  h1 .a{color:var(--cyan);text-shadow:0 0 22px rgba(0,243,255,.45)}
  .lede{max-width:74ch;color:var(--dim);font-size:15px;margin:6px 0 4px}
  .lede b{color:var(--ink)}
  .meta{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:14px;letter-spacing:.04em;border-left:3px solid var(--cyan);padding:6px 12px;background:var(--panel);border-radius:8px;display:inline-block}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin-top:30px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;transition:.16s}
  .card:hover{border-color:var(--catc);transform:translateY(-3px);box-shadow:0 14px 34px rgba(0,0,0,.4)}
  .imgwrap{aspect-ratio:1/1;background:#0a0f16;overflow:hidden;border-bottom:1px solid var(--line)}
  .imgwrap img{width:100%;height:100%;object-fit:cover;display:block}
  .fail{width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--faint);font-family:var(--mono);font-size:13px}
  figcaption{padding:13px 14px 15px}
  .cat{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--catc)}
  .nm{font-size:17px;font-weight:750;margin-top:3px}
  .en{font-family:var(--mono);font-size:11px;color:var(--faint);margin-bottom:8px}
  .desc{font-size:12px;color:var(--dim);margin:0}
  footer{margin-top:40px;color:var(--faint);font-family:var(--mono);font-size:12px;border-top:1px solid var(--line);padding-top:20px}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
  <div class="sysbar"><span>SYS.INIT.2026 <span class="on">// STYLE_GALLERY</span></span><span>SCAN: NEANDER_LAB_01</span></div>
  <h1>화풍 <span class="a">실물 갤러리</span></h1>
  <p class="lede">같은 셀피 1장을 <b>NB2 Lite로 각 화풍 단일 초상 렌더</b> — 실제 우리 파이프라인 출력이라, 이 스타일이 우리 포토부스에서 어떻게 나오는지 그대로 보여준다. (남의 예시가 아님)</p>
  <div class="meta">INPUT: public/1.jpg · MODEL: google/nano-banana-2-lite · ${cards.filter(c => c.uri).length}/${cards.length} rendered</div>
  <div class="grid">${cardHtml}</div>
  <footer>NEANDER LAB // STYLE GALLERY · 2026.07.14 · 화풍 프리셋 선정용 실물 레퍼런스</footer>
</div>`;

  const outHtml = resolve(ROOT, '..', 'style-gallery.html');
  const scratchHtml = 'C:/Users/tjktt/AppData/Local/Temp/claude/c--roqkf-ai-photo-booth/1cb53cf1-8461-4ac6-adc9-50b496917f9b/scratchpad/style-gallery.html';
  writeFileSync(scratchHtml, html);
  console.log(`\n갤러리 HTML: ${scratchHtml}`);
  console.log(`개별 이미지: ${OUT}`);
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
