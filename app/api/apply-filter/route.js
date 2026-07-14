import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import { buildSeedreamPrompt } from './seedream';
import { wrapGridPrompt } from './gridPrompt';
import { fetchImageAsBase64 } from './utils';
import { FILTER_PROMPTS } from './prompts';

// Vercel serverless 최대 실행 시간 (Pro: 300초, Hobby: 60초)
export const maxDuration = 300;

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

export async function POST(request) {
  try {
    // 매 요청마다 credentials 설정 (standalone 빌드에서 모듈 스코프 타이밍 문제 방지)
    fal.config({ credentials: process.env.FAL_KEY });

    const { image, filterType, referenceImageUrl, customerData, mode, style } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔥 PIN 모드 (acscent-composite): Nano Banana 2 Lite로 합성
    // 실패 시 2초 대기 후 재시도 (최대 3회)
    if (filterType === 'acscent-composite' && customerData && referenceImageUrl) {
      const seedreamPrompt = buildSeedreamPrompt(customerData, mode, style);
      const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");
      const imageUrls = [
        `data:image/jpeg;base64,${imageData}`,
        referenceImageUrl,
      ];
      const filterName = mode === 'grid' ? "AC'SCENT Composite (Grid)" : "AC'SCENT Composite";

      console.log(`[NB2] User image size (base64 chars):`, imageData.length);
      console.log(`[NB2] Settings: ${imageUrls.length} images, style=${style || 'webtoon'}, mode=${mode}`);

      const MAX_ATTEMPTS = 3; // NB2는 IP 거부가 없어 5분 루프 불필요 — 일시적 오류 대비 짧은 재시도만
      const RETRY_DELAY_MS = 2000;
      const startTime = Date.now();
      let attempt = 0;

      while (attempt < MAX_ATTEMPTS) {
        attempt++;
        console.log(`[NB2] Attempt ${attempt}/${MAX_ATTEMPTS} at +${((Date.now() - startTime) / 1000).toFixed(1)}s`);

        try {
          const result = await fal.subscribe("google/nano-banana-2-lite/edit", {
            input: {
              prompt: seedreamPrompt,
              image_urls: imageUrls,
              num_images: 1,
              safety_tolerance: 6, // 1=엄격 ~ 6=관대. 유명 IP 레퍼런스 통과 위해 최대 관대로
            },
          });

          const outputImage = result.data?.images?.[0];
          if (outputImage?.url) {
            const imgRes = await fetch(outputImage.url);
            const buffer = await imgRes.arrayBuffer();
            const finalImageData = Buffer.from(buffer).toString('base64');
            const mimeType = result.data.images[0].content_type || 'image/png';
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[NB2] SUCCESS on attempt ${attempt} after ${elapsed}s`);

            return NextResponse.json({
              success: true,
              image: `data:${mimeType};base64,${finalImageData}`,
              filterName,
              message: `${filterName} 필터가 적용되었습니다! (Nano Banana 2 Lite)`
            });
          }

          console.warn(`[NB2] Attempt ${attempt}: no image returned`);
        } catch (err) {
          console.warn(`[NB2] Attempt ${attempt} failed: ${err.message}`);
        }

        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[NB2] All ${attempt} attempts failed after ${elapsed}s`);
      return NextResponse.json(
        { success: false, message: `AI 합성 실패 (${attempt}회 시도, ${elapsed}초)` },
        { status: 502 }
      );
    }

    // 🎨 일반 필터 모드: admin에서 설정한 아트 스타일 필터 적용
    const filter = FILTER_PROMPTS[filterType] || FILTER_PROMPTS['kpop-idol'];
    let filterName = filter.name;
    let fullPrompt;

    if (mode === 'grid') {
      fullPrompt = wrapGridPrompt(filter.prompt);
      filterName = filter.name + ' (Grid)';
      console.log(`[Filter] Grid mode enabled for ${filterName}`);
    } else {
      fullPrompt = filter.prompt;
    }

    fullPrompt += `\nGenerate and return a new edited IMAGE. Apply filter to ALL people equally. Maintain original composition and pose. High quality output.`;

    // 이미지 데이터 추출
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");
    const contents = [{ text: fullPrompt }];

    contents.push({
      inlineData: { mimeType: "image/jpeg", data: imageData },
    });

    // 참조 이미지가 있으면 추가
    if (referenceImageUrl) {
      console.log(`[Filter] Fetching reference image from AC'SCENT...`);
      const refImageBase64 = await fetchImageAsBase64(referenceImageUrl);
      if (refImageBase64) {
        contents.push({
          inlineData: { mimeType: "image/jpeg", data: refImageBase64 },
        });
        console.log(`[Filter] Reference image added to prompt`);
      } else {
        console.warn(`[Filter] Failed to fetch reference image, proceeding without it`);
      }
    }

    const model = "gemini-3-pro-image-preview";
    const imageSize = mode === 'grid' ? '4K' : '2K';
    console.log(`[Filter] Applying ${filterName} filter with ${model} (${imageSize})...`);

    // 재시도 로직 (최대 2회)
    let response;
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Filter] Attempt ${attempt}...`);
        response = await genAI.models.generateContent({
          model: model,
          contents: contents,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { imageSize: imageSize },
          },
        });
        break;
      } catch (apiError) {
        lastError = apiError;
        console.error(`[Filter] Attempt ${attempt} failed:`, apiError.message);
        if (attempt < 2) {
          console.log(`[Filter] Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!response) {
      console.error('[Filter] All attempts failed:', lastError?.message);
      return NextResponse.json(
        { success: false, message: `Gemini API 호출 실패 (${lastError?.message || 'unknown'})` },
        { status: 502 }
      );
    }

    // 생성된 이미지 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const filteredImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          return NextResponse.json({
            success: true,
            image: filteredImage,
            filterName: filterName,
            message: `${filterName} 필터가 적용되었습니다! (Gemini 3 Pro Image)`
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: '필터 적용에 실패했습니다.' },
      { status: 500 }
    );

  } catch (error) {
    console.error("Filter error:", error);
    return NextResponse.json(
      { success: false, message: '서버 오류: ' + error.message },
      { status: 500 }
    );
  }
}

// 필터 목록 조회 API
export async function GET() {
  const filters = Object.entries(FILTER_PROMPTS).map(([key, value]) => ({
    id: key,
    name: value.name,
    emoji: value.emoji
  }));

  return NextResponse.json({ filters });
}
