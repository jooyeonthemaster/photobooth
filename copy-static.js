// Standalone 빌드 후 static 파일 복사 스크립트
const fs = require('fs');
const path = require('path');

console.log('📦 Copying static files to standalone build...');

// 복사할 경로 설정
const staticSource = path.join(__dirname, '.next', 'static');
const staticDest = path.join(__dirname, '.next', 'standalone', '.next', 'static');
const envSource = path.join(__dirname, '.env.local');
const envDest = path.join(__dirname, '.next', 'standalone', '.env.local');

// .next/static 복사
if (fs.existsSync(staticSource)) {
  console.log('📁 Copying .next/static...');

  // 대상 디렉토리가 없으면 생성
  const destDir = path.dirname(staticDest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // 재귀적 복사
  fs.cpSync(staticSource, staticDest, { recursive: true });
  console.log('✅ Static files copied successfully!');
} else {
  console.log('⚠️  .next/static not found - skipping');
}

// public/ 폴더 복사 (프레임 SVG 등)
const publicSource = path.join(__dirname, 'public');
const publicDest = path.join(__dirname, '.next', 'standalone', 'public');
if (fs.existsSync(publicSource)) {
  console.log('🖼️  Copying public/ ...');
  fs.cpSync(publicSource, publicDest, { recursive: true });
  console.log('✅ Public files copied successfully!');
} else {
  console.log('⚠️  public/ not found - skipping');
}

// printer-service/ 폴더 복사
const printerSource = path.join(__dirname, 'printer-service');
const printerDest = path.join(__dirname, '.next', 'standalone', 'printer-service');
if (fs.existsSync(printerSource)) {
  console.log('🖨️  Copying printer-service/ ...');
  fs.cpSync(printerSource, printerDest, { recursive: true });
  console.log('✅ Printer service copied successfully!');
} else {
  console.log('⚠️  printer-service/ not found - skipping');
}

// edsdk-dlls/ 폴더 복사 (Canon EDSDK DLLs)
const edsdkSource = path.join(__dirname, 'edsdk-dlls');
const edsdkDest = path.join(__dirname, '.next', 'standalone', 'edsdk-dlls');
if (fs.existsSync(edsdkSource)) {
  console.log('📷 Copying edsdk-dlls/ ...');
  fs.cpSync(edsdkSource, edsdkDest, { recursive: true });
  console.log('✅ EDSDK DLLs copied successfully!');
} else {
  console.log('⚠️  edsdk-dlls/ not found - EDSDK camera will not work');
}

// MediaPipe WASM + 모델 파일 복사
const mediapipeWasmSource = path.join(__dirname, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const mediapipeWasmDest = path.join(__dirname, '.next', 'standalone', 'public', 'mediapipe', 'wasm');
const mediapipeModelSource = path.join(__dirname, 'public', 'mediapipe', 'hand_landmarker.task');
const mediapipeModelDest = path.join(__dirname, '.next', 'standalone', 'public', 'mediapipe', 'hand_landmarker.task');

if (fs.existsSync(mediapipeWasmSource)) {
  console.log('🤖 Copying MediaPipe WASM files...');
  fs.mkdirSync(path.dirname(mediapipeWasmDest), { recursive: true });
  fs.cpSync(mediapipeWasmSource, mediapipeWasmDest, { recursive: true });
  console.log('✅ MediaPipe WASM copied!');
} else {
  console.log('⚠️  MediaPipe WASM not found - hand tracking will not work');
}

if (fs.existsSync(mediapipeModelSource)) {
  console.log('🤖 Copying MediaPipe hand model...');
  fs.mkdirSync(path.dirname(mediapipeModelDest), { recursive: true });
  fs.copyFileSync(mediapipeModelSource, mediapipeModelDest);
  console.log('✅ MediaPipe hand model copied!');
}

// MediaPipe vision bundle JS 복사
const visionBundleSource = path.join(__dirname, 'node_modules', '@mediapipe', 'tasks-vision', 'vision_bundle.mjs');
const visionBundleDest = path.join(__dirname, '.next', 'standalone', 'public', 'mediapipe', 'vision_bundle.mjs');
if (fs.existsSync(visionBundleSource)) {
  fs.copyFileSync(visionBundleSource, visionBundleDest);
  console.log('✅ MediaPipe vision bundle copied!');
}

// .env.local 복사
if (fs.existsSync(envSource)) {
  console.log('🔑 Copying .env.local...');
  fs.copyFileSync(envSource, envDest);
  console.log('✅ Environment variables copied successfully!');
} else {
  console.log('⚠️  .env.local not found - AI filters may not work!');
}

// 실행 배치 파일 생성
console.log('📝 Creating startup batch files...');

const batContent = `@echo off
REM ===============================================
REM Life4Cut Photobooth Start Script
REM ===============================================

echo.
echo ========================================
echo    Life4Cut Photobooth Starting...
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

echo [1/3] Starting server...
echo.

REM Run Next.js server with Node.js
node server.js

REM On server shutdown
echo.
echo ========================================
echo    Photobooth stopped.
echo ========================================
echo.
pause
`;

const simpleBatContent = `@echo off
cd /d "%~dp0"
node server.js
pause
`;

const batPath = path.join(__dirname, '.next', 'standalone', 'start-photobooth.bat');
const simpleBatPath = path.join(__dirname, '.next', 'standalone', 'start.bat');

fs.writeFileSync(batPath, batContent);
fs.writeFileSync(simpleBatPath, simpleBatContent);
console.log('✅ Batch files created!');

console.log('✅ Standalone build ready!');
console.log('📂 Location: .next/standalone/');
console.log('🚀 Run: start-photobooth.bat or start.bat');
