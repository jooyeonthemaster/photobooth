// 네온 스티커 카테고리 및 메타데이터

export const stickerCategories = [
  { id: 'shapes', name: '도형', emoji: '⬡' },
  { id: 'symbols', name: '심볼', emoji: '⚡' },
  { id: 'accessories', name: '액세서리', emoji: '👓' },
  { id: 'text', name: '텍스트', emoji: '✦' },
];

// 색상 팔레트 (네온 형광색)
export const stickerColors = [
  { id: 'white', name: '화이트', hue: 0, hex: '#ffffff' },
  { id: 'cyan', name: '시안', hue: 180, hex: '#00f3ff' },
  { id: 'pink', name: '핑크', hue: 330, hex: '#ff69b4' },
  { id: 'yellow', name: '옐로', hue: 55, hex: '#ffee00' },
  { id: 'green', name: '그린', hue: 120, hex: '#39ff14' },
  { id: 'purple', name: '퍼플', hue: 275, hex: '#bf00ff' },
  { id: 'orange', name: '오렌지', hue: 25, hex: '#ff6600' },
  { id: 'black', name: '블랙', hue: 0, hex: '#111111' },
];

export const stickers = [
  // 도형
  { id: 'shape_circle', name: '원', category: 'shapes', file: 'shape_circle.png', defaultWidth: 180, baseHue: 0 },
  { id: 'shape_triangle', name: '삼각형', category: 'shapes', file: 'shape_triangle.png', defaultWidth: 180, baseHue: 0 },
  { id: 'shape_square', name: '사각형', category: 'shapes', file: 'shape_square.png', defaultWidth: 170, baseHue: 0 },
  { id: 'shape_star', name: '별', category: 'shapes', file: 'shape_star.png', defaultWidth: 180, baseHue: 0 },
  { id: 'shape_diamond', name: '다이아몬드', category: 'shapes', file: 'shape_diamond.png', defaultWidth: 160, baseHue: 0 },
  { id: 'shape_hexagon', name: '육각형', category: 'shapes', file: 'shape_hexagon.png', defaultWidth: 180, baseHue: 0 },
  { id: 'shape_heart', name: '하트', category: 'shapes', file: 'shape_heart.png', defaultWidth: 170, baseHue: 0 },
  { id: 'shape_cross', name: '십자', category: 'shapes', file: 'shape_cross.png', defaultWidth: 170, baseHue: 0 },

  // 심볼
  { id: 'symbol_lightning', name: '번개', category: 'symbols', file: 'symbol_lightning.png', defaultWidth: 140, baseHue: 0 },
  { id: 'symbol_crescent', name: '초승달', category: 'symbols', file: 'symbol_crescent.png', defaultWidth: 170, baseHue: 0 },
  { id: 'symbol_sparkle', name: '반짝이', category: 'symbols', file: 'symbol_sparkle.png', defaultWidth: 160, baseHue: 0 },
  { id: 'symbol_infinity', name: '무한대', category: 'symbols', file: 'symbol_infinity.png', defaultWidth: 200, baseHue: 0 },
  { id: 'symbol_crown', name: '왕관', category: 'symbols', file: 'symbol_crown.png', defaultWidth: 190, baseHue: 0 },
  { id: 'symbol_arrow', name: '화살표', category: 'symbols', file: 'symbol_arrow.png', defaultWidth: 200, baseHue: 0 },
  { id: 'symbol_music', name: '음표', category: 'symbols', file: 'symbol_music.png', defaultWidth: 160, baseHue: 0 },
  { id: 'symbol_wave', name: '물결', category: 'symbols', file: 'symbol_wave.png', defaultWidth: 200, baseHue: 0 },
  { id: 'symbol_speech', name: '말풍선', category: 'symbols', file: 'symbol_speech.png', defaultWidth: 190, baseHue: 0 },
  { id: 'symbol_camera', name: '카메라', category: 'symbols', file: 'symbol_camera.png', defaultWidth: 180, baseHue: 0 },
  { id: 'symbol_film', name: '필름', category: 'symbols', file: 'symbol_film.png', defaultWidth: 140, baseHue: 0 },
  { id: 'symbol_ribbon', name: '리본', category: 'symbols', file: 'symbol_ribbon.png', defaultWidth: 190, baseHue: 0 },
  { id: 'symbol_spiral', name: '소용돌이', category: 'symbols', file: 'symbol_spiral.png', defaultWidth: 170, baseHue: 0 },
  { id: 'symbol_cloud', name: '구름', category: 'symbols', file: 'symbol_cloud.png', defaultWidth: 190, baseHue: 0 },
  { id: 'symbol_flame', name: '불꽃', category: 'symbols', file: 'symbol_flame.png', defaultWidth: 160, baseHue: 0 },

  // 액세서리 (기존)
  { id: 'acc_round_glasses', name: '동그란안경', category: 'accessories', file: 'acc_round_glasses.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_aviator', name: '에비에이터', category: 'accessories', file: 'acc_aviator.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_cat_eye', name: '캣아이', category: 'accessories', file: 'acc_cat_eye.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_heart_glasses', name: '하트안경', category: 'accessories', file: 'acc_heart_glasses.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_star_glasses', name: '별안경', category: 'accessories', file: 'acc_star_glasses.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_pixel_glasses', name: '픽셀안경', category: 'accessories', file: 'acc_pixel_glasses.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_thuglife', name: '선글라스', category: 'accessories', file: 'acc_thuglife.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_party', name: '파티안경', category: 'accessories', file: 'acc_party.png', defaultWidth: 220, baseHue: 0 },
  // 액세서리 (신규)
  { id: 'acc_angel_wings', name: '천사날개', category: 'accessories', file: 'acc_angel_wings.png', defaultWidth: 250, baseHue: 0 },
  { id: 'acc_cat_ears', name: '고양이귀', category: 'accessories', file: 'acc_cat_ears.png', defaultWidth: 200, baseHue: 0 },
  { id: 'acc_bunny_ears', name: '토끼귀', category: 'accessories', file: 'acc_bunny_ears.png', defaultWidth: 200, baseHue: 0 },
  { id: 'acc_rabbit_ears', name: '래빗귀', category: 'accessories', file: 'acc_rabbit_ears.png', defaultWidth: 200, baseHue: 0 },
  { id: 'acc_fox_ears', name: '여우귀', category: 'accessories', file: 'acc_fox_ears.png', defaultWidth: 200, baseHue: 0 },
  { id: 'acc_dog_ears', name: '강아지귀', category: 'accessories', file: 'acc_dog_ears.png', defaultWidth: 200, baseHue: 0 },
  { id: 'acc_floppy_ears', name: '쫑긋귀', category: 'accessories', file: 'acc_floppy_ears.png', defaultWidth: 220, baseHue: 0 },
  { id: 'acc_cat_mouth', name: '고양이입', category: 'accessories', file: 'acc_cat_mouth.png', defaultWidth: 180, baseHue: 0 },

  // 텍스트 (코드로 생성 - generateWhiteText 사용)
  { id: 'text_love', name: 'LOVE', category: 'text', generatedText: 'LOVE', defaultWidth: 200, baseHue: 0 },
  { id: 'text_cute', name: 'CUTE', category: 'text', generatedText: 'CUTE', defaultWidth: 200, baseHue: 0 },
  { id: 'text_wow', name: 'WOW', category: 'text', generatedText: 'WOW', defaultWidth: 180, baseHue: 0 },
  { id: 'text_cool', name: 'COOL', category: 'text', generatedText: 'COOL', defaultWidth: 200, baseHue: 0 },
  { id: 'text_xoxo', name: 'XOXO', category: 'text', generatedText: 'XOXO', defaultWidth: 200, baseHue: 0 },
  { id: 'text_omg', name: 'OMG', category: 'text', generatedText: 'OMG', defaultWidth: 180, baseHue: 0 },
  { id: 'text_yay', name: 'YAY', category: 'text', generatedText: 'YAY', defaultWidth: 180, baseHue: 0 },
  { id: 'text_photo', name: '#PHOTO', category: 'text', generatedText: '#PHOTO', defaultWidth: 220, baseHue: 0 },
  { id: 'text_slay', name: 'SLAY', category: 'text', generatedText: 'SLAY', defaultWidth: 200, baseHue: 0 },
  { id: 'text_bestie', name: 'BESTIE', category: 'text', generatedText: 'BESTIE', defaultWidth: 220, baseHue: 0 },
  { id: 'text_bias', name: 'BIAS', category: 'text', generatedText: 'BIAS', defaultWidth: 200, baseHue: 0 },
  { id: 'text_stan', name: 'STAN', category: 'text', generatedText: 'STAN', defaultWidth: 200, baseHue: 0 },
  { id: 'text_selfie', name: '#SELFIE', category: 'text', generatedText: '#SELFIE', defaultWidth: 220, baseHue: 0 },
  { id: 'text_saranghae', name: '사랑해', category: 'text', generatedText: '사랑해', defaultWidth: 200, baseHue: 0 },
  { id: 'text_hwaiting', name: '화이팅', category: 'text', generatedText: '화이팅', defaultWidth: 200, baseHue: 0 },
  { id: 'text_daebak', name: '대박', category: 'text', generatedText: '대박', defaultWidth: 180, baseHue: 0 },
];
