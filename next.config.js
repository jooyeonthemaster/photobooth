/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone 모드: 독립 실행 가능한 빌드 생성
  // - .next/standalone 폴더에 모든 의존성 포함
  // - Node.js만 있으면 실행 가능 (npm install 불필요)
  // - 포토부스 PC 배포에 최적화
  output: 'standalone',
};

module.exports = nextConfig;
