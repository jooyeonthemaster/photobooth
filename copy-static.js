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
