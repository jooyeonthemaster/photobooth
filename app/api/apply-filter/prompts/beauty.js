// 뷰티 카테고리 필터 프롬프트
export const BEAUTY_PROMPTS = {
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
};
