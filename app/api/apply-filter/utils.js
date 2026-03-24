// 참조 이미지를 URL에서 Base64로 가져오기
export async function fetchImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  } catch (error) {
    console.error('[fetchImageAsBase64] Error:', error.message);
    return null;
  }
}
