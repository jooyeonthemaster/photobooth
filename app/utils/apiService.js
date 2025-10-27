// API 호출 서비스

/**
 * AI 필터를 이미지에 적용
 * @param {string} image - Base64 인코딩된 이미지
 * @param {string} filterType - 필터 타입 ID
 * @returns {Promise<{success: boolean, image?: string, message?: string}>}
 */
export const applyFilter = async (image, filterType) => {
  try {
    const response = await fetch('/api/apply-filter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: image,
        filterType: filterType
      })
    });

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
 * @returns {Promise<{success: boolean, path?: string, message?: string}>}
 */
export const combinePhotos = async (photos, frame, filterType = 'none') => {
  try {
    const response = await fetch('/api/combine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: photos,
        frame: frame,
        filterType: filterType
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

/**
 * 이미지를 프린터로 출력
 * @param {string} image - Base64 인코딩된 이미지
 * @returns {Promise<{success: boolean, output?: string, message?: string}>}
 */
export const printImage = async (image) => {
  try {
    console.log('🔄 /api/print 호출 중...');
    const response = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: image
      })
    });

    console.log('📥 응답 받음:', response.status);
    const data = await response.json();
    console.log('📄 응답 데이터:', data);

    return data;
  } catch (error) {
    console.error('❌ Print error:', error);
    return {
      success: false,
      message: '출력 중 오류 발생: ' + error.message
    };
  }
};

/**
 * 이미지 URL을 Base64로 변환
 * @param {string} imageUrl - 이미지 URL 또는 Base64 문자열
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const convertImageUrlToBase64 = async (imageUrl) => {
  try {
    // 🔥 이미 Base64 형식이면 그대로 반환
    if (imageUrl.startsWith('data:image/')) {
      console.log('✅ 이미 Base64 형식입니다 - 변환 생략');
      return imageUrl;
    }

    // URL인 경우에만 fetch하여 변환
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('이미지 변환 실패:', error);
    throw error;
  }
};


