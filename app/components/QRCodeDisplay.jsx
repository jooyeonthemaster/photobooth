'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QR 코드 표시 컴포넌트
 * URL을 받아 QR 코드 이미지를 생성/렌더링
 */
export default function QRCodeDisplay({ url, size = 200 }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(dataUrl => setQrDataUrl(dataUrl))
      .catch(err => console.error('[QRCode] Generation failed:', err));
  }, [url, size]);

  if (!qrDataUrl) return null;

  return (
    <div className="qr-code-container">
      <img
        src={qrDataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="qr-code-image"
        draggable={false}
      />
    </div>
  );
}
