// 각 필터별 안내 멘트
export const filterMessages = {
  'kpop-idol': {
    title: '✨ K-POP 아이돌 필터',
    message: 'K-POP 아이돌로 데뷔한 당신은 이런 모습입니다!\n글래스 스킨에 완벽한 메이크업, 준비되셨나요?'
  },
  'anime-character': {
    title: '🎌 애니메이션 필터',
    message: '애니메이션 세계로 빠져든 당신!\n반짝이는 눈망울과 셀 쉐이딩 효과를 경험하세요.'
  },
  'zombie-apocalypse': {
    title: '🧟 좀비 아포칼립스 필터',
    message: '좀비에게 물려서 감염된 당신은 이런 모습입니다...\n좀비 메이크업으로 공포 영화 주인공이 되어보세요!'
  },
  'cyberpunk-neon': {
    title: '🌃 사이버펑크 네온 필터',
    message: '2077년 미래 도시에 사는 당신의 모습!\n네온 타투와 홀로그램 메이크업으로 변신합니다.'
  },
  'renaissance-painting': {
    title: '🖼️ 르네상스 명화 필터',
    message: '16세기 유럽 귀족으로 환생한 당신!\n유화 텍스처로 고전 명화 속 주인공이 됩니다.'
  },
  'pixar-character': {
    title: '🎬 픽사 3D 캐릭터 필터',
    message: '픽사 애니메이션에 출연하게 된 당신!\n따뜻한 3D 렌더링으로 사랑스러운 캐릭터가 됩니다.'
  },
  'old-grandparent': {
    title: '👴 80년 후 나의 모습',
    message: '타임머신을 타고 80년 후로 간 당신!\n나이 들어도 여전히 멋진 모습일 거예요.'
  },
  'baby-filter': {
    title: '👶 아기 버전 필터',
    message: '시간을 되돌려 아기로 돌아간 당신!\n통통한 볼과 귀여운 모습을 만나보세요.'
  },
  'glamour-magazine': {
    title: '💄 보그 매거진 커버 필터',
    message: '보그 표지 모델이 된 당신!\n하이패션 에디토리얼 메이크업으로 화려하게 변신합니다.'
  },
  'disney-villain': {
    title: '😈 디즈니 악당 필터',
    message: '디즈니 악당 역할에 캐스팅된 당신!\n말레피센트 같은 카리스마 넘치는 빌런으로 변신합니다.'
  },
  'superhero': {
    title: '🦸 마블 슈퍼히어로 필터',
    message: '마블 유니버스에 합류한 슈퍼히어로 당신!\n영웅의 페이스 페인팅과 극적인 조명을 경험하세요.'
  },
  'alien-invasion': {
    title: '👽 외계인 필터',
    message: '외계에서 온 당신을 환영합니다!\n바이오루미네센트 패턴으로 신비로운 외계인이 됩니다.'
  },
  'instagram-filter': {
    title: '📸 인스타 인플루언서 필터',
    message: '100만 팔로워 인플루언서가 된 당신!\n완벽한 피부와 글로우 효과를 선사합니다.'
  },
  'clown-circus': {
    title: '🤡 서커스 광대 필터',
    message: '서커스 스타가 된 당신!\n화려한 광대 메이크업으로 관객들을 웃게 만들어보세요.'
  },
  'vampire-gothic': {
    title: '🧛 뱀파이어 고딕 필터',
    message: '트와일라잇에 캐스팅된 뱀파이어 당신!\n창백한 피부와 피 빛 입술로 고딕 미학을 완성합니다.'
  },
  'pop-art': {
    title: '🎨 팝아트 필터',
    message: '앤디 워홀 작품 속 주인공이 된 당신!\n하프톤 도트와 비비드한 컬러로 예술 작품이 됩니다.'
  },
  'crystal-gem': {
    title: '💎 크리스탈 보석인간 필터',
    message: '보석으로 변한 당신!\n무지개 빛 크리스탈 텍스처로 반짝반짝 빛납니다.'
  },
  'oil-painting': {
    title: '🖌️ 유화 아트 필터',
    message: '인상파 화가의 캔버스에 그려진 당신!\n고흐나 모네 스타일의 붓터치로 예술 작품이 됩니다.'
  },
  'drag-queen': {
    title: '👑 드랙퀸 글램 필터',
    message: '루폴의 드랙 레이스에 출연한 당신!\n극적인 메이크업과 컨투어링으로 화려하게 변신합니다.'
  },
  'mermaid-fantasy': {
    title: '🧜‍♀️ 인어공주 필터',
    message: '바닷속 왕국의 인어가 된 당신!\n비늘 메이크업과 펄 빛 효과로 신비로운 인어 왕족이 됩니다.'
  },
  'none': {
    title: '📷 필터 없음',
    message: '있는 그대로의 당신!\n자연스러운 모습이 가장 아름답습니다.'
  }
};

// 필터 설정에 따른 메시지 조합 생성
export const getFilterIntroMessages = (slotAssignment) => {
  if (!slotAssignment || slotAssignment.length !== 4) {
    return null;
  }

  // 사용된 필터 목록 추출 (중복 제거)
  const uniqueFilters = [...new Set(slotAssignment)];

  // 각 필터별 몇 장씩 사용되는지 계산
  const filterCounts = {};
  slotAssignment.forEach(filterId => {
    filterCounts[filterId] = (filterCounts[filterId] || 0) + 1;
  });

  // 메시지 조합 생성
  const messages = uniqueFilters.map(filterId => {
    const filter = filterMessages[filterId];
    const count = filterCounts[filterId];
    return {
      filterId,
      title: filter.title,
      message: filter.message,
      count: count
    };
  });

  return messages;
};
