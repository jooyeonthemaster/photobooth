// 'photos' 버킷을 최신순으로 훑어서 단독 HTML 갤러리(썸네일)로 출력.
// 서버 없이 브라우저로 바로 열어 확인하는 용도. 버킷이 Public이라 이미지 URL이 그대로 열림.
//   node scripts/build-gallery-preview.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envText = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_PHOTO_URL;
const SERVICE_KEY = env.SUPABASE_PHOTO_SERVICE_ROLE_KEY;
const BUCKET = 'photos';
const PUB = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
const client = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function listAll() {
  const all = [];
  let offset = 0;
  for (let i = 0; i < 100; i++) {
    const { data, error } = await client.storage.from(BUCKET).list('', {
      limit: 1000, offset, sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all.filter((o) => o && o.id && o.name && o.name !== '.emptyFolderPlaceholder');
}

const fmt = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
});

const objs = await listAll();
const tiles = objs.map((o) => {
  const url = `${PUB}/${encodeURIComponent(o.name)}`;
  const t = fmt.format(new Date(o.created_at));
  const sizeKb = o.metadata?.size ? (o.metadata.size / 1024).toFixed(0) + 'KB' : '';
  return `<figure><a href="${url}" target="_blank" rel="noreferrer">
<img loading="lazy" src="${url}" alt=""></a>
<figcaption>${t}<span>${sizeKb}</span></figcaption></figure>`;
}).join('\n');

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR 사진 미리보기 (최신순 ${objs.length}장)</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#0f1115;color:#e6e6e6;font:14px/1.4 system-ui,'Malgun Gothic',sans-serif}
header{position:sticky;top:0;background:#161a22ee;backdrop-filter:blur(6px);padding:14px 18px;border-bottom:1px solid #262b36;z-index:2}
header b{font-size:16px}
header span{color:#8a93a6;margin-left:8px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:16px}
figure{margin:0;background:#161a22;border:1px solid #262b36;border-radius:10px;overflow:hidden}
figure img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:#20242e}
figcaption{display:flex;justify-content:space-between;align-items:center;padding:6px 8px;font-size:12px;color:#aab2c2}
figcaption span{color:#6b7386}
</style></head><body>
<header><b>QR 사진 미리보기</b><span>최신순 · 총 ${objs.length}장 · 위에서부터 최근</span></header>
<main>
${tiles}
</main></body></html>`;

const outPath = join(__dirname, '..', 'photos-preview.html');
writeFileSync(outPath, html, 'utf8');
console.log(`생성: ${outPath}  (${objs.length}장, 최신순)`);
