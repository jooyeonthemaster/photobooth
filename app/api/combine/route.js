import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function findFrameSvg(variant = 'black') {
  const frameName = variant === 'white'
    ? 'NEANDER LAB AI PHOTOBOOTH WHITE.svg'
    : 'NEANDER LAB AI PHOTOBOOTH.svg';
  const candidates = [
    path.join(process.cwd(), 'public', 'frame', frameName),
    path.join(process.cwd(), '..', 'public', 'frame', frameName),
    path.join(process.cwd(), 'resources', 'public', 'frame', frameName),
  ];
  for (const p of candidates) {
    try {
      if (require('fs').existsSync(p)) {
        console.log('[Combine] Found frame SVG at:', p);
        return p;
      }
    } catch { }
  }
  console.warn('[Combine] Frame SVG not found, using default:', candidates[0]);
  return candidates[0];
}

export async function POST(request) {
  try {
    console.log('🔵 /api/combine - Request received');
    const { photos, frame, filterType, customText = '', frameVariant = 'black' } = await request.json();
    console.log('🔵 Photos count:', photos?.length, 'Frame:', frame, 'Filter:', filterType, 'CustomText:', customText, 'FrameVariant:', frameVariant);

    if (!photos || photos.length !== 4) {
      console.log('❌ Invalid photos count:', photos?.length);
      return NextResponse.json(
        { success: false, message: '4장의 사진이 필요합니다.' },
        { status: 400 }
      );
    }

    let processedPhotos = photos;

    // 필터 적용 (선택사항)
    if (filterType && filterType !== 'none') {
      console.log(`Applying ${filterType} filter to 4 photos...`);
      processedPhotos = [];

      for (let i = 0; i < photos.length; i++) {
        try {
          console.log(`Processing photo ${i + 1}/4 with ${filterType}...`);
          const filterResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/apply-filter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: photos[i],
              filterType: filterType
            })
          });

          const filterData = await filterResponse.json();

          if (filterData.success) {
            processedPhotos.push(filterData.image);
            console.log(`✓ Photo ${i + 1}/4 filtered`);
          } else {
            // 필터 실패시 원본 사용
            processedPhotos.push(photos[i]);
            console.log(`✗ Photo ${i + 1}/4 filter failed, using original`);
          }
        } catch (err) {
          // 에러시 원본 사용
          processedPhotos.push(photos[i]);
          console.error(`Error filtering photo ${i + 1}:`, err);
        }
      }
      console.log(`${filterType} filter application completed`);
    }

    // Canvas를 사용하여 이미지 합성
    console.log('🔵 Importing canvas package...');
    const { createCanvas, loadImage } = await import('canvas');
    console.log('✅ Canvas package imported successfully');

    // SVG 프레임 로드
    const framePath = findFrameSvg(frameVariant);
    console.log('🔵 Loading frame from:', framePath);
    const frameSvgData = await fs.readFile(framePath, 'utf-8');
    console.log('✅ Frame loaded, length:', frameSvgData.length);

    // 캔버스 크기: 4x6 inch 인화 기준 600DPI (2400x3600)
    const canvasWidth = 2400;
    const canvasHeight = 3600;

    console.log('🔵 Creating canvas:', canvasWidth, 'x', canvasHeight);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    console.log('✅ Canvas created successfully');

    // SVG 텍스트 치환 (Dynamic Text Injection)
    const now = new Date();
    const formattedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    let modifiedSvgData = frameSvgData;
    if (customText && customText.trim() !== '') {
      modifiedSvgData = modifiedSvgData.replace('{{CUSTOM_TEXT}}', customText);
    } else {
      // 값이 없으면 앞의 변수와 구분자 '// '까지 통째로 삭제하여 날짜만 남깁니다.
      modifiedSvgData = modifiedSvgData.replace('{{CUSTOM_TEXT}} // ', '');
    }
    modifiedSvgData = modifiedSvgData.replace('{{CURRENT_DATE}}', formattedDate);

    // SVG를 이미지로 변환하여 배경으로 그리기
    try {
      const svgBuffer = Buffer.from(modifiedSvgData);
      const frameImg = await loadImage(svgBuffer);
      ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    } catch (err) {
      console.log('SVG 배경 로드 실패, 흰색 배경 사용:', err);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 4개 이미지 영역 좌표 (새로운 SVG 템플릿 기준: 2400x3600 해상도)
    // 1번 사진: x=150, y=200, w=1000, h=1350
    // 2번 사진: x=1250, y=200, w=1000, h=1350
    // 3번 사진: x=150, y=1650, w=1000, h=1350
    // 4번 사진: x=1250, y=1650, w=1000, h=1350
    const photoAreas = [
      { x: 150, y: 200, width: 1000, height: 1350 },  // 1번 (좌상단)
      { x: 1250, y: 200, width: 1000, height: 1350 }, // 2번 (우상단)
      { x: 150, y: 1650, width: 1000, height: 1350 }, // 3번 (좌하단)
      { x: 1250, y: 1650, width: 1000, height: 1350 } // 4번 (우하단)
    ];

    // 4컷 사진 배치 (cover 방식: 비율 유지하며 영역 채우기)
    for (let i = 0; i < 4; i++) {
      try {
        const base64Data = processedPhotos[i].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const img = await loadImage(buffer);

        const area = photoAreas[i];

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // cover 방식: 원본 비율 유지, 영역에 맞게 크롭하여 채우기
        const imgRatio = img.width / img.height;
        const areaRatio = area.width / area.height;
        let sx, sy, sw, sh;

        if (imgRatio < areaRatio) {
          // 이미지가 더 세로로 김 → 상하 크롭
          sw = img.width;
          sh = img.width / areaRatio;
          sx = 0;
          sy = (img.height - sh) / 2;
        } else {
          // 이미지가 더 가로로 김 → 좌우 크롭
          sh = img.height;
          sw = img.height * areaRatio;
          sx = (img.width - sw) / 2;
          sy = 0;
        }

        ctx.drawImage(img, sx, sy, sw, sh, area.x, area.y, area.width, area.height);

        console.log(`✓ Photo ${i + 1} placed at [${Math.round(area.x)}, ${Math.round(area.y)}] (cover crop: ${Math.round(sx)},${Math.round(sy)} ${Math.round(sw)}x${Math.round(sh)})`);
      } catch (err) {
        console.error(`Failed to load image ${i}:`, err);
      }
    }

    // 이미지 저장
    console.log('🔵 Converting canvas to buffer...');
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.98 });
    console.log('✅ Buffer created, size:', buffer.length, 'bytes');

    const filename = `lifefourcut_${Date.now()}.jpg`;

    // 🔥 서버리스 환경 대응: /tmp 또는 public/photos 사용
    // Vercel에서는 VERCEL_ENV가 항상 설정됨
    const isServerless = process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL;
    const photosDir = isServerless
      ? '/tmp'
      : path.join(process.cwd(), 'public', 'photos');
    console.log('🔵 Photos directory:', photosDir, '(serverless:', isServerless, 'VERCEL_ENV:', process.env.VERCEL_ENV, ')');

    // 폴더가 없으면 생성 (서버리스가 아닐 때만)
    if (!isServerless) {
      try {
        await fs.access(photosDir);
        console.log('✅ Photos directory exists');
      } catch {
        console.log('📁 Creating photos directory...');
        await fs.mkdir(photosDir, { recursive: true });
        console.log('✅ Photos directory created');
      }
    }

    const filepath = path.join(photosDir, filename);
    console.log('🔵 Writing file to:', filepath);
    await fs.writeFile(filepath, buffer);

    console.log('✅ 4-cut photo combined:', filename);

    // 🔥 Standalone 빌드도 public 폴더 static 서빙 안 되므로 항상 Base64 반환
    console.log('🔵 Converting to Base64 for response...');
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    const responsePath = base64;
    console.log('✅ Base64 response prepared');

    return NextResponse.json({
      success: true,
      message: '4컷 사진 생성 완료!',
      filename: filename,
      path: responsePath
    });
  } catch (error) {
    console.error('❌ Combine error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    return NextResponse.json(
      {
        success: false,
        message: '합성 실패: ' + error.message,
        error: error.toString(),
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
