const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// digiCamControl 경로
const CAMERA_GUI = '"C:\\Program Files (x86)\\digiCamControl\\CameraControl.exe"';
const CAMERA_CMD = '"C:\\Program Files (x86)\\digiCamControl\\CameraControlCmd.exe"';

// 사진 저장 폴더
const PHOTOS_DIR = path.join(__dirname, 'photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR);
}

// digiCamControl GUI를 백그라운드로 실행
let guiProcess = null;
function ensureGUIRunning() {
  return new Promise((resolve, reject) => {
    exec('tasklist', (err, stdout) => {
      if (stdout.includes('CameraControl.exe')) {
        console.log('✓ digiCamControl GUI already running');
        resolve(true);
      } else {
        console.log('Starting digiCamControl GUI...');
        const gui = spawn(CAMERA_GUI.replace(/"/g, ''), [], {
          detached: true,
          stdio: 'ignore'
        });
        gui.unref();

        // GUI 시작 대기
        setTimeout(() => {
          console.log('✓ digiCamControl GUI started');
          resolve(true);
        }, 3000);
      }
    });
  });
}

// 서버 시작 시 GUI 실행
ensureGUIRunning();

app.use(express.static('public'));
app.use('/photos', express.static(PHOTOS_DIR));

// favicon 404 에러 방지
app.get('/favicon.ico', (req, res) => res.status(204).end());

// 카메라 촬영
app.post('/capture', async (req, res) => {
  try {
    // GUI 실행 확인
    await ensureGUIRunning();

    const filename = `photo_${Date.now()}.jpg`;

    // 폴더 설정
    const setupCmd = `${CAMERA_CMD} /folder "${PHOTOS_DIR}"`;
    console.log('Setting folder:', setupCmd);

    exec(setupCmd, { timeout: 5000 }, (setupErr, setupOut, setupStderr) => {
      if (setupErr) console.log('Setup warning:', setupErr.message);

      // 촬영 실행
      const captureCmd = `${CAMERA_CMD} /c capture`;
      console.log('Capturing:', captureCmd);

      exec(captureCmd, { timeout: 15000 }, (error, stdout, stderr) => {
        console.log('Capture output:', stdout);
        if (error) console.log('Capture error:', error.message);

        // 파일 확인 (5초 대기)
        setTimeout(() => {
          const files = fs.readdirSync(PHOTOS_DIR)
            .filter(f => f.endsWith('.jpg') || f.endsWith('.JPG'))
            .map(f => ({
              name: f,
              time: fs.statSync(path.join(PHOTOS_DIR, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          if (files.length > 0) {
            console.log('✓ Photo captured:', files[0].name);
            res.json({
              success: true,
              message: '사진 촬영 완료!',
              filename: files[0].name,
              path: `/photos/${files[0].name}`
            });
          } else {
            res.json({
              success: false,
              message: '촬영 실패: 사진 파일을 찾을 수 없습니다.'
            });
          }
        }, 5000);
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'GUI 시작 실패: ' + err.message
    });
  }
});

app.get('/photos', (req, res) => {
  fs.readdir(PHOTOS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ photos: files.filter(f => f.endsWith('.jpg')) });
  });
});

app.listen(PORT, () => {
  console.log(`Photobooth server running on http://localhost:${PORT}`);
});
