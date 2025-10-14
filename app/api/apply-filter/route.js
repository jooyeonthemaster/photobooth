import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

// 원본 인물 보존형 필터 프롬프트들
const FILTER_PROMPTS = {
  'kpop-idol': {
    name: 'K-POP 아이돌',
    emoji: '✨',
    prompt: `
IMPORTANT: Keep the person's original facial features, bone structure, and identity intact. Only apply makeup and lighting effects.

Apply professional K-POP IDOL makeup to the existing face:
- Add glass skin effect and dewy finish to their existing skin tone
- Apply soft eyeshadow and thin eyeliner around their original eyes
- Add natural gradient lips (pink/coral) to their existing lip shape
- Enhance their existing eyebrows into Korean-style shape
- Add subtle pink blush on their natural cheekbones
- Improve lighting and add soft glow

PRESERVE: Face shape, eye shape, nose, facial proportions, identity
MODIFY: Only makeup, skin texture, lighting, and color grading
`
  },

  'anime-character': {
    name: '애니메이션 캐릭터',
    emoji: '🎌',
    prompt: `
IMPORTANT: Maintain the person's original face and features. Apply anime art style as an overlay effect only.

Apply ANIME ART STYLE to their existing face:
- Add sparkly highlights to their existing eyes (keep eye shape)
- Apply cell-shading technique to their existing skin and features
- Add anime-style shine effects to their natural hair color
- Draw subtle anime blush marks on their cheeks
- Apply anime-style lighting and soft glow effects
- Add slight outline effect around facial features

PRESERVE: Facial structure, eye/nose/mouth positions, face shape, identity
MODIFY: Only art style, shading technique, highlights, and drawing style overlay
`
  },

  'zombie-apocalypse': {
    name: '좀비 아포칼립스',
    emoji: '🧟',
    prompt: `
IMPORTANT: Keep the person's face recognizable. Only add zombie makeup effects.

Apply ZOMBIE MAKEUP to their existing face:
- Add pale greenish-gray tone to their existing skin
- Apply dark circles and tired effects around their original eyes
- Add fake blood and wound makeup on face
- Make their existing hair look disheveled and dirty
- Apply cracked lip makeup and pale coloring
- Add realistic horror makeup effects

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only skin color, makeup effects, hair styling, and wounds
`
  },

  'cyberpunk-neon': {
    name: '사이버펑크 네온',
    emoji: '🌃',
    prompt: `
IMPORTANT: Keep original facial features intact. Only add cyberpunk visual effects and makeup.

Apply CYBERPUNK effects to their existing face:
- Add small neon glowing tattoo patterns on their skin (pink, blue, cyan)
- Apply chrome metallic highlights to their existing features
- Add holographic makeup with subtle digital glitch effects
- Place thin LED light strips on their cheekbones
- Add glowing iris effects to their existing eyes
- Apply futuristic makeup and lighting

PRESERVE: Face shape, eye shape, nose, facial proportions, identity
MODIFY: Only lighting effects, makeup, glowing elements, and color overlays
`
  },

  'renaissance-painting': {
    name: '르네상스 명화',
    emoji: '🖼️',
    prompt: `
IMPORTANT: Keep the person's face recognizable. Apply painting technique as artistic filter only.

Apply RENAISSANCE PAINTING style to their existing portrait:
- Add oil painting texture overlay to their existing features
- Apply soft, diffused 16th century lighting to their face
- Use rich, warm color palette and subtle shadows
- Add painted background in classical style
- Apply subtle period-appropriate makeup and hair styling
- Use painterly brushstroke effects

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only art texture, lighting style, color palette, and painting technique
`
  },

  'pixar-character': {
    name: '픽사 3D 캐릭터',
    emoji: '🎬',
    prompt: `
IMPORTANT: Maintain person's recognizable features. Apply Pixar 3D art style subtly.

Apply PIXAR 3D STYLE to their existing face:
- Add smooth 3D rendering effect to their features
- Slightly enhance their existing expressive features
- Add perfect highlights to their original eyes
- Apply soft, appealing character lighting
- Use vibrant colors with subtle subsurface scattering on their skin
- Add Pixar-style warmth and glow

PRESERVE: Face shape, eye/nose/mouth proportions, identity, bone structure
MODIFY: Only rendering style, lighting, slight feature enhancement, and color vibrancy
`
  },

  'old-grandparent': {
    name: '80년 후 나',
    emoji: '👴',
    prompt: `
IMPORTANT: Keep the person identifiable. Age their existing features naturally.

Apply AGE PROGRESSION to their existing face:
- Add realistic wrinkles and age lines to their face structure
- Change their existing hair to gray or white
- Add subtle age spots to their skin
- Apply natural aging to their existing features
- Add slight drooping effect while maintaining their bone structure
- Make them look elderly but still recognizable

PRESERVE: Core facial structure, identity, eye/nose proportions
MODIFY: Only skin texture, hair color, wrinkles, and aging effects
`
  },

  'baby-filter': {
    name: '아기 버전',
    emoji: '👶',
    prompt: `
IMPORTANT: Keep person's recognizable features. Apply baby-like effects subtly.

Apply BABY EFFECTS to their existing face:
- Add slight chubby cheeks to their face
- Soften and round their existing features slightly
- Apply smooth baby-like skin texture
- Make their existing features look younger and cuter
- Keep their original eye and nose shape, just soften
- Add baby-like innocence while maintaining identity

PRESERVE: Facial identity, core features, bone structure
MODIFY: Only skin smoothness, slight feature softening, and youthful effect
`
  },

  'glamour-magazine': {
    name: '보그 매거진 커버',
    emoji: '💄',
    prompt: `
IMPORTANT: Keep original face intact. Apply high-fashion editorial makeup only.

Apply VOGUE EDITORIAL MAKEUP to their existing face:
- Apply high-fashion editorial makeup to their features
- Add dramatic contouring to enhance their existing bone structure
- Apply bold, artistic eye makeup to their original eyes
- Add glossy statement lips to their lip shape
- Apply professional studio lighting to their face
- Add flawless retouching while keeping their identity
- Use elegant color grading

PRESERVE: Face shape, facial features, identity, proportions
MODIFY: Only makeup, lighting, retouching, and color grading
`
  },

  'disney-villain': {
    name: '디즈니 악당',
    emoji: '😈',
    prompt: `
IMPORTANT: Maintain person's recognizable face. Apply villain makeup and styling only.

Apply DISNEY VILLAIN makeup to their existing face:
- Add dramatic dark makeup (Maleficent/Ursula style) to their features
- Enhance their existing eyebrows into bold dark shape
- Apply deep red or purple lips to their mouth
- Add theatrical villain makeup and styling
- Apply mysterious and dramatic lighting
- Keep their facial structure while adding villain aesthetic

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, expression, lighting, and styling effects
`
  },

  'superhero': {
    name: '마블 슈퍼히어로',
    emoji: '🦸',
    prompt: `
IMPORTANT: Keep person's face recognizable. Add superhero makeup and effects only.

Apply SUPERHERO STYLING to their existing face:
- Add dramatic superhero makeup to their features
- Apply subtle face paint in heroic colors
- Add glowing effects around their existing eyes
- Apply dynamic superhero styling and lighting
- Add epic cinematic effects
- Enhance their determined expression

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only makeup, lighting effects, face paint, and color grading
`
  },

  'alien-invasion': {
    name: '외계인',
    emoji: '👽',
    prompt: `
IMPORTANT: Keep face recognizable as the same person. Apply alien makeup effects only.

Apply ALIEN MAKEUP to their existing face:
- Add otherworldly skin tone (subtle green, blue tint) to their skin
- Apply alien-inspired makeup around their existing eyes
- Add bioluminescent pattern makeup on their skin
- Apply sci-fi makeup and lighting effects
- Keep their facial structure while adding alien aesthetic
- Add subtle alien-inspired styling

PRESERVE: Face shape, bone structure, facial proportions, identity
MODIFY: Only skin tone, makeup effects, lighting, and subtle alien styling
`
  },

  'instagram-filter': {
    name: '인스타 인플루언서',
    emoji: '📸',
    prompt: `
IMPORTANT: Keep person identifiable. Apply Instagram beauty filter effects only.

Apply INSTAGRAM BEAUTY FILTER to their existing face:
- Apply smooth skin filter to their existing features
- Add subtle eye enhancement (slight enlargement, sparkles)
- Apply subtle lip enhancement with gloss
- Add gentle slimming to their face shape
- Apply beauty filter effects and perfect lighting
- Add Instagram-style glow and color grading

PRESERVE: Face shape, core features, identity, recognizability
MODIFY: Only smoothing, subtle enhancements, lighting, and filter effects
`
  },

  'clown-circus': {
    name: '서커스 광대',
    emoji: '🤡',
    prompt: `
IMPORTANT: Maintain person's recognizable face. Apply clown makeup only.

Apply CIRCUS CLOWN MAKEUP to their existing face:
- Add white face paint base over their skin
- Paint red nose and exaggerated smile on their features
- Apply colorful clown makeup around eyes and cheeks
- Style their existing hair in clown fashion
- Keep their facial structure visible under makeup
- Add theatrical clown styling

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, face paint, hair styling, and clown accessories
`
  },

  'vampire-gothic': {
    name: '뱀파이어 고딕',
    emoji: '🧛',
    prompt: `
IMPORTANT: Keep person's face intact. Apply vampire gothic makeup only.

Apply GOTHIC VAMPIRE MAKEUP to their existing face:
- Add pale, porcelain skin tone to their existing skin
- Apply dark smoky eye makeup with red accents to their eyes
- Add blood-red lips to their mouth
- Enhance their existing features with gothic makeup
- Apply dramatic vampire lighting
- Keep their facial structure while adding vampire aesthetic

PRESERVE: Face shape, facial features, bone structure, identity
MODIFY: Only makeup, skin tone, lighting, and gothic styling
`
  },

  'pop-art': {
    name: '팝아트 (앤디 워홀)',
    emoji: '🎨',
    prompt: `
IMPORTANT: Maintain person's face structure. Apply pop art style as artistic filter only.

Apply POP ART STYLE (Andy Warhol) to their existing portrait:
- Add bold, high-contrast colors to their existing features
- Apply halftone dot pattern overlay
- Add comic book-style outlines around their features
- Use vibrant color blocks on their face
- Apply flat, graphic design aesthetic
- Keep their facial structure clearly recognizable

PRESERVE: Face shape, facial features, identity, proportions
MODIFY: Only art style, color treatment, patterns, and graphic effects
`
  },

  'crystal-gem': {
    name: '크리스탈 보석인간',
    emoji: '💎',
    prompt: `
IMPORTANT: Keep person identifiable. Add crystal effects as overlay only.

Apply CRYSTAL GEM EFFECTS to their existing face:
- Add shimmering crystal-like texture overlay to their skin
- Apply iridescent rainbow reflections to their features
- Add sparkling, faceted effects while keeping face shape
- Apply magical gem-like makeup and lighting
- Add glowing crystal effects
- Keep their facial structure clearly visible

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only texture overlay, lighting effects, sparkles, and color reflections
`
  },

  'oil-painting': {
    name: '유화 아트',
    emoji: '🖌️',
    prompt: `
IMPORTANT: Keep person's face recognizable. Apply oil painting technique as artistic filter only.

Apply IMPRESSIONIST OIL PAINTING style to their existing portrait:
- Add visible brushstroke texture overlay to their features
- Apply rich, vibrant oil paint color treatment
- Use artistic impressionist style while maintaining their face
- Apply painterly effects and blending
- Add Van Gogh or Monet inspired technique
- Keep their facial structure clear

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only paint texture, artistic technique, color treatment, and brushstroke effects
`
  },

  'drag-queen': {
    name: '드랙퀸 글램',
    emoji: '👑',
    prompt: `
IMPORTANT: Keep person's face intact. Apply drag queen makeup only.

Apply DRAG QUEEN MAKEUP to their existing face:
- Apply dramatic makeup to their existing features
- Add extreme contouring to enhance their bone structure
- Apply bold, colorful eye makeup to their eyes
- Add exaggerated lashes and enhanced brows
- Apply glossy statement lips to their mouth
- Keep their facial structure recognizable under dramatic makeup

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup application, contouring, lashes, and glamour effects
`
  },

  'mermaid-fantasy': {
    name: '인어공주',
    emoji: '🧜‍♀️',
    prompt: `
IMPORTANT: Maintain person's recognizable face. Add mermaid makeup and effects only.

Apply MERMAID FANTASY MAKEUP to their existing face:
- Add subtle iridescent scale makeup on their skin
- Apply ocean-inspired makeup (blues, greens, pearls) to their features
- Add glittery, shimmering effects
- Apply underwater-inspired makeup and accessories
- Add aquatic goddess styling
- Keep their facial structure clearly visible

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, scale effects, glitter, lighting, and mermaid accessories
`
  }
};

export async function POST(request) {
  try {
    const { image, filterType } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    const filter = FILTER_PROMPTS[filterType] || FILTER_PROMPTS['kpop-idol'];

    const fullPrompt = `
${filter.prompt}

CRITICAL INSTRUCTIONS:
- You MUST generate and return a new edited image, NOT text
- Apply the transformation directly to the person in the photo
- Maintain the original photo composition and pose
- Make the effect dramatic and clearly visible
- Ensure high quality output
`;

    // 이미지 데이터 추출
    const imageData = image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Gemini API 호출
    const model = "gemini-2.5-flash-image-preview";
    const contents = [
      { text: fullPrompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageData,
        },
      },
    ];

    console.log(`Applying ${filter.name} filter...`);
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
            filterName: filter.name,
            message: `${filter.name} 필터가 적용되었습니다!`
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
