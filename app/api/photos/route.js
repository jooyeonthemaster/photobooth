import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const photosDir = path.join(process.cwd(), 'public', 'photos');

    // 폴더가 없으면 빈 배열 반환
    try {
      await fs.access(photosDir);
    } catch {
      return NextResponse.json({ photos: [] });
    }

    const files = await fs.readdir(photosDir);
    const photos = [];

    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.JPG')) {
        const filePath = path.join(photosDir, file);
        const stats = await fs.stat(filePath);
        photos.push({
          name: file,
          time: stats.mtime.getTime()
        });
      }
    }

    // 최신순 정렬
    photos.sort((a, b) => b.time - a.time);

    return NextResponse.json({
      photos: photos.map(p => p.name)
    });
  } catch (error) {
    console.error('Error reading photos:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
