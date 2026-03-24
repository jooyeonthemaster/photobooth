import { applyFilter, applyFilterGrid, createPhotoGrid, splitPhotoGrid } from '../utils/apiService';

/**
 * 선택된 사진에 필터를 적용하는 서비스 함수
 * PIN 모드와 일반 모드를 분기 처리
 */
export async function processPhotosWithFilters({
  selectedPhotos,
  isPinMode,
  referenceImageUrl,
  customerData,
}) {
  const results = [];

  if (isPinMode) {
    // ===== PIN 모드: 유저 사진 1장 → Seedream이 4컷 그리드 직접 생성 =====
    const singlePhoto = selectedPhotos[0];
    console.log('🔗 AC\'SCENT PIN 모드 - 1장 기반 4컷 생성');
    console.log('🔗 참조 이미지:', referenceImageUrl);
    console.log('🔗 캐릭터:', customerData.idolName);

    try {
      // 1장을 직접 Seedream에 전달 (그리드 합성 생략)
      console.log('📸 PIN 모드: 1장 → Seedream 4컷 생성 중...');
      const gridResult = await applyFilterGrid(singlePhoto, 'acscent-composite', referenceImageUrl, customerData);

      if (gridResult.success) {
        console.log('🔲 PIN 모드: 결과 4분할 중...');
        const splitImages = await splitPhotoGrid(gridResult.image);
        results.push(...splitImages.map(img => ({ success: true, image: img })));
        console.log('✅ PIN 모드 완료 - 4컷 생성 적용됨');
      } else {
        throw new Error(gridResult.message || 'Grid generation failed');
      }
    } catch (gridError) {
      console.warn('⚠️ PIN 4컷 생성 실패, 싱글 모드로 전환:', gridError.message);
      // fallback: 1장으로 단일 합성
      const result = await applyFilter(singlePhoto, 'acscent-composite', referenceImageUrl, customerData);
      // 단일 결과를 4장으로 복제
      for (let i = 0; i < 4; i++) {
        results.push(result);
      }
    }

    const failedCount = results.filter(r => !r.success).length;
    const filteredPhotos = results.map((result) =>
      result.success ? result.image : singlePhoto
    );
    const slotFilters = ['acscent-composite', 'acscent-composite', 'acscent-composite', 'acscent-composite'];

    return { filteredPhotos, slotFilters, failedCount };
  }

  // ===== 일반 모드: admin 필터 설정 사용 (참조 이미지 없음) =====
  const savedConfig = localStorage.getItem('photoboothFilters');

  if (!savedConfig) {
    throw new Error('FILTER_CONFIG_MISSING');
  }

  const config = JSON.parse(savedConfig);
  const slotAssignment = config.slotAssignment;
  console.log('🎨 일반 모드 - 필터 설정:', slotAssignment);

  // 그리드 모드 조건: 4슬롯 모두 같은 필터 & none이 아닐 때
  const uniqueFilters = [...new Set(slotAssignment)];
  const isGridEligible = uniqueFilters.length === 1 && uniqueFilters[0] !== 'none';

  if (isGridEligible) {
    // ===== 그리드 모드: 4장을 하나의 이미지로 일괄 처리 =====
    const filterId = uniqueFilters[0];
    console.log(`🔲 GRID MODE: "${filterId}" 필터를 4장에 일괄 적용`);

    try {
      console.log('🔲 2x2 그리드 이미지 생성 중...');
      const gridImage = await createPhotoGrid(selectedPhotos);

      console.log('🔲 그리드 이미지 AI 필터 적용 중...');
      const gridResult = await applyFilterGrid(gridImage, filterId);

      if (gridResult.success) {
        console.log('🔲 필터 결과 4분할 중...');
        const splitImages = await splitPhotoGrid(gridResult.image);
        results.push(...splitImages.map(img => ({ success: true, image: img })));
        console.log('✅ 그리드 모드 완료 - 일관된 스타일 적용됨');
      } else {
        console.warn('⚠️ 그리드 모드 실패, 개별 처리로 전환:', gridResult.message);
        for (let index = 0; index < selectedPhotos.length; index++) {
          const result = await applyFilter(selectedPhotos[index], filterId, null, null);
          results.push(result);
          if (index < selectedPhotos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    } catch (gridError) {
      console.error('❌ 그리드 모드 예외, 개별 처리로 전환:', gridError);
      for (let index = 0; index < selectedPhotos.length; index++) {
        const filterId2 = slotAssignment[index];
        if (filterId2 === 'none') {
          results.push({ success: true, image: selectedPhotos[index] });
        } else {
          const result = await applyFilter(selectedPhotos[index], filterId2, null, null);
          results.push(result);
          if (index < selectedPhotos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
  } else {
    // ===== 개별 모드: 슬롯별 다른 필터 (기존 방식) =====
    console.log('🎨 개별 모드 - 슬롯별 필터 적용');
    for (let index = 0; index < selectedPhotos.length; index++) {
      const photo = selectedPhotos[index];
      const filterId = slotAssignment[index];
      console.log(`슬롯 ${index + 1}: ${filterId} 필터 적용 중...`);

      if (filterId === 'none') {
        results.push({ success: true, image: photo });
      } else {
        const result = await applyFilter(photo, filterId, null, null);
        results.push(result);
        if (index < selectedPhotos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }

  const failedCount = results.filter(r => !r.success).length;
  if (failedCount > 0) {
    console.warn(`⚠️ ${failedCount}개 적용 실패`);
  }

  const filteredPhotos = results.map((result, index) =>
    result.success ? result.image : selectedPhotos[index]
  );

  return { filteredPhotos, slotFilters: slotAssignment, failedCount };
}
