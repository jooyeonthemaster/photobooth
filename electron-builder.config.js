module.exports = {
  appId: 'com.neanderlab.photobooth',
  productName: 'NEANDER LAB Photobooth',
  npmRebuild: false, // canvas는 Next.js 서버(Node.js)에서만 사용, Electron 리빌드 불필요
  directories: { output: 'dist' },
  files: [
    'electron/**/*',
    'public/**/*',
  ],
  win: {
    target: 'dir',
    signDlls: false,
    sign: null, // 코드 사이닝 비활성화 (키오스크 앱이므로 불필요)
  },
  forceCodeSigning: false,
  extraResources: [
    { from: '.next/standalone', to: 'standalone' },
    { from: '.next/static', to: 'standalone/.next/static' },
    { from: 'public', to: 'standalone/public' },
    { from: '.env.local', to: 'standalone/.env.local' },
    { from: 'printer-service', to: 'printer-service' },
    { from: 'edsdk-dlls', to: 'edsdk-dlls' },
  ],
};
