import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import { buildSeedreamPrompt } from './seedream';
import { wrapGridPrompt } from './gridPrompt';
import { fetchImageAsBase64 } from './utils';
import { FILTER_PROMPTS } from './prompts';

// Vercel serverless 최대 실행 시간 (Pro: 300초, Hobby: 60초)
export const maxDuration = 120;

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request) {
  try {
    const { image, filterType, referenceImageUrl, customerData, mode } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 🔥 PIN 모드 (acscent-composite): Seedream 5.0 Lite로 합성
    if (filterType === 'acscent-composite' && customerData && referenceImageUrl) {
      const seedreamPrompt = buildSeedreamPrompt(customerData, mode);
      const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");

      const imageUrls = [
        `data:image/jpeg;base64,${imageData}`,
        referenceImageUrl,
      ];
      console.log(`[Seedream] User image size (base64 chars):`, imageData.length);
      console.log(`[Seedream] Prompt:`, seedreamPrompt);

      const imageSize = mode === 'grid' ? 'auto_3K' : 'auto_2K';
      const filterName = mode === 'grid' ? "AC'SCENT Composite (Grid)" : "AC'SCENT Composite";

      console.log(`[Seedream] Settings: ${imageUrls.length} images, size=${imageSize}, mode=${mode}`);

      try {
        const result = await fal.subscribe("fal-ai/bytedance/seedream/v5/lite/edit", {
          input: {
            prompt: seedreamPrompt,
            image_urls: imageUrls,
            image_size: imageSize,
            num_images: 1,
            enable_safety_checker: false,
          },
        });

        // 여러 결과 중 첫 번째 성공 이미지 사용
        const outputImage = result.data?.images?.[0];
        if (outputImage?.url) {
          const outputUrl = outputImage.url;
          const imgRes = await fetch(outputUrl);
          const buffer = await imgRes.arrayBuffer();
          const finalImageData = Buffer.from(buffer).toString('base64');
          const mimeType = result.data.images[0].content_type || 'image/png';

          return NextResponse.json({
            success: true,
            image: `data:${mimeType};base64,${finalImageData}`,
            filterName: filterName,
            message: `${filterName} 필터가 적용되었습니다! (Seedream 5.0 Lite)`
          });
        }

        return NextResponse.json(
          { success: false, message: 'Seedream 이미지 생성 실패' },
          { status: 500 }
        );
      } catch (seedreamError) {
        console.error('[Seedream] Error:', seedreamError.message);
        return NextResponse.json(
          { success: false, message: `Seedream API 호출 실패 (${seedreamError.message})` },
          { status: 502 }
        );
      }
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
