'use client';

import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import './page.css';

// 컴포넌트 imports
import IntroScreen from './components/IntroScreen';
import ReadyScreen from './components/ReadyScreen';
import ShootingScreen from './components/ShootingScreen';
import SelectScreen from './components/SelectScreen';
import EditScreen from './components/EditScreen';
import ResultScreen from './components/ResultScreen';
import PrintPreviewModal from './components/PrintPreviewModal';
import FilterTestScreen from './components/FilterTestScreen';

// 상수 imports
import { filters } from './constants/filters';
import { frames } from './constants/frames';
import { videoConstraints } from './constants/camera';

// 유틸 imports
import { captureAndCropImage, generatePrintPreview } from './utils/imageProcessing';
import { applyFilter, combinePhotos, printImage as printImageAPI, convertImageUrlToBase64 } from './utils/apiService';

export default function Home() {
  const webcamRef = useRef(null);
  const photosRef = useRef([]);

  // 상태 관리
  const [step, setStep] = useState('intro');
  const [selectedFrame, setSelectedFrame] = useState('classic');
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [currentShot, setCurrentShot] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('kpop-idol');
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const [filteredImage, setFilteredImage] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewImage, setPrintPreviewImage] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([null, null, null, null]);
  const [isCombining, setIsCombining] = useState(false);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [isFilteringAll, setIsFilteringAll] = useState(false);
  const [previewComposite, setPreviewComposite] = useState(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [slotFilters, setSlotFilters] = useState(['none', 'none', 'none', 'none']);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);

  // ========== 화면 전환 핸들러 ==========
  const goToReady = () => {
    photosRef.current = [];
    setCapturedPhotos([]);
    setCurrentShot(0);
    setCountdown(null);
    setCameraReady(false);
    setStep('ready');
  };

  const handleCameraReady = () => {
    console.log('Camera ready');
    setCameraReady(true);
  };

  // ========== 촬영 로직 ==========
  const startContinuousShooting = () => {
    if (!cameraReady) {
      alert('카메라가 준비되지 않았습니다. 잠시만 기다려주세요.');
      return;
    }
    photosRef.current = [];
    setCapturedPhotos([]);
    setCurrentShot(0);
    setStep('shooting');
    takeNextShot(0);
  };

  const takeNextShot = (shotNumber) => {
    if (shotNumber >= 6) {
      setStep('select');
      return;
    }

    console.log('Taking shot', shotNumber + 1);
    setCurrentShot(shotNumber);
    setCountdown(3);

    setTimeout(() => {
      setCountdown(2);
      setTimeout(() => {
        setCountdown(1);
        setTimeout(() => {
          setCountdown(null);
          captureImage(shotNumber);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const captureImage = async (shotNumber) => {
    try {
      const croppedImage = await captureAndCropImage(webcamRef);
      photosRef.current.push(croppedImage);
      setCapturedPhotos([...photosRef.current]);

      setTimeout(() => {
        takeNextShot(shotNumber + 1);
      }, 2000);
    } catch (error) {
      console.error('캡처 실패:', error);
      alert('사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // ========== 사진 선택 로직 ==========
  const selectImageForSlot = (slotIndex, photoIndex) => {
    const newSlots = [...selectedSlots];
    newSlots[slotIndex] = photoIndex;
    setSelectedSlots(newSlots);
  };

  const createPreviewComposite = async () => {
    if (selectedSlots.includes(null)) {
      alert('4개의 사진을 모두 선택해주세요!');
      return;
    }

    setIsCombining(true);

    try {
      const selectedPhotos = selectedSlots.map(idx => capturedPhotos[idx]);
      setFilteredPhotos(selectedPhotos);

      const result = await combinePhotos(selectedPhotos, selectedFrame, 'none');

      if (result.success) {
        setPreviewComposite(result.path);
        setStep('edit');
      } else {
        alert('합성 실패: ' + result.message);
      }
    } catch (error) {
      console.error('합성 실패:', error);
      alert('합성 중 오류가 발생했습니다.');
    } finally {
      setIsCombining(false);
    }
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
      } else {
        const result = await applyFilter(originalPhoto, filterId);
        
        if (result.success) {
          const newFiltered = [...filteredPhotos];
          newFiltered[slotIndex] = result.image;
          setFilteredPhotos(newFiltered);
          
          const newFilters = [...slotFilters];
          newFilters[slotIndex] = filterId;
          setSlotFilters(newFilters);
        } else {
          alert('필터 적용 실패: ' + result.message);
        }
      }

      await updateComposite();
    } catch (error) {
      console.error('필터 적용 오류:', error);
      alert('필터 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplyingFilter(false);
      setEditingSlotIndex(null);
    }
  };

  const updateComposite = async () => {
    try {
      const result = await combinePhotos(filteredPhotos, selectedFrame, 'none');
      if (result.success) {
        setPreviewComposite(result.path);
      }
    } catch (error) {
      console.error('합성 업데이트 실패:', error);
    }
  };

  const confirmFinalImage = () => {
    setFinalImage(previewComposite);
    setStep('result');
  };

  // ========== 프린터 로직 ==========
  const handleGeneratePrintPreview = async () => {
    const imageToPrint = finalImage || filteredImage || (capturedPhotos.length > 0 ? capturedPhotos[0] : null);
    
    if (!imageToPrint) {
      alert('미리보기할 이미지가 없습니다.');
      return;
    }

    try {
      const previewImage = await generatePrintPreview(imageToPrint);
      setPrintPreviewImage(previewImage);
      setShowPrintPreview(true);
    } catch (error) {
      console.error('미리보기 생성 실패:', error);
      alert('미리보기 생성 중 오류가 발생했습니다.');
    }
  };

  const handlePrintImage = async () => {
    console.log('🖨️ printImage 함수 시작');

    let imageToPrint;

    if (finalImage) {
      try {
        imageToPrint = await convertImageUrlToBase64(finalImage);
      } catch (err) {
        console.error('이미지 로드 실패:', err);
        alert('이미지를 불러올 수 없습니다.');
        return;
      }
    } else {
      imageToPrint = filteredImage || (capturedPhotos.length > 0 ? capturedPhotos[0] : null);
    }

    if (!imageToPrint) {
      console.log('❌ 출력할 이미지 없음');
      alert('출력할 이미지가 없습니다.');
      return;
    }

    console.log('📤 프린터 API 호출 준비');
    setIsPrinting(true);

    try {
      const result = await printImageAPI(imageToPrint);

      if (result.success) {
        console.log('✅ 프린터 출력 성공');
        alert('✅ DNP 프린터로 출력을 시작했습니다!');
      } else {
        console.log('❌ 프린터 출력 실패:', result.message);
        alert('❌ 출력 실패: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Print error:', error);
      alert('출력 중 오류가 발생했습니다.');
    } finally {
      setIsPrinting(false);
      console.log('🏁 printImage 함수 종료');
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
    setStep('intro');
    setCapturedPhotos([]);
    setCurrentShot(0);
    setFinalImage(null);
    setFilteredImage(null);
    photosRef.current = [];
    setCameraReady(false);
    setSelectedSlots([null, null, null, null]);
    setFilteredPhotos([]);
    setPreviewComposite(null);
    setEditingSlotIndex(null);
    setSlotFilters(['none', 'none', 'none', 'none']);
  };

  // ========== 렌더링 ==========
  return (
    <div className="photobooth">
      {step === 'intro' && <IntroScreen onStart={goToReady} onFilterTest={() => setStep('filterTest')} />}

      {step === 'filterTest' && <FilterTestScreen onBack={() => setStep('intro')} />}

      {step === 'ready' && (
        <ReadyScreen
          webcamRef={webcamRef}
              videoConstraints={videoConstraints}
          countdown={countdown}
          cameraReady={cameraReady}
          onCameraReady={handleCameraReady}
          onStartShooting={startContinuousShooting}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'shooting' && (
        <ShootingScreen
          webcamRef={webcamRef}
              videoConstraints={videoConstraints}
          currentShot={currentShot}
          countdown={countdown}
          capturedPhotos={capturedPhotos}
        />
      )}

      {step === 'select' && (
        <SelectScreen
          capturedPhotos={capturedPhotos}
          selectedSlots={selectedSlots}
          onSelectImage={selectImageForSlot}
          onCreatePreview={createPreviewComposite}
          onResetSelection={() => setSelectedSlots([null, null, null, null])}
          onRetake={() => {
            setStep('ready');
            setCapturedPhotos([]);
            photosRef.current = [];
            setSelectedSlots([null, null, null, null]);
          }}
          isCombining={isCombining}
        />
      )}

      {step === 'edit' && (
        <EditScreen
          previewComposite={previewComposite}
          filteredPhotos={filteredPhotos}
          editingSlotIndex={editingSlotIndex}
          slotFilters={slotFilters}
          filters={filters}
          isApplyingFilter={isApplyingFilter}
          showBeforeAfter={showBeforeAfter}
          onSlotClick={(idx) => setEditingSlotIndex(editingSlotIndex === idx ? null : idx)}
          onApplyFilter={applyFilterToSlot}
          onConfirm={confirmFinalImage}
          onBack={() => {
                setStep('select');
                setEditingSlotIndex(null);
                setSlotFilters(['none', 'none', 'none', 'none']);
              }}
          onBeforeAfterPress={() => setShowBeforeAfter(true)}
          onBeforeAfterRelease={() => setShowBeforeAfter(false)}
        />
      )}

      {step === 'result' && (
        <ResultScreen
          finalImage={finalImage}
          onDownload={downloadImage}
          onPrintPreview={handleGeneratePrintPreview}
          onPrint={handlePrintImage}
          onRestart={restart}
          isPrinting={isPrinting}
        />
      )}

      <PrintPreviewModal
        show={showPrintPreview}
        previewImage={printPreviewImage}
        onPrint={handlePrintImage}
        onClose={() => setShowPrintPreview(false)}
      />
    </div>
  );
}
