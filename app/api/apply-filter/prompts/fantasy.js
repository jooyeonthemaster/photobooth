// 판타지 카테고리 필터 프롬프트
export const FANTASY_PROMPTS = {
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
};
