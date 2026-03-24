// 그리드 모드 프롬프트 래퍼 (4장을 하나의 2x2 그리드로 일괄 처리)
export function wrapGridPrompt(filterPrompt) {
  return `
CRITICAL CONTEXT: The input image is a 2x2 GRID containing 4 SEPARATE portrait photos taken at DIFFERENT moments.
Each quadrant shows a person in a DIFFERENT pose, angle, expression, or body position.

The grid layout is:
  ┌────────────┬────────────┐
  │  Photo A   │  Photo B   │
  │ (top-left) │(top-right) │
  ├────────────┼────────────┤
  │  Photo C   │  Photo D   │
  │(bot-left)  │(bot-right) │
  └────────────┴────────────┘

=== GRID RULES (MUST FOLLOW) ===
1. MAINTAIN the exact 2x2 grid layout. Do NOT merge, blend, overlap, or rearrange the 4 photos.
2. Each quadrant has a UNIQUE photo with DIFFERENT pose/angle/expression. You MUST preserve these differences. Do NOT copy one quadrant's result to the others.
3. Apply the SAME artistic filter with IDENTICAL style, color palette, and art direction to ALL 4 photos.
4. The SUBJECT PERSON in each quadrant must keep their ORIGINAL unique pose and expression exactly as in the input.
5. The output image MUST have the SAME dimensions and grid structure as the input.
6. Do NOT add borders, gaps, lines, or separators between the quadrants.
7. CRITICAL: All 4 quadrants must look DIFFERENT from each other (preserving original poses) but share the SAME artistic style and mood.

=== FILTER TO APPLY TO ALL 4 PHOTOS ===
${filterPrompt}

=== FINAL REMINDER ===
- Output must be a single image with the same 2x2 grid layout as input.
- All 4 photos must have the same filter style but DIFFERENT compositions (preserving original poses).
- Do NOT make all 4 quadrants look identical — each has its own unique photo.
`;
}
