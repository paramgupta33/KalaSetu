import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  isHindi?: boolean;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const { t } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileFallbackRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  // Stop camera tracks helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    stopStream();
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      } catch {
        // Enumerate devices not permitted or supported
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsStartingCamera(false);
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      setIsStartingCamera(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? t('cameraPermissionDenied')
          : t('cameraStartFailed')
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Flip camera between environment (rear) and user (front)
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture frame from video
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    try {
      setIsFlashing(true);
      const canvas = document.createElement('canvas');
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // If front camera, mirror image for natural appearance
        if (facingMode === 'user') {
          ctx.translate(videoWidth, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        setTimeout(() => {
          setIsFlashing(false);
          stopStream();
          onCapture(dataUrl);
          onClose();
        }, 120);
      }
    } catch (err) {
      console.error('Error capturing video frame:', err);
      setIsFlashing(false);
    }
  };

  // Handle fallback file upload
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        stopStream();
        onCapture(result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Hidden fallback file input */}
      <input
        type="file"
        ref={fileFallbackRef}
        onChange={handleFallbackFile}
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden="true"
      />

      {/* Top Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-white text-sm font-semibold tracking-wide">
            {t('cameraTitle')}
          </span>
        </div>

        <button
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md cursor-pointer transition-all active:scale-90"
          type="button"
          aria-label={t('closeCamera')}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Main Camera Viewfinder Viewport */}
      <div className="relative w-full max-w-md aspect-3/4 max-h-[70vh] rounded-3xl overflow-hidden bg-neutral-900 border border-white/20 shadow-2xl flex items-center justify-center my-auto">
        {/* Shutter flash animation */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-30 transition-opacity duration-100 opacity-90 pointer-events-none" />
        )}

        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Viewfinder Grid Overlay */}
        {!cameraError && !isStartingCamera && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-b border-white/15 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border border-white/30"></div>
            </div>
            <div className="border-b border-white/15"></div>
            <div className="border-r border-b border-white/15"></div>
            <div className="border-r border-white/15"></div>
            <div></div>

            {/* Corner Alignment Guides */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-300/80 rounded-tl-sm"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-300/80 rounded-tr-sm"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-300/80 rounded-bl-sm"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-300/80 rounded-br-sm"></div>

            <div className="absolute bottom-6 inset-x-0 text-center">
              <span className="bg-black/60 text-white/90 text-xs px-3 py-1 rounded-full backdrop-blur-md font-medium">
                {t('alignCraftFrame')}
              </span>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isStartingCamera && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white gap-3 z-20">
            <div className="w-8 h-8 rounded-full border-2 border-amber-300 border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium text-white/80">
              {t('startingCamera')}
            </span>
          </div>
        )}

        {/* Error Fallback View */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-900/95 text-center text-white z-20 space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px]">no_photography</span>
            </div>
            <p className="text-xs text-neutral-300 max-w-xs leading-relaxed">
              {cameraError}
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
              <button
                onClick={() => fileFallbackRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-900 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                <span>{t('choosePhotoDevice')}</span>
              </button>
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>{t('tryCameraAgain')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Shutter & Controls Toolbar */}
      <div className="w-full max-w-md flex items-center justify-around z-10 pb-4 pt-2">
        {/* Gallery / File Picker Fallback */}
        <button
          onClick={() => fileFallbackRef.current?.click()}
          className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90"
          type="button"
          title={t('chooseFile')}
        >
          <span className="material-symbols-outlined text-[22px]">photo_library</span>
        </button>

        {/* Prominent Shutter Button */}
        <button
          onClick={capturePhoto}
          disabled={Boolean(cameraError) || isStartingCamera}
          className="w-20 h-20 rounded-full border-4 border-white bg-transparent p-1 flex items-center justify-center cursor-pointer active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:scale-105"
          type="button"
          aria-label={t('capturePhoto')}
        >
          <div className="w-full h-full rounded-full bg-white hover:bg-neutral-100 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-[#2C2C2C] text-[28px]">photo_camera</span>
          </div>
        </button>

        {/* Flip Camera (Front / Back) */}
        <button
          onClick={toggleCameraFacing}
          disabled={!hasMultipleCameras && !cameraError}
          className={`w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer transition-all active:scale-90 ${
            !hasMultipleCameras ? 'opacity-40' : ''
          }`}
          type="button"
          title={t('switchCamera')}
        >
          <span className="material-symbols-outlined text-[22px]">flip_camera_ios</span>
        </button>
      </div>
    </div>
  );
};
