// Seedream 5.0 Lite 합성 프롬프트 (PIN 모드 전용)

// 포즈 후보 풀 — 카테고리별로 분류, 매 요청마다 각 카테고리에서 1개씩 선택
const POSE_CATEGORIES = [
  // 카테고리 A: 클로즈업 / 얼굴 중심
  [
    'close-up selfie angle from slightly above, both faces close together looking up at camera',
    'tight headshot of both leaning heads together, soft smiles, shallow depth of field',
  ],
  // 카테고리 B: 상반신 / 인터랙션
  [
    'medium shot, the reference person has arm around the user\'s shoulder, both making peace signs',
    'medium shot, high-five pose captured mid-action, both looking at each other with excited expressions',
    'medium shot, the reference person playfully resting chin on the user\'s shoulder from behind',
    'medium shot, both holding up finger hearts together, slightly tilted heads',
  ],
  // 카테고리 C: 전신 / 다이나믹 포즈
  [
    'full-body shot, back-to-back pose with crossed arms, both looking over shoulders at camera confidently',
    'full-body shot, both jumping mid-air with arms raised, energetic and fun',
    'full-body shot, both striking a cool runway pose side by side',
  ],
  // 카테고리 D: 유니크 앵글 / 창의적 구도
  [
    'both sitting casually on the ground, relaxed and candid vibe, eye-level camera angle',
    'overhead top-down camera angle, everyone standing close together in a circle looking up at the camera above them, faces gathered toward the center of the frame, bright smiles',
  ],
];

function pickOnePerCategory() {
  return POSE_CATEGORIES.map(category => {
    const idx = Math.floor(Math.random() * category.length);
    return category[idx];
  });
}

export function buildSeedreamPrompt(customerData, mode) {
  if (mode === 'grid') {
    const poses = pickOnePerCategory();

    return [
      `The first image is a photo of the user(s). The second image is a reference person/character. IMPORTANT: If either image contains multiple people, ALL of them must appear in every panel — do NOT omit anyone from either image.`,
      `Generate a 2x2 grid output with 4 panels, no borders or gaps between panels, tiling edge-to-edge.`,
      `CRITICAL: Each panel MUST be clearly distinguishable from the others. Vary the camera distance (close-up vs full-body), camera angle (eye-level, high angle, low angle), body orientation, and spatial arrangement between panels. No two panels should look similar.`,
      `STYLE MATCHING (CRITICAL): Carefully analyze the SPECIFIC art style of the reference character in the second image — including line weight, shading technique, color palette, level of detail, eye style, proportions, and rendering method. Reproduce that EXACT same visual style for the entire output. Do NOT default to a generic anime/cartoon look — match the reference image's unique style precisely. If the reference is a real photo, keep photorealistic. Maintain this style consistently across all 4 panels.`,
      `In each panel, place ALL people from the first image together with ALL people/characters from the reference image. Every person from both images must appear in every panel — do NOT omit anyone. Transform all users into the same art style as the reference — they must look like they belong in the same universe/show as the reference characters. Preserve each user's face identity (facial features, face shape) while adapting to the art style. IMPORTANT: The user's head/face size must match the reference character's head/face size — do NOT make the user's head appear larger.`,
      `Preserve every reference character's EXACT visual design — face, hair color/style, outfit, skin tone, accessories, and distinctive features — consistently across all 4 panels. Each character must be clearly distinguishable from the others.`,
      `Panel 1 (top-left): ${poses[0]}.`,
      `Panel 2 (top-right): ${poses[1]}.`,
      `Panel 3 (bottom-left): ${poses[2]}.`,
      `Panel 4 (bottom-right): ${poses[3]}.`,
      `VARIETY RULES: Panel framing must differ — mix close-ups, medium shots, and full-body shots. Body positions must differ — mix facing camera, side profile, and angled poses. At least one panel must show a different camera height than the others.`,
      `BEAUTY ENHANCEMENT (APPLY ONLY TO THE USER FROM THE FIRST IMAGE — do NOT alter the reference character's appearance in any way): The user's face must remain clearly recognizable as the same person in the first image across ALL 4 panels. SKIN: Smooth out blemishes, acne, pores, and uneven skin texture to a clean, clear finish. Even out skin tone and remove redness or dark spots. Reduce wrinkles, fine lines, and under-eye circles. FACIAL HAIR: Remove all visible facial hair — stubble, beard, mustache, and beard shadow — so the skin appears clean-shaven. FACE SHAPE (IMPORTANT): Cameras add weight and width to faces. You MUST compensate for this by making the user's face appear slimmer and more defined than in the input photo — slim the jawline, reduce cheek width, and define the chin. The result should look like how the person looks in real life, not how the camera captured them. BODY: Make the user's body appear slightly slimmer and well-proportioned. LIGHTING: Use soft, flattering lighting that minimizes harsh shadows. The user should look like their best natural self. The reference character from the second image must remain EXACTLY as they appear in the original — no modifications.`,
      `Everyone must have a warm, soft smile in every panel — not a big open-mouth laugh, but not a blank serious face either. Relaxed and happy.`,
      `FRAMING: All subjects must be fully contained within each panel — no body parts, heads, or limbs cut off or extending beyond the panel boundary. Leave adequate margin from the edges.`,
      `FORBIDDEN: tongue out, duck face, kissing, pouting, wide-open mouth laughing, stone-faced serious expressions, identical or near-identical compositions across panels, same camera distance in all panels.`,
      `White-to-light-gray gradient background. No text, watermarks, logos, or borders.`,
    ].join(' ');
  }

  // 싱글 모드 (그리드 실패 시 fallback)
  const randomCategory = POSE_CATEGORIES[Math.floor(Math.random() * POSE_CATEGORIES.length)];
  const pose = randomCategory[Math.floor(Math.random() * randomCategory.length)];
  return [
    `The second image is a reference person/character.`,
    `STYLE MATCHING (CRITICAL): Carefully analyze the SPECIFIC art style of the reference character — line weight, shading, color palette, eye style, proportions, rendering method. Reproduce that EXACT visual style. Do NOT default to generic anime/cartoon. If the reference is a real photo, keep photorealistic.`,
    `Generate a photobooth photo with ALL people from the first image together with ALL people/characters from the reference image. Every person from both images must appear — do NOT omit anyone. Pose: ${pose}.`,
    `Transform the user into the same art style as the reference. Preserve the user's face identity while adapting to the style. The user's head/face size must match the reference character's head/face size.`,
    `Preserve every reference character's EXACT visual design — face, hair, outfit, skin tone, accessories. Each character must be clearly distinguishable.`,
    `BEAUTY ENHANCEMENT (APPLY ONLY TO THE USER FROM THE FIRST IMAGE — do NOT alter the reference character's appearance in any way): The user's face must remain clearly recognizable as the same person in the first image. SKIN: Smooth out blemishes, acne, pores, and uneven skin texture to a clean, clear finish. Even out skin tone and remove redness or dark spots. Reduce wrinkles, fine lines, and under-eye circles. FACIAL HAIR: Remove all visible facial hair — stubble, beard, mustache, and beard shadow — so the skin appears clean-shaven. FACE SHAPE (IMPORTANT): Cameras add weight and width to faces. You MUST compensate for this by making the user's face appear slimmer and more defined than in the input photo — slim the jawline, reduce cheek width, and define the chin. The result should look like how the person looks in real life, not how the camera captured them. BODY: Make the user's body appear slightly slimmer and well-proportioned. LIGHTING: Use soft, flattering lighting that minimizes harsh shadows. The user should look like their best natural self. The reference character from the second image must remain EXACTLY as they appear in the original — no modifications.`,
    `FORBIDDEN: tongue out, duck face, kissing, pouting.`,
    `White-to-light-gray gradient background. No text, watermarks, logos, or borders.`,
  ].join(' ');
}
