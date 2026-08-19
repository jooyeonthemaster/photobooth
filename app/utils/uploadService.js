// QR 코드 사진 공유용 Supabase 업로드 서비스
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_ANON_KEY;

let supabaseClient = null;

function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

/**
 * 업로드 서비스 사용 가능 여부 체크
 * env가 설정되지 않았으면 false -> QR 기능 전체 비활성화
 */
export function isUploadAvailable() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * 사진을 Supabase Storage에 업로드하고 public URL 반환
 * @param {string} base64Image - Base64 JPEG (data:image/jpeg;base64,...)
 * @returns {Promise<{ photoId: string, url: string }>}
 */
export async function uploadPhoto(base64Image) {
  const client = getSupabase();
  if (!client) throw new Error('Upload service not configured');

  // 정렬키(역순 타임스탬프) + UUID 파일명.
  //  - 역순 타임스탬프 접두어: (큰수 - 현재ms). Storage 대시보드가 이름 오름차순으로
  //    정렬해도 최신 파일이 맨 위로 오게 만든다 (무료티어에 정렬 버튼이 없어서 필요).
  //  - UUID는 그대로 유지: 파일명 추측 불가(프라이버시) + 같은 ms 업로드 충돌 방지.
  const uuid = crypto.randomUUID();
  const sortKey = (9999999999999 - Date.now()).toString().padStart(13, '0');
  const photoId = `${sortKey}_${uuid}`;
  const filename = `${photoId}.jpg`;

  // Base64 data URL -> Uint8Array 변환
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 15초 타임아웃
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const { error } = await client.storage
      .from('photos')
      .upload(filename, bytes.buffer, {
        contentType: 'image/jpeg',
        cacheControl: '604800', // 7일
        upsert: false,
      });

    if (error) {
      console.error('[UploadService] Upload failed:', error);
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }

  // Public URL 가져오기
  const { data: urlData } = client.storage
    .from('photos')
    .getPublicUrl(filename);

  console.log('[UploadService] Photo uploaded:', photoId);
  return { photoId, url: urlData.publicUrl };
}
