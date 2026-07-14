// PIN 모드 합성 프롬프트 (스타일 선택 지원)

// 상반신 포즈 풀 (2~4명 호환, 성별 무관, 팬미팅 감성)
// 각 포즈의 행동이 확실히 다르도록 설계 — 유사 포즈 제거
const MEDIUM_POSES = [
  'everyone standing side by side, arms around each other\'s shoulders, looking at camera',
  'everyone waving at camera with one hand raised high, as if greeting fans',
  'one person slightly behind the others, chin resting on someone\'s shoulder, looking at camera',
  'everyone looking at each other (not at camera), candid moment',
  'everyone leaning in close together, looking at camera',
  'everyone making peace signs at different heights',
];

// 탑뷰 포즈 풀 — 높은 곳에서 내려다보는 앵글
const TOPVIEW_POSES = [
  'high angle camera from above looking down at everyone, everyone looking up at camera, shot from elevated position showing upper bodies and the floor beneath them',
  'high angle camera from above, everyone crouching or squatting close together on the ground, looking up at camera, floor visible around them',
  'high angle overhead camera, everyone standing close in a circle and tilting their heads back to look up at camera, shot from above showing full upper bodies and ground',
];

function pickPoses() {
  // 상반신 6개 중 3개 랜덤 (중복 없이)
  const shuffled = [...MEDIUM_POSES].sort(() => Math.random() - 0.5);
  const mediums = shuffled.slice(0, 3);
  // 탑뷰 3개 중 1개 랜덤
  const topview = TOPVIEW_POSES[Math.floor(Math.random() * TOPVIEW_POSES.length)];
  return [...mediums, topview];
}

// 선택 가능한 화풍 프리셋 — 유저+레퍼런스 모두 이 화풍으로 재렌더 (실사 레퍼도 변환)
export const STYLE_PRESETS = {
  webtoon: 'a soft casual Korean slice-of-life webtoon style — thin, nearly-lineless outlines, flat soft shading with gentle low-contrast lighting, a warm muted pastel palette, simplified friendly rounded faces with calm medium eyes, cozy and understated',
  semireal: 'a polished semi-realistic Korean manhwa style — crisp precise defined linework, realistic proportions and accurate facial anatomy, small refined eyes with a strong upper-lash line and a defined nose, smooth airbrush gradient rendering with glossy skin and hair, a subdued cinematic palette of deep blues and warm browns, mature (clearly a drawn illustration, not a photo)',
  sunjeong: 'a dreamy Korean sunjeong romance webtoon look — delicate thin ink linework, huge glittering sparkling eyes with star-shaped highlights, long flowing finely detailed hair, slender elegant proportions, soft pastel colors with flower and glow accents, delicate and idol-pretty',
  ropan: 'an opulent fantasy-romance (royal-court) webtoon style — elegant delicate linework, large jewel-like eyes, ornately detailed royal gowns jewelry and lace, luminous sparkling highlights over hair and eyes, richly painted palace backgrounds, saturated jewel-tone colors with a soft glow, luxurious and fairytale-like',
  anime: 'a bold modern Japanese TV-anime cel style — crisp thick clean outlines, flat cel shading with hard sharp shadow edges, punchy high-saturation colors, glossy rim light and subtle digital glow, big glossy expressive anime eyes with multiple highlights, sleek and polished',
  idoleye: 'a modern idol-anime style with hyper-detailed eyes — a clean simple face contrasted with elaborate glossy eyes full of star- and galaxy-shaped highlights and color gradients, vivid high-saturation colorful hair, sleek trendy idol styling, bright and glittery',
  cinematic: 'a cinematic glow anime style — soft clean character linework, warm golden-hour lighting with lens flare and glowing bokeh, a saturated deep-blue-shadow to orange-highlight color grade, large glossy emotional eyes, dreamy and romantic',
  watertoon: 'a soft hand-painted watercolor storybook anime style — gentle clean line art with flat soft-colored characters set against warm hand-painted watercolor backgrounds, soft natural daylight, a cozy nostalgic muted palette, rounded friendly faces with simple expressive eyes, warm and storybook-like',
  chibi: 'a cute chibi super-deformed anime style — an oversized round head on a tiny stubby body (about 2 heads tall), huge glossy sparkling anime eyes, a tiny simplified nose and mouth, clean bold outlines with soft flat cel shading, bright candy-pastel colors, adorable and playful',
  figurine: 'a glossy collectible chibi figurine style — the subject as a smooth hard vinyl toy figure with big-head small-body proportions, a clean glossy plastic surface with soft reflective highlights, simplified cute sculpted features, clean studio product lighting like a blind-box collectible figure',
  render3d: 'a soft 3D animated-movie heroine style — soft dewy porcelain skin, large sparkling doe eyes with long lashes and bright catchlights, delicate rounded features, glossy flowing voluminous hair, rosy blush, warm magical rim lighting, a cute 3D animated-film character render',
  watercolor: 'a soft dreamy watercolor painting style — gentle wet watercolor washes and gouache texture, a muted dreamy pastel palette, delicate simplified features, soft warm picture-book lighting, hand-painted tenderness on visible textured paper',
};
export const DEFAULT_STYLE = 'webtoon';

export function buildSeedreamPrompt(customerData, mode, style = DEFAULT_STYLE) {
  const styleDesc = STYLE_PRESETS[style] || STYLE_PRESETS[DEFAULT_STYLE];

  if (mode === 'grid') {
    const poses = pickPoses();

    return [
      `Image 1 = the real user(s) in their OWN clothes. Image 2 = the reference character(s). There may be one or several people in each image; ALL of them must appear together in every panel — do not omit anyone.`,
      `Generate a 2x2 grid of 4 panels, edge-to-edge, no borders or gaps. Make the 4 panels clearly different from each other — vary the camera distance (close-up vs full-body), the angle (eye-level / high / low), and the arrangement. Panel 1: ${poses[0]}. Panel 2: ${poses[1]}. Panel 3: ${poses[2]}. Panel 4: ${poses[3]}.`,
      `STYLE: Redraw EVERYONE — users and references — in ONE consistent art style: ${styleDesc}. Even if an image is a real photo, fully convert it into this illustration style; keep nobody photorealistic. This unified style applies to the drawing medium ONLY — it must NOT make different people look alike.`,
      `KEEP EACH PERSON THEMSELF: every user keeps their OWN face, their distinctive features (eye and eyelid shape, nose, lips, face and jaw shape, moles), their OWN hair, their OWN clothing, and their OWN ethnicity exactly as in image 1 — do NOT Westernize or lighten an Asian user, and do NOT put a reference's outfit or features onto a user. Each reference keeps its own face, hair, and outfit from image 2.`,
      `Everyone must stay a clearly distinct, recognizable individual — never merge, average, swap, or duplicate any two people, even in close-up panels. CONSISTENCY: the SAME user must look like the SAME single person with an identical face in ALL 4 panels — a user's face must not change, drift, or shift ethnicity between panels; panels 1, 2, 3 and 4 must show the exact same user. Keep each user's real face and natural expression (do NOT turn them into a generic pretty/handsome face).`,
      `All subjects fully inside each panel with margin. No tongue-out, duck-face, or kissing. White-to-light-gray gradient background; no text, logos, or watermarks.`,
    ].join(' ');
  }

  // 싱글 모드 (현재 미사용, 향후 필요 시 활성화)
  const pose = MEDIUM_POSES[Math.floor(Math.random() * MEDIUM_POSES.length)];
  return [
    `The second image is a reference person/character.`,
    `IMPORTANT: ALL people from both images must appear — do NOT omit anyone.`,
    `STYLE: Redraw BOTH the user and the reference person/character in the unified art style: ${styleDesc}. Even if the reference is a real photo, convert it fully into this style — do NOT keep anyone photorealistic. Preserve the user's face identity; preserve the reference's identity/design (hair, outfit, features) but redrawn in this style. The user and reference must remain two clearly distinct people — do NOT blend or swap their facial features.`,
    `Generate a photobooth photo with all people from both images. Pose: ${pose}.`,
    `FORBIDDEN: tongue out, duck face, kissing, pouting.`,
    `White-to-light-gray gradient background. No text or watermarks.`,
  ].join(' ');
}
