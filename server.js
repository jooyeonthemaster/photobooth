const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// 사진 저장 폴더
const PHOTOS_DIR = path.join(__dirname, 'photos');
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR);
}

// 정적 파일 서빙
app.use('/photos', express.static(PHOTOS_DIR));

// 사진 촬영 (Base64 이미지 저장)
app.post('/api/capture', (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: '이미지 데이터가 없습니다.' });
    }

    // Base64 데이터에서 헤더 제거
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
    const filename = `photo_${Date.now()}.jpg`;
    const filepath = path.join(PHOTOS_DIR, filename);

    // 파일 저장
    fs.writeFileSync(filepath, base64Data, 'base64');

    console.log('✓ Photo saved:', filename);
    res.json({
      success: true,
      message: '사진 촬영 완료!',
      filename: filename,
      path: `/photos/${filename}`
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      message: '저장 실패: ' + error.message
    });
  }
});

// 사진 목록 조회
app.get('/api/photos', (req, res) => {
  fs.readdir(PHOTOS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const photos = files
      .filter(f => f.endsWith('.jpg') || f.endsWith('.JPG'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(PHOTOS_DIR, a));
        const statB = fs.statSync(path.join(PHOTOS_DIR, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });
    res.json({ photos });
  });
});

app.listen(PORT, () => {
  console.log(`✓ Photobooth server running on http://localhost:${PORT}`);
  console.log(`✓ React app will run on http://localhost:5173`);
});
