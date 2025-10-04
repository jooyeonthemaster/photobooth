import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // K-POP 필터 프롬프트
    const prompt = `
Please edit this image by applying K-POP IDOL makeup style to the person in the photo.

IMPORTANT: You must generate and return a new edited image, not just text.

K-POP STYLE SPECIFICATIONS:
- BASE: Apply a flawless, dewy glass skin effect with subtle highlighting
- EYES: Soft eyeshadow with thin eyeliner, natural-looking lashes
- EYEBROWS: Well-groomed, straight Korean-style eyebrows
- CHEEKS: Subtle pink blush applied high on cheekbones
- LIPS: Natural pink or coral tint with gradient lip effect
- OVERALL: Clean, fresh, and elegant K-POP idol appearance

Create a polished K-POP idol look that looks natural and camera-ready.
`;

    // 이미지 데이터 추출
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Gemini API 호출
    const model = "gemini-2.5-flash-image-preview";
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
    ];

    console.log('Applying K-POP filter...');
    const response = await genAI.models.generateContent({
      model: model,
      contents: contents,
    });

    // 생성된 이미지 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const filteredImage = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;

          return NextResponse.json({
            success: true,
            image: filteredImage,
            message: "K-POP 필터가 적용되었습니다!"
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: '필터 적용에 실패했습니다.' },
      { status: 500 }
    );

  } catch (error) {
    console.error("K-POP filter error:", error);
    return NextResponse.json(
      { success: false, message: '서버 오류: ' + error.message },
      { status: 500 }
    );
  }
}
