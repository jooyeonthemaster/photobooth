// 이미지 캡처 및 처리 유틸리티

/**
 * 웹캠에서 이미지를 캡처하고 2:3 비율로 크롭하여 세로 이미지 생성
 * @param {Object} webcamRef - React ref 객체
 * @returns {Promise<string>} Base64 인코딩된 이미지
 */
export const captureAndCropImage = (webcamRef) => {
  return new Promise(async (resolve, reject) => {
    const isElectron = typeof window !== 'undefined' && window.electronAPI?.app?.isElectron;

    let imageSrc;

    if (isElectron) {
      // DSLR capture via Electron IPC (digiCamControl)
      console.log('📷 DSLR capture via digiCamControl');
      try {
        const result = await window.electronAPI.camera.capture();
        if (!result.success) {
          reject(new Error('DSLR capture failed: ' + (result.error || 'unknown')));
          return;
        }
        imageSrc = result.image;
      } catch (err) {
        reject(new Error('DSLR capture error: ' + err.message));
        return;
      }
    } else {
      // Webcam capture (browser fallback)
      console.log('🎬 Webcam capture');
      if (!webcamRef.current) {
        reject(new Error('Webcam not ready'));
        return;
      }
      imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        reject(new Error('Failed to get screenshot'));
        return;
      }
    }

    console.log('✅ Image obtained - processing...');

    const img = new Image();
    img.onload = () => {
      console.log(`📏 원본 이미지: ${img.width} x ${img.height}`);

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

      const outputWidth = 1200;
      const outputHeight = 1800;
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Webcam needs mirror flip, DSLR does not
      if (!isElectron) {
        ctx.scale(-1, 1);
        ctx.translate(-outputWidth, 0);
      }

      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
      const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
      console.log(`✅ 크롭 완료: ${outputWidth} x ${outputHeight}`);
      resolve(croppedImage);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
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


