import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// AC'SCENT Supabase 클라이언트 (읽기 전용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_ACSCENT_SUPABASE_URL,
  process.env.NEXT_PUBLIC_ACSCENT_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length < 3 || pin.length > 6) {
      return NextResponse.json(
        { success: false, message: 'PIN 번호를 정확히 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log(`[PIN Lookup] Searching for PIN: ${pin}`);

    // AC'SCENT Supabase에서 PIN으로 분석 결과 전체 조회 (최신순)
    const { data, error } = await supabase
      .from('analysis_results')
      .select('id, user_image_url, analysis_data, twitter_name, perfume_name, perfume_brand, idol_name, idol_gender, created_at, pin, service_mode')
      .eq('pin', pin)
      .eq('service_mode', 'offline')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PIN Lookup] Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'DB 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log(`[PIN Lookup] No results found for PIN: ${pin}`);
      return NextResponse.json(
        { success: false, message: '해당 PIN에 대한 분석 결과가 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`[PIN Lookup] Found ${data.length} result(s) for PIN ${pin}`);

    // 모든 결과를 매핑하여 반환
    const results = data.map(result => {
      const analysisData = result.analysis_data || {};
      const scentProfile = analysisData.scentProfile || {};
      const traits = analysisData.traitScores || {};

      return {
        id: result.id,
        userImageUrl: result.user_image_url,
        idolName: result.idol_name || result.twitter_name || '이름 없음',
        idolGender: result.idol_gender || '알 수 없음',
        perfumeName: result.perfume_name,
        perfumeBrand: result.perfume_brand,
        scentProfile,
        traits,
        createdAt: result.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });

  } catch (error) {
    console.error('[PIN Lookup] Server error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류: ' + error.message },
      { status: 500 }
    );
  }
}
