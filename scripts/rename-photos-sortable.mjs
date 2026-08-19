// 일회성 마이그레이션: 'photos' 버킷의 기존 파일명을 정렬 가능한 이름으로 리네임.
//   uuid.jpg  ->  {역순타임스탬프13자리}_{uuid}.jpg
// 목적: Supabase Storage 대시보드(이름 오름차순 고정, 무료티어)에서 최신이 맨 위로.
// 규칙: 오늘(KST) 찍은 사진은 건드리지 않음. 이미 리네임된 파일(^\d{13}_)은 건너뜀.
// 이동은 storage.move() = 서버 내부 이동(재업로드 없음).
//
// 사용:
//   node scripts/rename-photos-sortable.mjs --dry            # 미리보기(이동 안 함)
//   node scripts/rename-photos-sortable.mjs --limit=1        # 1건만 실제 이동(테스트)
//   node scripts/rename-photos-sortable.mjs                  # 전체 실행
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 수동 로드
const envText = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l && !l.trimStart().startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_PHOTO_URL;
const SERVICE_KEY = env.SUPABASE_PHOTO_SERVICE_ROLE_KEY;
const BUCKET = 'photos';
const INV_BASE = 9999999999999n; // 13자리 역순 기준값

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('환경변수 없음 (NEXT_PUBLIC_SUPABASE_PHOTO_URL / SUPABASE_PHOTO_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const DRY = process.argv.includes('--dry');
const INCLUDE_TODAY = process.argv.includes('--include-today');
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

// 오늘 00:00 KST 를 UTC ms 로. 이 시각 이후 생성 = 오늘 = 건드리지 않음.
const TODAY_KST_START = Date.parse('2026-07-15T00:00:00+09:00');

const client = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listAll() {
  const all = [];
  let offset = 0;
  for (let i = 0; i < 100; i++) {
    const { data, error } = await client.storage.from(BUCKET).list('', {
      limit: 1000,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all.filter((o) => o && o.id && o.name && o.name !== '.emptyFolderPlaceholder');
}

const objs = await listAll();
console.log(`전체 객체: ${objs.length}`);

let renamed = 0;
let skippedToday = 0;
let alreadyDone = 0;
let failed = 0;

for (const o of objs) {
  const createdMs = new Date(o.created_at).getTime();
  if (!INCLUDE_TODAY && createdMs >= TODAY_KST_START) {
    skippedToday++;
    continue;
  }
  if (/^\d{13}_/.test(o.name)) {
    alreadyDone++;
    continue;
  }
  if (renamed >= LIMIT) break;

  const inv = (INV_BASE - BigInt(createdMs)).toString().padStart(13, '0');
  const newName = `${inv}_${o.name}`;

  if (DRY) {
    console.log(`[DRY] ${o.name}  ->  ${newName}   (${o.created_at})`);
    renamed++;
    continue;
  }

  const { error } = await client.storage.from(BUCKET).move(o.name, newName);
  if (error) {
    failed++;
    console.error(`FAIL ${o.name}: ${error.message}`);
    continue;
  }
  renamed++;
  if (renamed % 25 === 0) console.log(`  ...${renamed}건 이동`);
}

console.log(
  `\n완료 → 이동:${renamed}  오늘제외:${skippedToday}  이미완료:${alreadyDone}  실패:${failed}  (전체:${objs.length})`
);
