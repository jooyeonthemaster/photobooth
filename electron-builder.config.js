module.exports = {
  appId: 'com.neanderlab.photobooth',
  productName: 'NEANDER LAB Photobooth',
  directories: { output: 'dist' },
  files: [
    'electron/**/*',
    '.next/standalone/**/*',
    '.next/static/**/*',
    'public/**/*',
    'printer-service/**/*',
  ],
  win: {
    target: 'dir',
    icon: 'public/icon.ico',
  },
  extraResources: [
    { from: 'printer-service', to: 'printer-service' },
    { from: 'camera', to: 'camera', filter: ['**/*'] },
  ],
};
