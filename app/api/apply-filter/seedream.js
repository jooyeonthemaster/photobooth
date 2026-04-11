// Seedream 5.0 Lite 합성 프롬프트 (PIN 모드 전용)

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

export function buildSeedreamPrompt(customerData, mode) {
  if (mode === 'grid') {
    const poses = pickPoses();

    return [
      `The first image is a photo of the user(s). The second image is a reference person/character.`,
      `IMPORTANT: If either image contains multiple people, ALL of them must appear in every panel — do NOT omit anyone from either image.`,
      `Generate a 2x2 grid output with 4 panels, no borders or gaps between panels, tiling edge-to-edge.`,
      `CRITICAL: Each panel MUST be clearly distinguishable from the others. Vary the camera distance (close-up vs full-body), camera angle (eye-level, high angle, low angle), body orientation, and spatial arrangement between panels. No two panels should look similar.`,
      `STYLE MATCHING (CRITICAL): Carefully analyze the SPECIFIC art style of the reference character in the second image — including line weight, shading technique, color palette, level of detail, eye style, proportions, and rendering method. Reproduce that EXACT same visual style for the entire output. Do NOT default to a generic anime/cartoon look — match the reference image's unique style precisely. If the reference is a real photo, keep photorealistic. Maintain this style consistently across all 4 panels.`,
      `In each panel, place ALL people from the first image together with ALL people/characters from the reference image. Every person from both images must appear in every panel — do NOT omit anyone. Transform all users into the same art style as the reference — they must look like they belong in the same universe/show as the reference characters. Preserve each user's face identity (facial features, face shape) while adapting to the art style. IMPORTANT: The user's head/face size must match the reference character's head/face size — do NOT make the user's head appear larger.`,
      `Preserve every reference character's EXACT visual design — face, hair color/style, outfit, skin tone, accessories, and distinctive features — consistently across all 4 panels. Each character must be clearly distinguishable from the others.`,
      `BEAUTY ENHANCEMENT (APPLY ONLY TO THE USER FROM THE FIRST IMAGE — do NOT alter the reference character's appearance in any way): The user's face must remain clearly recognizable as the same person in the first image across ALL 4 panels. SKIN: Smooth out blemishes, acne, pores, and uneven skin texture to a clean, clear finish. Even out skin tone and remove redness or dark spots. Reduce wrinkles, fine lines, and under-eye circles. FACIAL HAIR: Remove all visible facial hair — stubble, beard, mustache, and beard shadow — so the skin appears clean-shaven. FACE SHAPE (IMPORTANT): Cameras add weight and width to faces. You MUST compensate for this by making the user's face appear slimmer and more defined than in the input photo — slim the jawline, reduce cheek width, and define the chin. The result should look like how the person looks in real life, not how the camera captured them. BODY: Make the user's body appear slightly slimmer and well-proportioned. LIGHTING: Use soft, flattering lighting that minimizes harsh shadows. The user should look like their best natural self. The reference character from the second image must remain EXACTLY as they appear in the original — no modifications.`,
      `Panel 1 (top-left): ${poses[0]}.`,
      `Panel 2 (top-right): ${poses[1]}.`,
      `Panel 3 (bottom-left): ${poses[2]}.`,
      `Panel 4 (bottom-right): ${poses[3]}.`,
      `Preserve the user's original facial expression from the input photo — do not alter their smile, mouth shape, or expression.`,
      `FRAMING: All subjects must be fully contained within each panel — no body parts, heads, or limbs cut off or extending beyond the panel boundary. Leave adequate margin from the edges.`,
      `FORBIDDEN: tongue out, duck face, kissing, pouting, identical or near-identical compositions across panels, same camera distance in all panels.`,
      `White-to-light-gray gradient background. No text, watermarks, logos, or borders.`,
    ].join(' ');
  }

  // 싱글 모드 (현재 미사용, 향후 필요 시 활성화)
  const pose = MEDIUM_POSES[Math.floor(Math.random() * MEDIUM_POSES.length)];
  return [
    `The second image is a reference person/character.`,
    `IMPORTANT: ALL people from both images must appear — do NOT omit anyone.`,
    `STYLE: Match the reference's art style precisely. If reference is a photo, keep photorealistic. Transform user into this style, preserve face identity and original skin tone. Do not alter reference's appearance. The user and reference must remain two clearly distinct people — do NOT blend or swap their facial features.`,
    `Generate a photobooth photo with all people from both images. Pose: ${pose}.`,
    `BEAUTY (user only): Smooth skin, remove blemishes. Preserve original skin tone — do not darken. Remove facial hair, slim jawline/cheeks for camera compensation. Soft even lighting. Natural and attractive.`,
    `FORBIDDEN: tongue out, duck face, kissing, pouting.`,
    `White-to-light-gray gradient background. No text or watermarks.`,
  ].join(' ');
}
