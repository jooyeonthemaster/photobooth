// API 호출 서비스

// ========== 그리드 모드 헬퍼 함수 ==========

const loadImageFromBase64 = (base64) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = base64;
  });
};

/**
 * 4장의 사진을 2x2 그리드 이미지로 합성
 * 배치: [0]=좌상(Slot1), [2]=우상(Slot3), [1]=좌하(Slot2), [3]=우하(Slot4)
 */
export const createPhotoGrid = async (photos, cellWidth = 1200, cellHeight = 1800) => {
  const gridWidth = cellWidth * 2;
  const gridHeight = cellHeight * 2;

  const canvas = document.createElement('canvas');
  canvas.width = gridWidth;
  canvas.height = gridHeight;
  const ctx = canvas.getContext('2d');

  const positions = [
    { idx: 0, x: 0, y: 0 },
    { idx: 2, x: cellWidth, y: 0 },
    { idx: 1, x: 0, y: cellHeight },
    { idx: 3, x: cellWidth, y: cellHeight },
  ];

  for (const pos of positions) {
    const img = await loadImageFromBase64(photos[pos.idx]);
    ctx.drawImage(img, pos.x, pos.y, cellWidth, cellHeight);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
};

/**
 * 2x2 그리드 이미지를 4개 개별 이미지로 분할
 * 반환 순서: [0]=좌상, [1]=좌하, [2]=우상, [3]=우하
 */
export const splitPhotoGrid = async (gridImage) => {
  const img = await loadImageFromBase64(gridImage);
  const cellWidth = Math.floor(img.width / 2);
  const cellHeight = Math.floor(img.height / 2);

  // 각 셀 경계에서 3% 트림 (인접 컷 잔여물 제거)
  const trimX = Math.floor(cellWidth * 0.03);
  const trimY = Math.floor(cellHeight * 0.03);
  const trimmedW = cellWidth - trimX * 2;
  const trimmedH = cellHeight - trimY * 2;

  const extractions = [
    { x: 0, y: 0 },
    { x: 0, y: cellHeight },
    { x: cellWidth, y: 0 },
    { x: cellWidth, y: cellHeight },
  ];

  const results = [];
  for (const ext of extractions) {
    const canvas = document.createElement('canvas');
    canvas.width = trimmedW;
    canvas.height = trimmedH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, ext.x + trimX, ext.y + trimY, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);
    results.push(canvas.toDataURL('image/png'));
  }
  return results;
};

/**
 * 그리드 이미지에 AI 필터 적용 (mode: 'grid')
 * PIN 모드: referenceImageUrl, customerData 전달 시 참조 이미지 합성도 지원
 */
export const applyFilterGrid = async (gridImage, filterType, referenceImageUrl = null, customerData = null) => {
  try {
    const body = {
      image: gridImage,
      filterType: filterType,
      mode: 'grid'
    };
    if (referenceImageUrl) body.referenceImageUrl = referenceImageUrl;
    if (customerData) body.customerData = customerData;

    const response = await fetch('/api/apply-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Grid filter API error (${response.status}):`, errorText);
      return { success: false, message: `Grid filter error (${response.status})` };
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Grid filter error:', error);
    return { success: false, message: error.message };
  }
};

// ========== 기존 유틸리티 ==========

/**
 * 이미지를 압축하여 Base64 크기 줄이기
 * @param {string} base64Image - Base64 인코딩된 이미지
 * @param {number} maxWidth - 최대 너비 (기본값: 1200px)
 * @param {number} quality - JPEG 품질 (0.0 ~ 1.0, 기본값: 0.7)
 * @returns {Promise<string>} 압축된 Base64 이미지
 */
export const compressImage = async (base64Image, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 원본 크기
      let width = img.width;
      let height = img.height;

      // 최대 너비 초과 시 리사이즈
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Canvas에 그려서 압축
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // JPEG로 압축하여 Base64 반환
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = reject;
    img.src = base64Image;
  });
};

/**
 * AI 필터를 이미지에 적용
 * @param {string} image - Base64 인코딩된 이미지
 * @param {string} filterType - 필터 타입 ID
 * @param {string} [referenceImageUrl] - AC'SCENT 참조 이미지 URL (선택)
 * @param {object} [customerData] - 고객 향수 프로필 데이터 (선택)
 * @returns {Promise<{success: boolean, image?: string, message?: string}>}
 */
export const applyFilter = async (image, filterType, referenceImageUrl = null, customerData = null) => {
  try {
    const body = {
      image: image,
      filterType: filterType
    };

    // AC'SCENT 참조 이미지가 있으면 포함
    if (referenceImageUrl) {
      body.referenceImageUrl = referenceImageUrl;
    }
    if (customerData) {
      body.customerData = customerData;
    }

    const response = await fetch('/api/apply-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // 504 등 서버 에러 시 JSON 파싱 전에 체크
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Filter API error (${response.status}):`, errorText);
      return {
        success: false,
        message: `서버 오류 (${response.status}): 필터 처리 시간 초과 또는 API 오류`
      };
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Filter error:', error);
    return {
      success: false,
      message: '필터 적용 중 오류 발생: ' + error.message
    };
  }
};

/**
 * 여러 사진을 프레임에 합성
 * @param {string[]} photos - Base64 인코딩된 이미지 배열 (4개)
 * @param {string} frame - 프레임 ID
 * @param {string} filterType - 필터 타입 (기본값: 'none')
 * @param {string} customText - 프레임에 새길 커스텀 텍스트 (예: 최애 이름)
 * @returns {Promise<{success: boolean, path?: string, message?: string}>}
 */
export const combinePhotos = async (photos, frame, filterType = 'none', customText = '', frameVariant = 'black') => {
  try {
    const response = await fetch('/api/combine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: photos,
        frame: frame,
        filterType: filterType,
        customText: customText,
        frameVariant: frameVariant
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Combine error:', error);
    return {
      success: false,
      message: '합성 중 오류 발생: ' + error.message
    };
  }
};


