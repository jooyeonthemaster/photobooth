import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { photos, frame, filterType } = await request.json();

    if (!photos || photos.length !== 4) {
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
    const { createCanvas, loadImage } = await import('canvas');

    // 프레임 색상 설정
    const frameColors = {
      classic: '#ffffff',
      pink: '#FFB3D9',
      blue: '#B3D9FF',
      black: '#2a2a2a'
    };

    const bgColor = frameColors[frame] || '#ffffff';
    const isBlack = frame === 'black';

    // 캔버스 크기: 인생네컷 비율 (1:3.7 정도)
    const canvasWidth = 800;
    const canvasHeight = 1800;
    const padding = 60;
    const photoPadding = 20;
    const photoWidth = canvasWidth - (padding * 2);
    const photoHeight = (canvasHeight - (padding * 2) - (photoPadding * 3)) / 4;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 배경 그리기
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 4컷 사진 배치
    for (let i = 0; i < 4; i++) {
      try {
        // Base64 이미지 로드 (processedPhotos 사용)
        const base64Data = processedPhotos[i].replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const img = await loadImage(buffer);

        const y = padding + (photoHeight + photoPadding) * i;

        // 사진 그리기
        ctx.drawImage(img, padding, y, photoWidth, photoHeight);

        // 프레임 테두리 (얇은 선)
        if (isBlack) {
          ctx.strokeStyle = '#ffffff';
        } else {
          ctx.strokeStyle = '#f0f0f0';
        }
        ctx.lineWidth = 2;
        ctx.strokeRect(padding, y, photoWidth, photoHeight);
      } catch (err) {
        console.error(`Failed to load image ${i}:`, err);
      }
    }

    // 하단에 워터마크 추가
    ctx.fillStyle = isBlack ? '#ffffff' : '#666666';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Life Four Cuts', canvasWidth / 2, canvasHeight - 20);

    // 이미지 저장
    const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
    const filename = `lifefourcut_${Date.now()}.jpg`;

    const photosDir = path.join(process.cwd(), 'public', 'photos');

    // 폴더가 없으면 생성
    try {
      await fs.access(photosDir);
    } catch {
      await fs.mkdir(photosDir, { recursive: true });
    }

    const filepath = path.join(photosDir, filename);
    await fs.writeFile(filepath, buffer);

    console.log('✓ 4-cut photo combined:', filename);

    return NextResponse.json({
      success: true,
      message: '4컷 사진 생성 완료!',
      filename: filename,
      path: `/photos/${filename}`
    });
  } catch (error) {
    console.error('Combine error:', error);
    return NextResponse.json(
      { success: false, message: '합성 실패: ' + error.message },
      { status: 500 }
    );
  }
}
