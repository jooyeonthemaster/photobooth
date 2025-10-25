import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    console.log('🔵 /api/combine - Request received');
    const { photos, frame, filterType } = await request.json();
    console.log('🔵 Photos count:', photos?.length, 'Frame:', frame, 'Filter:', filterType);

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
    const framePath = path.join(process.cwd(), 'public', 'frame', 'NEANDER LAB AI PHOTOBOOTH.svg');
    console.log('🔵 Loading frame from:', framePath);
    const frameSvgData = await fs.readFile(framePath, 'utf-8');
    console.log('✅ Frame loaded, length:', frameSvgData.length);

    // 캔버스 크기: SVG viewBox 기준 (900 x 1350)
    const canvasWidth = 1200;
    const canvasHeight = 1800;

    console.log('🔵 Creating canvas:', canvasWidth, 'x', canvasHeight);
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    console.log('✅ Canvas created successfully');

    // SVG를 이미지로 변환하여 배경으로 그리기
    try {
      const svgBuffer = Buffer.from(frameSvgData);
      const frameImg = await loadImage(svgBuffer);
      ctx.drawImage(frameImg, 0, 0, canvasWidth, canvasHeight);
    } catch (err) {
      console.log('SVG 배경 로드 실패, 흰색 배경 사용:', err);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 4개 이미지 영역 좌표 (SVG clipPath 기준 -> 1200x1800 스케일)
    const scale = 1200 / 900; // viewBox 900을 1200으로 스케일
    const photoAreas = [
      { x: 80.89 * scale, y: 68.90 * scale, width: (439.13 - 80.89) * scale, height: (589.84 - 68.90) * scale },  // 1번
      { x: 80.89 * scale, y: 615.66 * scale, width: (439.13 - 80.89) * scale, height: (1136.60 - 615.66) * scale }, // 2번
      { x: 464.98 * scale, y: 70.09 * scale, width: (823.22 - 464.98) * scale, height: (588.69 - 70.09) * scale },   // 3번
      { x: 464.98 * scale, y: 615.66 * scale, width: (823.22 - 464.98) * scale, height: (1134.26 - 615.66) * scale }  // 4번
    ];

    // 4컷 사진 배치
    for (let i = 0; i < 4; i++) {
      try {
        // Base64 이미지 로드 (processedPhotos 사용)
        const base64Data = processedPhotos[i].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const img = await loadImage(buffer);

        const area = photoAreas[i];

        // 고품질 렌더링
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 사진 그리기 (영역에 맞게 그리기)
        ctx.drawImage(img, area.x, area.y, area.width, area.height);

        console.log(`✓ Photo ${i + 1} placed at [${Math.round(area.x)}, ${Math.round(area.y)}]`);
      } catch (err) {
        console.error(`Failed to load image ${i}:`, err);
      }
    }

    // 이미지 저장
    console.log('🔵 Converting canvas to buffer...');
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
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

    // 🔥 서버리스 환경에서는 Base64로 반환, 로컬은 파일 경로
    let responsePath;
    if (isServerless) {
      console.log('🔵 Converting to Base64 for serverless response...');
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      responsePath = base64;
      console.log('✅ Base64 response prepared');
    } else {
      responsePath = `/photos/${filename}`;
    }

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
