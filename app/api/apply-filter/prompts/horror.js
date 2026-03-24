// 호러/펀 카테고리 필터 프롬프트
export const HORROR_PROMPTS = {
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
};
