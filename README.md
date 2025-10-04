# Canon EOS 200D2 포토부스

Node.js 기반 포토부스 애플리케이션

## 설치 및 실행

```bash
npm install
npm start
```

## Windows에서 카메라 제어

Windows에서 캐논 카메라를 제어하려면 다음 옵션 중 하나를 선택하세요:

### 1. digiCamControl (권장)
- [digiCamControl](http://digicamcontrol.com/) 다운로드 및 설치
- CLI를 통해 Node.js에서 제어 가능

### 2. Canon EDSDK
- 캐논 공식 SDK (개발자 등록 필요)
- C++ 바인딩 필요

### 3. gphoto2 (Linux/Mac only)
- Windows에서는 사용 불가

## 프로젝트 구조

```
/
├── index.js           # Express 서버
├── public/
│   └── index.html     # 포토부스 UI
├── photos/            # 촬영된 사진 저장
└── package.json
```

## TODO

- [ ] Windows에서 카메라 제어 구현 (digiCamControl 또는 EDSDK)
- [ ] 라이브 프리뷰 기능
- [ ] 카운트다운 타이머
- [ ] 사진 필터/효과
