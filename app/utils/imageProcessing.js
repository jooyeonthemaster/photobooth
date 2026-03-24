// 이미지 캡처 및 처리 유틸리티

/**
 * 이미지를 2:3 비율로 크롭하여 세로 이미지 생성 (공통 크롭 로직)
 * @param {HTMLImageElement} img - 로드된 이미지
 * @returns {string} Base64 인코딩된 PNG
 */
function cropToPortrait(img) {
  const targetRatio = 3 / 2;
  const originalRatio = img.height / img.width;
  let cropWidth, cropHeight, cropX, cropY;

  if (originalRatio > targetRatio) {
    cropWidth = img.width;
    cropHeight = img.width * targetRatio;
    cropX = 0;
    cropY = (img.height - cropHeight) / 2;
  } else {
    cropHeight = img.height;
    cropWidth = img.height / targetRatio;
    cropX = (img.width - cropWidth) / 2;
    cropY = 0;
  }

  // 가장자리 5% 추가 트림 (인접 피사체 bleed 방지)
  const trimRatio = 0.03;
  const trimX = cropWidth * trimRatio;
  const trimY = cropHeight * trimRatio;
  cropX += trimX;
  cropY += trimY;
  cropWidth -= trimX * 2;
  cropHeight -= trimY * 2;

  const outputWidth = 1600;
  const outputHeight = 2400;
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * 웹캠에서 이미지를 캡처하고 2:3 비율로 크롭하여 세로 이미지 생성
 * @param {Object} webcamRef - React ref 객체
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const captureAndCropImage = (webcamRef) => {
  return new Promise(async (resolve, reject) => {
    let imageSrc;

    console.log('📷 Webcam capture');
    if (!webcamRef.current) {
      reject(new Error('Webcam not ready'));
      return;
    }
    imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      reject(new Error('Failed to get screenshot'));
      return;
    }

    console.log('✅ Image obtained - processing...');

    const img = new Image();
    img.onload = () => {
      console.log(`📏 원본 이미지: ${img.width} x ${img.height}`);
      const croppedImage = cropToPortrait(img);
      console.log(`✅ 크롭 완료: 1600 x 2400`);
      resolve(croppedImage);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
};

/**
 * data URI 이미지를 2:3 비율로 크롭 (EDSDK 캡처 이미지용)
 * @param {string} dataUri - Base64 data URI
 * @returns {Promise<string>} Base64 인코딩된 PNG (1600x2400)
 */
export const cropImageToPortrait = (dataUri) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      console.log(`📏 EDSDK 원본: ${img.width} x ${img.height}`);
      const croppedImage = cropToPortrait(img);
      console.log(`✅ 크롭 완료: 1600 x 2400`);
      resolve(croppedImage);
    };
    img.onerror = () => reject(new Error('Failed to load captured image'));
    img.src = dataUri;
  });
};

/**
 * AI 합성 전 이미지 소프트닝 (DSLR 고해상도 디테일 완화)
 * 원본 위에 블러 레이어를 반투명으로 블렌딩하여 피부 디테일만 줄임
 * @param {string} dataUri - Base64 data URI
 * @returns {Promise<string>} 소프트닝된 Base64 이미지
 */
export const softenForAI = (dataUri) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 1단계: 작은 해상도로 다운스케일 (피부 디테일 자연 감소)
      const smallW = Math.round(img.width * 0.5);
      const smallH = Math.round(img.height * 0.5);
      const small = document.createElement('canvas');
      small.width = smallW;
      small.height = smallH;
      const sCtx = small.getContext('2d');
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(img, 0, 0, smallW, smallH);

      // 2단계: 원래 해상도로 업스케일
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(small, 0, 0, img.width, img.height);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to soften image'));
    img.src = dataUri;
  });
};
