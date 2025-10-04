import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

// 미친 창의적인 필터 프롬프트들
const FILTER_PROMPTS = {
  'kpop-idol': {
    name: 'K-POP 아이돌',
    emoji: '✨',
    prompt: `
Apply professional K-POP IDOL makeup style:
- Flawless glass skin with dewy finish
- Soft eyeshadow with thin eyeliner
- Natural gradient lips (pink/coral)
- Well-groomed Korean-style eyebrows
- Subtle pink blush on cheekbones
Create an elegant, camera-ready K-pop idol look.
`
  },

  'anime-character': {
    name: '애니메이션 캐릭터',
    emoji: '🎌',
    prompt: `
Transform this person into an ANIME CHARACTER:
- Large, sparkly anime-style eyes with highlights
- Smooth, cell-shaded anime skin texture
- Vibrant, exaggerated hair colors and shine
- Anime-style facial features (smaller nose, larger eyes)
- Add anime-style blush marks and expression lines
- Soft, glowing anime lighting effects
Make them look like they walked out of a Japanese anime!
`
  },

  'zombie-apocalypse': {
    name: '좀비 아포칼립스',
    emoji: '🧟',
    prompt: `
Transform into a TERRIFYING ZOMBIE:
- Decaying, pale greenish-gray skin
- Dark circles and sunken eyes
- Fake blood and wounds on face
- Disheveled, dirty hair
- Cracked lips and visible teeth
- Zombie-like makeup with realistic gore effects
Create a horrifying undead apocalypse survivor look!
`
  },

  'cyberpunk-neon': {
    name: '사이버펑크 네온',
    emoji: '🌃',
    prompt: `
Apply CYBERPUNK 2077 style transformation:
- Neon glowing tattoos on face (pink, blue, cyan)
- Futuristic chrome metallic skin highlights
- Holographic makeup with digital glitch effects
- LED light strips on cheekbones
- Cybernetic eye enhancements with glowing irises
- High-tech facial implants and modifications
Create a futuristic cyberpunk netrunner aesthetic!
`
  },

  'renaissance-painting': {
    name: '르네상스 명화',
    emoji: '🖼️',
    prompt: `
Transform into a RENAISSANCE OIL PAINTING:
- Classical oil painting texture and brushstrokes
- Soft, diffused lighting like 16th century portraits
- Rich, warm color palette with deep shadows
- Classical European noble attire and styling
- Ornate background with golden tones
- Realistic Renaissance-era makeup and hairstyles
Make them look like a Da Vinci or Raphael masterpiece!
`
  },

  'pixar-character': {
    name: '픽사 3D 캐릭터',
    emoji: '🎬',
    prompt: `
Transform into a PIXAR 3D ANIMATED CHARACTER:
- Smooth, stylized 3D rendering like Toy Story
- Exaggerated, friendly cartoon features
- Large expressive eyes with perfect highlights
- Soft, appealing character design
- Vibrant colors with subtle subsurface scattering
- Adorable, family-friendly Pixar aesthetic
Make them look like they belong in a Pixar movie!
`
  },

  'old-grandparent': {
    name: '80년 후 나',
    emoji: '👴',
    prompt: `
AGE PROGRESSION to 80 YEARS OLD:
- Deep wrinkles and age lines
- Gray or white hair
- Age spots and skin texture changes
- Drooping facial features
- Thinner lips and sagging skin
- Realistic elderly appearance
Show what they'll look like as a grandparent!
`
  },

  'baby-filter': {
    name: '아기 버전',
    emoji: '👶',
    prompt: `
Transform into a CUTE BABY:
- Chubby baby cheeks and round face
- Large innocent eyes
- Smooth baby skin texture
- Tiny nose and small features
- Baby-like proportions
- Adorable infant appearance
Show their baby version!
`
  },

  'glamour-magazine': {
    name: '보그 매거진 커버',
    emoji: '💄',
    prompt: `
Create a VOGUE MAGAZINE COVER look:
- High-fashion editorial makeup
- Dramatic contouring and highlighting
- Bold, artistic eye makeup
- Glossy statement lips
- Professional studio lighting effects
- Flawless retouched skin
- Elegant, sophisticated styling
Magazine cover-ready glamour shot!
`
  },

  'disney-villain': {
    name: '디즈니 악당',
    emoji: '😈',
    prompt: `
Transform into a DISNEY VILLAIN:
- Dramatic dark makeup (Maleficent/Ursula style)
- Sharp, angular features
- Bold dark eyebrows
- Deep red or purple lips
- Theatrical villain styling
- Mysterious and intimidating look
- Exaggerated villain expressions
Evil Disney antagonist transformation!
`
  },

  'superhero': {
    name: '마블 슈퍼히어로',
    emoji: '🦸',
    prompt: `
Transform into a MARVEL SUPERHERO:
- Comic book-style bold features
- Dramatic superhero makeup
- Face paint in heroic colors
- Determined, powerful expression
- Glowing effects around eyes
- Dynamic superhero styling
- Epic cinematic lighting
Ready to save the world!
`
  },

  'alien-invasion': {
    name: '외계인',
    emoji: '👽',
    prompt: `
Transform into an ALIEN BEING:
- Otherworldly skin tone (green, blue, or iridescent)
- Large, mysterious alien eyes
- Smooth, non-human features
- Bioluminescent patterns on skin
- Antenna or alien head features
- Sci-fi extraterrestrial appearance
Close encounter transformation!
`
  },

  'instagram-filter': {
    name: '인스타 인플루언서',
    emoji: '📸',
    prompt: `
Apply EXTREME INSTAGRAM FILTER:
- Ultra-smooth airbrushed skin
- Enlarged eyes with sparkles
- Plumped lips with gloss
- Slimmed nose and face
- Heavy beauty filter effects
- Perfect lighting and glow
- Influencer-level face tune
Maximum Instagram aesthetic!
`
  },

  'clown-circus': {
    name: '서커스 광대',
    emoji: '🤡',
    prompt: `
Transform into a CIRCUS CLOWN:
- White face paint base
- Red nose and exaggerated smile
- Colorful clown makeup
- Wild, crazy hair
- Dramatic expressions
- Theatrical circus performer look
Scary or funny clown transformation!
`
  },

  'vampire-gothic': {
    name: '뱀파이어 고딕',
    emoji: '🧛',
    prompt: `
Transform into a GOTHIC VAMPIRE:
- Pale, porcelain white skin
- Dark smoky eyes with red accents
- Blood-red lips
- Sharp, defined features
- Gothic dramatic makeup
- Mysterious vampire aesthetic
- Dark, romantic styling
Eternal creature of the night!
`
  },

  'pop-art': {
    name: '팝아트 (앤디 워홀)',
    emoji: '🎨',
    prompt: `
Transform into POP ART style (Andy Warhol):
- Bold, high-contrast colors
- Halftone dot patterns
- Comic book-style outlines
- Vibrant primary colors
- Flat, graphic design aesthetic
- 1960s pop art movement style
Like a Warhol Marilyn Monroe print!
`
  },

  'crystal-gem': {
    name: '크리스탈 보석인간',
    emoji: '💎',
    prompt: `
Transform into a CRYSTAL GEM BEING:
- Skin made of shimmering crystals
- Diamond and gemstone textures
- Iridescent rainbow reflections
- Sparkling, faceted features
- Magical gem-like appearance
- Glowing crystal energy
Living precious stone transformation!
`
  },

  'oil-painting': {
    name: '유화 아트',
    emoji: '🖌️',
    prompt: `
Transform into an IMPRESSIONIST OIL PAINTING:
- Visible brushstroke texture
- Rich, vibrant oil paint colors
- Artistic impressionist style
- Painterly effects and blending
- Museum-quality art piece
- Van Gogh or Monet inspired
Living artwork transformation!
`
  },

  'drag-queen': {
    name: '드랙퀸 글램',
    emoji: '👑',
    prompt: `
Transform into DRAG QUEEN GLAMOUR:
- Over-the-top dramatic makeup
- Extreme contouring and highlighting
- Bold, colorful eye makeup
- Exaggerated lashes and brows
- Glossy statement lips
- Theatrical drag performance look
- Fierce and fabulous!
RuPaul's Drag Race ready!
`
  },

  'mermaid-fantasy': {
    name: '인어공주',
    emoji: '🧜‍♀️',
    prompt: `
Transform into a MYSTICAL MERMAID:
- Iridescent scales on skin
- Ocean-inspired makeup (blues, greens, pearls)
- Glittery, shimmering effects
- Seashell and coral accessories
- Underwater fantasy aesthetic
- Aquatic goddess appearance
Under the sea transformation!
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
