import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { success: false, message: '이미지가 필요합니다.' },
        { status: 400 }
      );
    }

    // Base64 이미지를 임시 파일로 저장
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const timestamp = Date.now();
    const tempFilename = `print_temp_${timestamp}.jpg`;
    const tempDir = path.join(process.cwd(), 'public', 'temp');

    // temp 폴더 생성
    try {
      await fs.access(tempDir);
    } catch {
      await fs.mkdir(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, tempFilename);
    await fs.writeFile(tempFilePath, base64Data, 'base64');

    // C# 프린터 프로그램 실행
    const printerExePath = path.join(process.cwd(), 'printer-service', 'DnpPrinter.exe');
    const command = `"${printerExePath}" "${tempFilePath}"`;

    console.log('Executing print command:', command);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000 // 30초 타임아웃
      });

      console.log('Print stdout:', stdout);
      if (stderr) {
        console.error('Print stderr:', stderr);
      }

      // 인쇄 성공 후 임시 파일 삭제
      setTimeout(async () => {
        try {
          await fs.unlink(tempFilePath);
          console.log('Temp file deleted:', tempFilename);
        } catch (err) {
          console.error('Failed to delete temp file:', err);
        }
      }, 5000); // 5초 후 삭제

      return NextResponse.json({
        success: true,
        message: 'DNP 프린터로 출력을 시작했습니다!',
        output: stdout
      });

    } catch (execError) {
      console.error('Print execution error:', execError);

      // 에러 발생 시에도 임시 파일 삭제
      try {
        await fs.unlink(tempFilePath);
      } catch {}

      return NextResponse.json(
        {
          success: false,
          message: '프린터 출력 실패: ' + execError.message,
          error: execError.stderr || execError.message
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Print API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류: ' + error.message },
      { status: 500 }
    );
  }
}

// 프린터 상태 확인 API
export async function GET() {
  try {
    const printerExePath = path.join(process.cwd(), 'printer-service', 'DnpPrinter.exe');

    // 프린터 실행파일 존재 확인
    try {
      await fs.access(printerExePath);
    } catch {
      return NextResponse.json({
        available: false,
        message: 'DNP 프린터 서비스를 찾을 수 없습니다.'
      });
    }

    return NextResponse.json({
      available: true,
      printer: 'DP-DS620',
      message: 'DNP 프린터가 준비되었습니다.'
    });

  } catch (error) {
    return NextResponse.json({
      available: false,
      message: '프린터 상태 확인 실패: ' + error.message
    });
  }
}
