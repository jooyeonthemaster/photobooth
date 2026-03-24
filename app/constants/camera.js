// 웹캠 설정 (Canon EOS Webcam Utility 사용 시 최대 해상도 활용)
// facingMode 제거: 외부 카메라(Canon EOS Webcam Utility)에서 호환성 문제 발생
export const videoConstraints = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};


