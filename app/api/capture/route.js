import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지 데이터가 없습니다.' },
        { status: 400 }
      );
    }

    // Base64 데이터에서 헤더 제거
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
    const filename = `photo_${Date.now()}.jpg`;

    // public/photos 폴더에 저장
    const photosDir = path.join(process.cwd(), 'public', 'photos');

    // 폴더가 없으면 생성
    try {
      await fs.access(photosDir);
    } catch {
      await fs.mkdir(photosDir, { recursive: true });
    }

    const filepath = path.join(photosDir, filename);
    await fs.writeFile(filepath, base64Data, 'base64');

    console.log('✓ Photo saved:', filename);

    return NextResponse.json({
      success: true,
      message: '사진 촬영 완료!',
      filename: filename,
      path: `/photos/${filename}`
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { success: false, message: '저장 실패: ' + error.message },
      { status: 500 }
    );
  }
}
