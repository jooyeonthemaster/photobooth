// 아트 카테고리 필터 프롬프트
export const ART_PROMPTS = {
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
};
