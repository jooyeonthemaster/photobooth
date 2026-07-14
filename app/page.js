'use client';

import { useState, useRef } from 'react';
import './styles/index.css';

// 컴포넌트 imports
import IntroScreen from './components/IntroScreen';
import PinScreen from './components/PinScreen';
import ReadyScreen from './components/ReadyScreen';
import ShootingScreen from './components/ShootingScreen';
import SelectScreen from './components/SelectScreen';
import EditScreen from './components/EditScreen';
import ResultScreen from './components/ResultScreen';
import StickerScreen from './components/StickerScreen';
import StyleSelectScreen from './components/StyleSelectScreen';
import PrintSuccessModal from './components/PrintSuccessModal';
import ScanningOverlay from './components/ScanningOverlay';

// 상수 imports
import { filters } from './constants/filters';

// 훅 imports
import { useCamera } from './hooks/useCamera';
import { useShooting } from './hooks/useShooting';

// 서비스 imports
import { combinePhotos, applyFilter } from './utils/apiService';
import { processPhotosWithFilters } from './services/photoProcessingService';
import { isUploadAvailable, uploadPhoto } from './utils/uploadService';

export default function Home() {
  // 화면 상태
  const [step, setStep] = useState('intro');
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [finalImage, setFinalImage] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('kpop-idol');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredImage, setFilteredImage] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([null, null, null, null]);
  const [isCombining, setIsCombining] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [isFilteringAll, setIsFilteringAll] = useState(false);
  const [previewComposite, setPreviewComposite] = useState(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [slotFilters, setSlotFilters] = useState(['none', 'none', 'none', 'none']);
  const [showPrintSuccess, setShowPrintSuccess] = useState(false);
  const [printDone, setPrintDone] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [frameVariant, setFrameVariant] = useState('black');
  const [placedStickers, setPlacedStickers] = useState([]);

  // 화풍 선택 (PIN 모드 acscent-composite에 적용)
  const [selectedStyle, setSelectedStyle] = useState('webtoon');

  // AC'SCENT 연동 상태
  const [customerData, setCustomerData] = useState(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState(null);

  // 세션 ID — restart() 시 increment하여 stale fetch 결과 무시
  const sessionIdRef = useRef(0);

  // PIN 모드 판별 (촬영 횟수 결정에 사용)
  const isPinMode = !!(referenceImageUrl && customerData);
  const totalShots = isPinMode ? 3 : 6;

  // 카메라 훅
  const { webcamRef, streamRef, cameraMode, cameraReady, handleCameraReady } = useCamera();

  // 촬영 훅
  const {
    capturedPhotos, setCapturedPhotos,
    currentShot, countdown, startContinuousShooting, resetPhotos,
  } = useShooting({ cameraReady, cameraMode, webcamRef, setStep, totalShots });

  // ========== PIN 관련 핸들러 ==========
  const goToPin = () => setStep('pin');

  const handlePinVerified = (data) => {
    console.log('✅ PIN 인증 완료:', data.idolName);
    setCustomerData(data);
    setReferenceImageUrl(data.userImageUrl || null);
    setSelectedSlots([null]); // PIN 모드: 1장만 선택
    goToReady();
  };

  const handlePinSkip = () => {
    console.log('⏭️ PIN 없이 진행');
    setCustomerData(null);
    setReferenceImageUrl(null);
    setSelectedSlots([null, null, null, null]); // 일반 모드: 4장 선택
    goToReady();
  };

  // ========== 화면 전환 핸들러 ==========
  const goToReady = () => {
    resetPhotos();
    setStep('ready');
  };

  // ========== 사진 선택 로직 ==========
  const selectImageForSlot = (slotIndex, photoIndex) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = photoIndex;
    setSelectedSlots(newSlots);
  };

  // ========== 프리뷰 합성 ==========
  const createPreviewComposite = async (styleOverride = null) => {
    if (selectedSlots.includes(null)) {
      alert(isPinMode ? '사진을 선택해주세요!' : '4개의 사진을 모두 선택해주세요!');
      return;
    }

    // 새 세션 시작 — 이전 세션은 자동 무효화
    const mySession = ++sessionIdRef.current;
    const isCurrentSession = () => sessionIdRef.current === mySession;

    setIsCombining(true);
    setIsFilteringAll(true);

    try {
      const selectedPhotos = selectedSlots.map(idx => capturedPhotos[idx]);

      let processed;
      try {
        processed = await processPhotosWithFilters({
          selectedPhotos, isPinMode, referenceImageUrl, customerData,
          style: styleOverride ?? selectedStyle,
        });
      } catch (error) {
        if (error.message === 'FILTER_CONFIG_MISSING') {
          if (isCurrentSession()) {
            alert('⚠️ 필터 설정이 없습니다.\n/admin 페이지에서 필터를 설정해주세요.');
          }
          return;
        }
        throw error;
      }

      // 세션 무효화 체크 (사용자가 탈출 버튼 눌렀을 수도)
      if (!isCurrentSession()) {
        console.log('[Session] processPhotosWithFilters stale result discarded');
        return;
      }

      console.log('✅ 처리 완료');
      setFilteredPhotos(processed.filteredPhotos);
      setSlotFilters(processed.slotFilters);

      // 4컷 합성
      console.log('🖼️ 4컷 합성 시작...');
      const customText = customerData?.idolName || '';
      const result = await combinePhotos(processed.filteredPhotos, selectedFrame, 'none', customText, frameVariant);

      // 세션 무효화 체크
      if (!isCurrentSession()) {
        console.log('[Session] combinePhotos stale result discarded');
        return;
      }

      if (result.success) {
        console.log('✅ 합성 완료');
        setPreviewComposite(result.path);
        setFinalImage(result.path);
        setStep('sticker');
      } else {
        alert('합성에 실패했습니다. 다시 시도해주세요.');
        restart();
      }
    } catch (error) {
      console.error('❌ 필터 적용 또는 합성 실패:', error);
      // 세션 유효할 때만 사용자에게 alert + 홈으로 복귀
      if (isCurrentSession()) {
        alert('합성에 실패했습니다. 다시 시도해주세요.');
        restart();
      }
    } finally {
      // 세션 유효할 때만 플래그 정리 (옛 세션이 새 세션 플래그를 끄지 않도록)
      if (isCurrentSession()) {
        setIsCombining(false);
        setIsFilteringAll(false);
      }
    }
  };

  // ========== 화풍 선택 ==========
  // select 화면 다음: PIN 모드는 화풍 선택 화면으로, 일반 모드는 바로 생성
  const handleSelectProceed = () => {
    if (isPinMode) {
      setStep('style');
    } else {
      createPreviewComposite();
    }
  };

  const handleStyleConfirm = () => {
    createPreviewComposite();
  };

  // ========== 필터 적용 로직 ==========
  const applyFilterToSlot = async (slotIndex, filterId) => {
    setIsApplyingFilter(true);

    try {
      const originalPhoto = selectedSlots.map(idx => capturedPhotos[idx])[slotIndex];

      if (filterId === 'none') {
        const newFiltered = [...filteredPhotos];
        newFiltered[slotIndex] = originalPhoto;
        setFilteredPhotos(newFiltered);
        await updateComposite(newFiltered);
      } else {
        const result = await applyFilter(originalPhoto, filterId);

        if (result.success) {
          const newFiltered = [...filteredPhotos];
          newFiltered[slotIndex] = result.image;
          setFilteredPhotos(newFiltered);

          const newFilters = [...slotFilters];
          newFilters[slotIndex] = filterId;
          setSlotFilters(newFilters);

          await updateComposite(newFiltered);
        } else {
          alert('필터 적용 실패: ' + result.message);
        }
      }
    } catch (error) {
      console.error('필터 적용 오류:', error);
      alert('필터 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplyingFilter(false);
      setEditingSlotIndex(null);
    }
  };

  const updateComposite = async (photosToCompose = null, variant = null) => {
    try {
      const photosArray = photosToCompose || filteredPhotos;
      const customText = customerData?.idolName || '';
      const v = variant ?? frameVariant;
      const result = await combinePhotos(photosArray, selectedFrame, 'none', customText, v);
      if (result.success) {
        setPreviewComposite(result.path);
        setFinalImage(result.path);
      }
    } catch (error) {
      console.error('합성 업데이트 실패:', error);
    }
  };

  const confirmFinalImage = () => {
    setFinalImage(previewComposite);
    setStep('result');
    startPhotoUpload(previewComposite);
  };

  // ========== 프레임 변형 핸들러 ==========
  const handleFrameVariantChange = async (variant) => {
    setFrameVariant(variant);
    await updateComposite(null, variant);
  };

  // ========== 스티커 핸들러 ==========
  const handleStickerComplete = (newFinalImage) => {
    setFinalImage(newFinalImage);
    setStep('result');
    startPhotoUpload(newFinalImage);
  };

  const handleStickerSkip = () => {
    setFinalImage(previewComposite);
    setPlacedStickers([]);
    setStep('result');
    startPhotoUpload(previewComposite);
  };

  // ========== QR 코드 업로드 ==========
  const startPhotoUpload = async (image) => {
    if (!isUploadAvailable()) return;
    setIsUploading(true);
    try {
      const { url } = await uploadPhoto(image);
      setQrUrl(url);
    } catch (err) {
      console.warn('[QR] Upload failed:', err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ========== 프린터 로직 ==========
  const handlePrintImage = async (copies = 1) => {
    if (!finalImage) return;
    setIsPrinting(true);
    try {
      const result = await window.electronAPI.printImage(finalImage, copies);
      if (result.success) {
        setShowPrintSuccess(true);
        setTimeout(() => {
          setShowPrintSuccess(false);
          setPrintDone(true);
        }, 2000);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('[Print] IPC error:', error);
      alert('프린터 연결에 문제가 발생했습니다.');
    } finally {
      setIsPrinting(false);
    }
  };

  // ========== 기타 핸들러 ==========
  const downloadImage = () => {
    if (!finalImage) return;
    const link = document.createElement('a');
    link.href = finalImage;
    link.download = `lifefourcut_${Date.now()}.jpg`;
    link.click();
  };

  const restart = () => {
    // 진행 중인 세션 무효화 — 옛 fetch가 끝나도 결과 폐기됨
    sessionIdRef.current++;

    // 진행 중 플래그 즉시 리셋 (탈출 버튼이 즉시 작동하도록)
    setIsCombining(false);
    setIsFilteringAll(false);
    setIsApplyingFilter(false);

    setStep('intro');
    setCapturedPhotos([]);
    setFinalImage(null);
    setFilteredImage(null);
    resetPhotos();
    setSelectedSlots([null, null, null, null]); // intro로 돌아가므로 기본값
    setFilteredPhotos([]);
    setPreviewComposite(null);
    setEditingSlotIndex(null);
    setSlotFilters(['none', 'none', 'none', 'none']);
    setPrintDone(false);
    setQrUrl(null);
    setIsUploading(false);
    setFrameVariant('black');
    setPlacedStickers([]);
    setCustomerData(null);
    setReferenceImageUrl(null);
    setSelectedStyle('webtoon');
  };

  // ========== 렌더링 ==========
  return (
    <div className="photobooth">
      {step === 'intro' && (
        <IntroScreen onStart={goToPin} streamRef={streamRef} cameraMode={cameraMode} cameraReady={cameraReady} />
      )}

      {step === 'pin' && (
        <PinScreen
          onPinVerified={handlePinVerified}
          onSkip={handlePinSkip}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'ready' && (
        <ReadyScreen
          webcamRef={webcamRef}
          stream={streamRef.current}
          cameraMode={cameraMode}
          countdown={countdown}
          cameraReady={cameraReady}
          onCameraReady={handleCameraReady}
          onStartShooting={startContinuousShooting}
          onBack={() => setStep('intro')}
          totalShots={totalShots}
        />
      )}

      {step === 'shooting' && (
        <ShootingScreen
          webcamRef={webcamRef}
          stream={streamRef.current}
          cameraMode={cameraMode}
          currentShot={currentShot}
          countdown={countdown}
          capturedPhotos={capturedPhotos}
          totalShots={totalShots}
        />
      )}

      {step === 'select' && (
        <SelectScreen
          capturedPhotos={capturedPhotos}
          selectedSlots={selectedSlots}
          onSelectImage={selectImageForSlot}
          onCreatePreview={handleSelectProceed}
          onResetSelection={() => setSelectedSlots(isPinMode ? [null] : [null, null, null, null])}
          onRetake={() => {
            setStep('ready');
            setCapturedPhotos([]);
            resetPhotos();
            setSelectedSlots(isPinMode ? [null] : [null, null, null, null]);
          }}
          isCombining={isCombining}
          customerData={customerData}
          referenceImageUrl={referenceImageUrl}
        />
      )}

      {step === 'style' && (
        <StyleSelectScreen
          onSelect={setSelectedStyle}
          onConfirm={handleStyleConfirm}
          onBack={() => setStep('select')}
          selectedStyle={selectedStyle}
          customerData={customerData}
          isCombining={isCombining}
        />
      )}

      {step === 'edit' && (
        <EditScreen
          capturedPhotos={capturedPhotos}
          selectedSlots={selectedSlots}
          filteredPhotos={filteredPhotos}
          editingSlotIndex={editingSlotIndex}
          slotFilters={slotFilters}
          filters={filters}
          isApplyingFilter={isApplyingFilter}
          customerData={customerData}
          onSlotClick={(idx) => setEditingSlotIndex(editingSlotIndex === idx ? null : idx)}
          onApplyFilter={applyFilterToSlot}
          onConfirm={confirmFinalImage}
          onBack={() => {
            setStep('select');
            setEditingSlotIndex(null);
            setSlotFilters(isPinMode ? ['none'] : ['none', 'none', 'none', 'none']);
          }}
        />
      )}

      {step === 'sticker' && (
        <StickerScreen
          finalImage={previewComposite}
          onComplete={handleStickerComplete}
          onSkip={handleStickerSkip}
          frameVariant={frameVariant}
          onFrameVariantChange={handleFrameVariantChange}
          placedStickers={placedStickers}
          setPlacedStickers={setPlacedStickers}
          customerData={customerData}
          onHome={restart}
        />
      )}

      {step === 'result' && (
        <ResultScreen
          finalImage={finalImage}
          onDownload={downloadImage}
          onPrint={handlePrintImage}
          onRestart={restart}
          onBack={() => setStep('sticker')}
          isPrinting={isPrinting}
          printDone={printDone}
          qrUrl={qrUrl}
          isUploading={isUploading}
        />
      )}

      <PrintSuccessModal
        show={showPrintSuccess}
        onClose={() => setShowPrintSuccess(false)}
      />

      <ScanningOverlay
        isVisible={isCombining || isApplyingFilter}
        mode={isCombining ? 'full' : 'single'}
        isPinMode={isPinMode}
        streamRef={streamRef}
        cameraMode={cameraMode}
        cameraReady={cameraReady}
        onTimeout={restart}
      />
    </div>
  );
}
