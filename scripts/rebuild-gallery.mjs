// 기존 style-gallery 이미지들을 더 작게 재압축 → 가벼운 비교용 갤러리 HTML 재빌드 (fal 호출 없음)
import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'style-gallery');
const CATS = { webtoon: '#ff6f9c', anime: '#5b8cff', cute: '#3fe0b0', render3d: '#ffb454', niche: '#b98cff' };
const CATLABEL = { webtoon: '웹툰·만화', anime: '일본 애니', cute: '큐트·데포르메', render3d: '3D·렌더·토이', niche: '트렌디·니치' };

// [file, kr, en, cat, short-desc]
const ITEMS = [
  ['01_soft-casual-webtoon.jpg', '감성 웹툰', 'Soft Casual Webtoon', 'webtoon', '얇은 선·플랫 파스텔, 담백한 데일리 웹툰'],
  ['02_detailed-semi-real-manhwa.jpg', '반실사 웹툰', 'Detailed Semi-Real Manhwa', 'webtoon', '또렷한 선·광택 렌더, 성숙한 성인 로맨스체'],
  ['03_sparkly-romance-webtoon.jpg', '순정 웹툰', 'Sparkly Romance Webtoon', 'webtoon', '반짝 눈·꽃·파스텔, 예쁘장한 순정 로맨스'],
  ['04_fantasy-romance-webtoon.jpg', '로판 웹툰', 'Fantasy-Romance Webtoon', 'webtoon', '왕관·보석·화려한 궁정, 로판 판타지'],
  ['05_modern-high-impact-anime-cel.jpg', '모던 하이임팩트 셀', 'Modern High-Impact Anime Cel', 'anime', '굵은 선·하드 셀·글로우, 쨍한 현대 애니'],
  ['06_idol-star-eye-oshi-no-ko-.jpg', '아이돌 스타아이', 'Idol Star-Eye (Oshi no Ko)', 'anime', '컬러헤어·별 박힌 눈, 아이돌 팬 직격 (2026 트렌드)'],
  ['07_makoto-shinkai-cinematic.jpg', '신카이 마코토', 'Makoto Shinkai Cinematic', 'anime', '발광 보케·골든아워, 서정 시네마틱'],
  ['08_studio-ghibli-hand-painted.jpg', '지브리 손그림', 'Studio Ghibli Hand-Painted', 'anime', '수채 배경·포근한 손그림, 동화 감성'],
  ['09_chibi-super-deformed-.jpg', '큐트 치비', 'Chibi (Super-Deformed)', 'cute', '2등신 대두·초롱초롱 큰 눈, 초귀여움'],
  ['10_messenger-emoticon-sticker.jpg', '카톡 이모티콘', 'Messenger Emoticon Sticker', 'cute', '굵은 선·다이컷 스티커, 개그·밈'],
  ['11_glossy-collectible-figurine.jpg', '3D 피규어', 'Glossy Collectible Figurine', 'render3d', '광택 비닐 피규어, 팝마트 블라인드박스 (바이럴)'],
  ['12_disney-heroine-3d.jpg', '디즈니 프린세스 3D', 'Disney Heroine 3D', 'render3d', '말랑 픽사/디즈니 렌더, 예쁨 축'],
  ['13_soft-plush-jellycat-.jpg', '플러시 인형', 'Soft Plush (Jellycat)', 'render3d', '진짜 봉제인형 질감, 공유 최강'],
  ['14_claymation.jpg', '클레이 스톱모션', 'Claymation', 'render3d', '무광 점토 조소, 수제 스톱모션'],
  ['15_arcane-fortiche-painterly-3d.jpg', '아케인 페인터리 3D', 'Arcane Painterly 3D', 'render3d', '유화 붓터치 반3D, 무드 시크'],
  ['16_spider-verse-stylized-3d.jpg', '스파이더버스 3D', 'Spider-Verse Stylized 3D', 'render3d', '잉크선·하프톤·색수차, 힙한 코믹'],
  ['17_y2k-cyber-chrome.jpg', 'Y2K 사이버 크롬', 'Y2K Cyber Chrome', 'niche', '홀로그램·크롬·반짝, 제일 튀는 트렌드'],
  ['18_colored-pencil-kidcore.jpg', '색연필 키드코어', 'Colored-Pencil Kidcore', 'niche', '크레용 손그림, 2026 일러 트렌드'],
  ['19_dreamy-watercolor.jpg', '몽환 수채화', 'Dreamy Watercolor', 'niche', '수채 번짐·파스텔, 힐링·동화'],
];

async function thumb(file, max = 360) {
  const img = await loadImage(readFileSync(resolve(DIR, file)));
  const sc = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * sc), h = Math.round(img.height * sc);
  const cv = createCanvas(w, h); cv.getContext('2d').drawImage(img, 0, 0, w, h);
  return 'data:image/jpeg;base64,' + cv.toBuffer('image/jpeg', { quality: 0.7 }).toString('base64');
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const cards = [];
let total = 0;
for (const [file, kr, en, cat, desc] of ITEMS) {
  const uri = await thumb(file);
  total += uri.length;
  cards.push(`<figure class="card" data-cat="${cat}" style="--catc:${CATS[cat]}">
    <div class="imgwrap"><img loading="lazy" src="${uri}" alt="${esc(kr)}"></div>
    <figcaption><span class="cat">${esc(CATLABEL[cat])}</span><span class="nm">${esc(kr)}</span><span class="en">${esc(en)}</span><span class="desc">${esc(desc)}</span></figcaption>
  </figure>`);
}
console.log('총 임베드 크기(base64):', (total / 1024 / 1024).toFixed(1), 'MB');

const chips = Object.keys(CATLABEL).map(k => `<button class="chip" data-f="${k}" style="--c:${CATS[k]}">${esc(CATLABEL[k])}</button>`).join('');

const html = `<title>NEANDER LAB — 화풍 비교 갤러리</title>
<style>
  :root{--bg:#080b10;--panel:#0f1621;--line:#1d2a3a;--ink:#e9f1f8;--dim:#9fb0c2;--faint:#65788c;--cyan:#00f3ff;
    --mono:ui-monospace,"SF Mono","Cascadia Code","Roboto Mono",Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.45;
    background-image:radial-gradient(1100px 620px at 50% -10%,rgba(0,243,255,.06),transparent 60%),linear-gradient(rgba(0,243,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,243,255,.022) 1px,transparent 1px);
    background-size:100% 100%,34px 34px,34px 34px;}
  .wrap{max-width:1280px;margin:0 auto;padding:28px 20px 60px}
  .sysbar{display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;letter-spacing:.12em;color:var(--faint);text-transform:uppercase}
  .sysbar .on{color:var(--cyan)}
  h1{font-size:clamp(24px,4.6vw,44px);font-weight:900;letter-spacing:.13em;margin:18px 0 6px;text-transform:uppercase}
  h1 .a{color:var(--cyan);text-shadow:0 0 22px rgba(0,243,255,.45)}
  .lede{max-width:76ch;color:var(--dim);font-size:14.5px;margin:4px 0 0}
  .lede b{color:var(--ink)}
  .filters{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 4px;position:sticky;top:0;z-index:5;padding:10px 0;background:linear-gradient(180deg,var(--bg) 65%,transparent);backdrop-filter:blur(4px)}
  .chip{font-family:var(--mono);font-size:12px;letter-spacing:.03em;color:var(--dim);background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:7px 14px;cursor:pointer;transition:.15s}
  .chip:hover{color:var(--ink)}
  .chip.active{color:#04121a;background:var(--c,var(--cyan));border-color:transparent;font-weight:700}
  .chip[data-f="all"].active{background:var(--cyan)}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-top:14px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden;transition:.16s}
  .card:hover{border-color:var(--catc);transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,.4)}
  .card.hide{display:none}
  .imgwrap{aspect-ratio:1/1;background:#0a0f16;overflow:hidden}
  .imgwrap img{width:100%;height:100%;object-fit:cover;display:block}
  figcaption{padding:10px 12px 12px;display:flex;flex-direction:column;gap:1px}
  .cat{font-family:var(--mono);font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--catc)}
  .nm{font-size:15px;font-weight:750;margin-top:2px}
  .en{font-family:var(--mono);font-size:10px;color:var(--faint)}
  .desc{font-size:11.5px;color:var(--dim);margin-top:5px}
  footer{margin-top:34px;color:var(--faint);font-family:var(--mono);font-size:11.5px;border-top:1px solid var(--line);padding-top:18px}
  @media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
  <div class="sysbar"><span>SYS.INIT.2026 <span class="on">// STYLE_COMPARE</span></span><span>SCAN: NEANDER_LAB_01</span></div>
  <h1>화풍 <span class="a">비교 갤러리</span></h1>
  <p class="lede">같은 셀피 1장을 <b>19개 화풍으로 NB2 Lite 실물 렌더</b> — 실제 우리 포토부스 출력. 카테고리 칩으로 필터해서 한눈에 비교하고 최종 프리셋을 고르세요.</p>
  <div class="filters"><button class="chip active" data-f="all">전체 <span style="opacity:.6">${ITEMS.length}</span></button>${chips}</div>
  <div class="grid" id="grid">${cards.join('')}</div>
  <footer>NEANDER LAB // STYLE COMPARE · INPUT public/1.jpg · MODEL google/nano-banana-2-lite · 2026.07.14</footer>
</div>
<script>
  const chips=document.querySelectorAll('.chip'), cards=document.querySelectorAll('.card');
  chips.forEach(c=>c.addEventListener('click',()=>{
    chips.forEach(x=>x.classList.remove('active')); c.classList.add('active');
    const f=c.dataset.f;
    cards.forEach(card=>card.classList.toggle('hide', f!=='all' && card.dataset.cat!==f));
  }));
</script>`;

const outPath = 'C:/Users/tjktt/AppData/Local/Temp/claude/c--roqkf-ai-photo-booth/1cb53cf1-8461-4ac6-adc9-50b496917f9b/scratchpad/style-gallery.html';
writeFileSync(outPath, html);
console.log('갤러리 재빌드 완료:', outPath, '/ HTML', (html.length / 1024 / 1024).toFixed(1), 'MB');
