// QR 사진 버킷 관리(어드민) API — service_role(secret) 키로 서버에서만 동작
// anon 키는 storage.objects list 권한이 없어서 목록 조회 불가 → 반드시 secret 키 필요.
// secret 키는 절대 클라이언트로 내려가지 않음 (이 라우트 = 서버 전용).
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_URL;
const SERVICE_KEY = process.env.SUPABASE_PHOTO_SERVICE_ROLE_KEY;
const ADMIN_PW = process.env.ADMIN_PHOTOS_PASSWORD || '';
const BUCKET = 'photos';

let adminClient = null;
function getAdmin() {
  if (!adminClient && SUPABASE_URL && SERVICE_KEY) {
    adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

// 버킷의 모든 객체를 created_at 내림차순으로 끝까지 수집
async function fetchAllObjects(client) {
  const PAGE = 1000;
  let offset = 0;
  const all = [];
  // 안전 상한 (무한 루프 방지: 최대 10만 개)
  for (let i = 0; i < 100; i++) {
    const { data, error } = await client.storage.from(BUCKET).list('', {
      limit: PAGE,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  // 실제 파일만 (폴더/플레이스홀더 제외)
  return all.filter(
    (o) => o && o.id && o.name && o.name !== '.emptyFolderPlaceholder'
  );
}

function publicUrl(client, name) {
  return client.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

// ── KST(Asia/Seoul, UTC+9) 기준 날짜 계산 ──────────────────────────
function kstParts(iso) {
  const ms = new Date(iso).getTime() + 9 * 3600 * 1000;
  const d = new Date(ms);
  return {
    ms,
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(), // 0-based
    day: d.getUTCDate(),
    dow: d.getUTCDay(), // 0=일
  };
}
const pad = (n) => String(n).padStart(2, '0');
const kstDateStr = (iso) => {
  const { y, m, day } = kstParts(iso);
  return `${y}-${pad(m + 1)}-${pad(day)}`;
};
const kstMonthStr = (iso) => {
  const { y, m } = kstParts(iso);
  return `${y}-${pad(m + 1)}`;
};
// 주 시작(월요일) KST 날짜
const kstWeekStr = (iso) => {
  const { ms, dow } = kstParts(iso);
  const back = (dow + 6) % 7; // 월요일까지 며칠 전
  const d = new Date(ms - back * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

function aggregate(objs) {
  const byDay = {};
  const byWeek = {};
  const byMonth = {};
  let totalBytes = 0;
  for (const o of objs) {
    const size = o.metadata?.size || 0;
    totalBytes += size;
    for (const [bucket, key] of [
      [byDay, kstDateStr(o.created_at)],
      [byWeek, kstWeekStr(o.created_at)],
      [byMonth, kstMonthStr(o.created_at)],
    ]) {
      bucket[key] = bucket[key] || { count: 0, bytes: 0 };
      bucket[key].count++;
      bucket[key].bytes += size;
    }
  }
  const toSorted = (obj) =>
    Object.entries(obj)
      .map(([key, v]) => ({ key, count: v.count, bytes: v.bytes }))
      .sort((a, b) => (a.key < b.key ? 1 : -1)); // 최신 먼저
  return {
    total: objs.length,
    totalBytes,
    daily: toSorted(byDay),
    weekly: toSorted(byWeek),
    monthly: toSorted(byMonth),
  };
}

export async function GET(request) {
  // 비밀번호 체크 (ADMIN_PHOTOS_PASSWORD가 설정된 경우에만)
  if (ADMIN_PW) {
    const pw = request.headers.get('x-admin-pw') || '';
    if (pw !== ADMIN_PW) {
      return NextResponse.json(
        { success: false, message: '인증 실패' },
        { status: 401 }
      );
    }
  }

  const client = getAdmin();
  if (!client) {
    return NextResponse.json(
      {
        success: false,
        message:
          'service_role 키가 설정되지 않았습니다. .env.local의 SUPABASE_PHOTO_SERVICE_ROLE_KEY 확인',
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'list';

  try {
    const all = await fetchAllObjects(client);

    if (mode === 'stats') {
      return NextResponse.json({ success: true, ...aggregate(all) });
    }

    // list 모드: 날짜 범위 필터 + 페이지네이션
    const after = searchParams.get('after'); // ISO UTC (포함)
    const before = searchParams.get('before'); // ISO UTC (미포함)
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '24', 10),
      200
    );

    let filtered = all;
    if (after) filtered = filtered.filter((o) => o.created_at >= after);
    if (before) filtered = filtered.filter((o) => o.created_at < before);

    const page = filtered.slice(offset, offset + limit).map((o) => ({
      name: o.name,
      url: publicUrl(client, o.name),
      createdAt: o.created_at,
      size: o.metadata?.size || 0,
    }));

    return NextResponse.json({
      success: true,
      total: filtered.length,
      offset,
      limit,
      photos: page,
    });
  } catch (e) {
    console.error('[Admin Photos] error:', e);
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}
