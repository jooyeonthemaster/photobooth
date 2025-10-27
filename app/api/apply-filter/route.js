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

BACKGROUND: Replace background with K-POP concept aesthetic
- Holographic pastel gradient background (pink, purple, blue)
- Add soft bokeh lights and sparkle effects
- Studio lighting with neon glow accents
- Clean, modern K-POP album cover style

PRESERVE: Face shape, eye shape, nose, facial proportions, identity
MODIFY: Only makeup, skin texture, lighting, color grading, and background
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

BACKGROUND: Replace background with anime scene aesthetic
- Cherry blossom petals floating in soft focus
- Pastel sky with anime-style clouds (pink, lavender, light blue)
- Soft bokeh effects with sparkles
- Studio Ghibli or modern anime background style

PRESERVE: Facial structure, eye/nose/mouth positions, face shape, identity
MODIFY: Only art style, shading technique, highlights, drawing style overlay, and background
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

BACKGROUND: Replace background with apocalyptic scene
- Destroyed urban environment with ruins and debris
- Dark, foggy atmosphere with greenish-gray tint
- Crumbling buildings and broken windows in soft focus
- Moody horror movie lighting with atmospheric haze

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only skin color, makeup effects, hair styling, wounds, and background
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

BACKGROUND: Replace background with cyberpunk cityscape
- Neon-lit futuristic city streets with skyscrapers
- Holographic advertisements and signs in soft focus
- Purple, cyan, and magenta neon glow reflections
- Blade Runner or Ghost in the Shell inspired atmosphere

PRESERVE: Face shape, eye shape, nose, facial proportions, identity
MODIFY: Only lighting effects, makeup, glowing elements, color overlays, and background
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

BACKGROUND: Replace background with Renaissance era scene
- Classical European architectural elements (columns, arches)
- Rich fabric drapes in deep burgundy, gold, emerald
- Painted landscape with rolling hills in soft focus
- Leonardo da Vinci or Raphael inspired composition style

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only art texture, lighting style, color palette, painting technique, and background
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

BACKGROUND: Replace background with Pixar animated world
- Colorful, vibrant environment with soft 3D rendered elements
- Warm, inviting atmosphere with cartoon-style buildings or nature
- Soft depth of field with bokeh light effects
- Up, Toy Story, or Coco inspired scene aesthetic

PRESERVE: Face shape, eye/nose/mouth proportions, identity, bone structure
MODIFY: Only rendering style, lighting, slight feature enhancement, color vibrancy, and background
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

BACKGROUND: Replace background with cozy elderly environment
- Warm, comfortable home interior with vintage furniture
- Soft natural window light with gentle shadows
- Classic family photo frames and memorabilia in soft focus
- Nostalgic, peaceful atmosphere with warm color tones

PRESERVE: Core facial structure, identity, eye/nose proportions
MODIFY: Only skin texture, hair color, wrinkles, aging effects, and background
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

BACKGROUND: Replace background with nursery or playroom
- Soft pastel colors (baby blue, pink, mint green)
- Cute toys, balloons, and playful decorations in soft focus
- Warm, gentle lighting creating safe, cozy atmosphere
- Dreamy, innocent childhood environment

PRESERVE: Facial identity, core features, bone structure
MODIFY: Only skin smoothness, slight feature softening, youthful effect, and background
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

BACKGROUND: Replace background with high-fashion editorial studio
- Clean, minimalist white or gradient backdrop
- Professional studio lighting setup with soft shadows
- Elegant, sophisticated atmosphere
- Vogue, Harper's Bazaar style magazine cover aesthetic

PRESERVE: Face shape, facial features, identity, proportions
MODIFY: Only makeup, lighting, retouching, color grading, and background
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

BACKGROUND: Replace background with villain lair atmosphere
- Dark castle interior with stone walls and shadows
- Mysterious purple and green lighting effects
- Theatrical curtains or gothic architecture in soft focus
- Maleficent, Ursula, or Evil Queen inspired setting

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, expression, lighting, styling effects, and background
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

BACKGROUND: Replace background with superhero battle scene
- Dynamic city skyline with skyscrapers
- Epic lightning, energy effects, and action atmosphere
- Dramatic clouds and heroic lighting
- Marvel or DC superhero movie aesthetic with motion blur

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only makeup, lighting effects, face paint, color grading, and background
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

BACKGROUND: Replace background with alien spaceship or planet
- Futuristic alien technology with glowing control panels
- Otherworldly landscape or spacecraft interior
- Bioluminescent alien flora in soft focus
- Sci-fi movie aesthetic with mysterious atmosphere

PRESERVE: Face shape, bone structure, facial proportions, identity
MODIFY: Only skin tone, makeup effects, lighting, subtle alien styling, and background
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

BACKGROUND: Replace background with trendy Instagram aesthetic
- Minimalist cafe or trendy urban setting
- Soft bokeh lights and warm ambient lighting
- Instagram-worthy pastel or neutral tones
- Influencer lifestyle aesthetic with aesthetic blur

PRESERVE: Face shape, core features, identity, recognizability
MODIFY: Only smoothing, subtle enhancements, lighting, filter effects, and background
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

BACKGROUND: Replace background with circus tent interior
- Colorful striped circus tent with red, yellow, blue stripes
- Circus lights and festive decorations in soft focus
- Playful, energetic carnival atmosphere
- Classic big top circus aesthetic with bokeh lights

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, face paint, hair styling, clown accessories, and background
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

BACKGROUND: Replace background with gothic vampire castle
- Dark medieval castle interior with stone walls
- Candlelight and dramatic shadows creating moody atmosphere
- Gothic architecture with arched windows in soft focus
- Dracula or Twilight inspired vampire lair aesthetic

PRESERVE: Face shape, facial features, bone structure, identity
MODIFY: Only makeup, skin tone, lighting, gothic styling, and background
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

BACKGROUND: Replace background with pop art composition
- Bold color blocks (yellow, red, blue, green)
- Andy Warhol style repeated pattern or comic book dots
- Flat graphic design with high contrast
- 1960s pop art movement aesthetic

PRESERVE: Face shape, facial features, identity, proportions
MODIFY: Only art style, color treatment, patterns, graphic effects, and background
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

BACKGROUND: Replace background with crystal cave environment
- Glittering crystal formations and geodes
- Iridescent rainbow light reflections in soft focus
- Magical sparkling atmosphere with bokeh effects
- Fantasy gemstone cavern with mystical lighting

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only texture overlay, lighting effects, sparkles, color reflections, and background
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

BACKGROUND: Replace background with impressionist painted scene
- Painted garden or natural landscape with visible brushstrokes
- Vibrant impressionist colors (sunflowers, water lilies, sky)
- Van Gogh or Monet inspired outdoor setting
- Artistic painterly atmosphere with rich texture

PRESERVE: Facial structure, features, identity, face shape
MODIFY: Only paint texture, artistic technique, color treatment, brushstroke effects, and background
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

BACKGROUND: Replace background with drag show stage
- Glamorous stage with spotlight and colorful lights
- Theatrical curtains and glittering decorations
- RuPaul's Drag Race inspired runway atmosphere
- Dramatic performance lighting with bokeh effects

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup application, contouring, lashes, glamour effects, and background
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

BACKGROUND: Replace background with underwater ocean scene
- Underwater environment with coral reefs and seaweed
- Sunlight filtering through water creating ethereal rays
- Tropical fish and bubbles in soft focus
- Little Mermaid or Aquaman inspired oceanic atmosphere

PRESERVE: Face shape, bone structure, facial features, identity
MODIFY: Only makeup, scale effects, glitter, lighting, mermaid accessories, and background
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
- MULTIPLE PEOPLE HANDLING: Apply this filter to ALL people in the photo equally
  * If there is 1 person: apply the filter to that person
  * If there are 2 or more people: apply the filter to ALL people with the same intensity
  * Do not skip any faces or favor one person over another
- Maintain the original photo composition and pose
- Make the effect dramatic and clearly visible
- Ensure high quality output
- Apply the background transformation as specified in the BACKGROUND section
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
