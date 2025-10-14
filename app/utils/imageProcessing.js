// 이미지 캡처 및 처리 유틸리티

/**
 * 웹캠에서 이미지를 캡처하고 2:3 비율로 크롭하여 세로 이미지 생성
 * @param {Object} webcamRef - React ref 객체
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const captureAndCropImage = (webcamRef) => {
  return new Promise((resolve, reject) => {
    console.log('🎬 Capturing image');

    if (!webcamRef.current) {
      console.error('❌ Webcam not ready');
      reject(new Error('Webcam not ready'));
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      console.error('❌ Failed to get screenshot');
      reject(new Error('Failed to get screenshot'));
      return;
    }

    console.log('✅ Screenshot obtained - processing...');

    const img = new Image();
    img.onload = () => {
      console.log(`📏 원본 이미지: ${img.width} x ${img.height}`);

      // 목표 비율: 2:3 (세로)
      const targetRatio = 3 / 2; // height / width

      // 원본 이미지 비율
      const originalRatio = img.height / img.width;

      let cropWidth, cropHeight, cropX, cropY;

      if (originalRatio > targetRatio) {
        // 이미지가 너무 높음 → 상하 크롭
        cropWidth = img.width;
        cropHeight = img.width * targetRatio;
        cropX = 0;
        cropY = (img.height - cropHeight) / 2;
      } else {
        // 이미지가 너무 넓음 → 좌우 크롭
        cropHeight = img.height;
        cropWidth = img.height / targetRatio;
        cropX = (img.width - cropWidth) / 2;
        cropY = 0;
      }

      console.log(`✂️ 크롭 영역: x=${Math.round(cropX)}, y=${Math.round(cropY)}, w=${Math.round(cropWidth)}, h=${Math.round(cropHeight)}`);

      // 최종 출력 크기 (고해상도 유지)
      const outputWidth = 1200;
      const outputHeight = 1800;

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');

      // 고품질 렌더링
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 좌우 반전 (거울 효과)
      ctx.scale(-1, 1);
      ctx.translate(-outputWidth, 0);

      // 크롭된 영역을 캔버스에 그리기
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,  // 소스 영역
        0, 0, outputWidth, outputHeight       // 대상 영역
      );

      const croppedImage = canvas.toDataURL('image/jpeg', 0.95);

      console.log(`✅ 크롭 완료: ${outputWidth} x ${outputHeight} (2:3 세로 비율)`);

      resolve(croppedImage);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSrc;
  });
};

/**
 * 프린터 미리보기 이미지 생성 (4:6 비율)
 * @param {string} imageUrl - 이미지 URL 또는 Base64
 * @returns {Promise<string>} Base64 인코딩된 미리보기 이미지
 */
export const generatePrintPreview = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      console.log('🖨️ 프린터 미리보기 생성');
      console.log('이미지 크기:', img.width, 'x', img.height);

      // 미리보기용 Canvas 생성 (4:6 세로 비율)
      const previewCanvas = document.createElement('canvas');
      const previewWidth = 400;  // 미리보기 크기
      const previewHeight = 600; // 4:6 비율
      previewCanvas.width = previewWidth;
      previewCanvas.height = previewHeight;

      const ctx = previewCanvas.getContext('2d');

      // 배경을 흰색으로
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, previewWidth, previewHeight);

      // 이미지를 전체에 그대로 그리기
      ctx.drawImage(img, 0, 0, previewWidth, previewHeight);

      // 미리보기 이미지 저장
      const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.95);
      
      console.log('✅ 프린터 미리보기 생성 완료');
      resolve(previewDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preview'));
    };

    img.src = imageUrl;
  });
};


