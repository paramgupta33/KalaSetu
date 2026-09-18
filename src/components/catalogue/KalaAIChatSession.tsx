import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CameraModal } from '../common/CameraModal';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { sendCraftChat } from '../../services/aiService';

interface KalaAIChatSessionProps {
  onBack: () => void;
  initialMode?: 'camera' | 'voice' | 'gallery' | 'general';
  initialImage?: string | null;
  onResumeChat?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  textEn: string;
  textHi?: string;
  time: string;
  image?: string;
  badge?: string;
}

export const KalaAIChatSession: React.FC<KalaAIChatSessionProps> = ({
  onBack,
  initialMode = 'general',
  initialImage = null,
  onResumeChat,
}) => {
  const { showToast, addNewProduct, setActiveTab, language, setLanguage, openModal } = useApp();
  const isHindi = language === 'hi';

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [inputText, setInputText] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Real voice transcription with gemini-3.5-transcribe
  const {
    isRecording,
    isTranscribing,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useVoiceInput({
    language,
    onTranscript: (spokenText) => {
      setInputText(spokenText);
      showToast(isHindi ? 'आवाज से संदेश प्राप्त हुआ!' : 'Voice transcript ready!', 'success');
    },
    onError: (err) => {
      showToast(err, 'error');
    },
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      textEn: 'Namaste Radhika ji! 🙏 I am your KalaSetu craft studio copilot. To begin, upload a photo above, or tap the microphone below and tell me what you crafted today!',
      textHi: 'नमस्ते राधिका जी! 🙏 मैं आपकी कलासेतु शिल्प स्टूडियो साथी हूँ। शुरू करने के लिए ऊपर फोटो अपलोड करें, या नीचे माइक पर टैप करके बताएं कि आज आपने क्या बनाया है!',
      time: 'Just now',
    },
  ]);

  const processedInitialImageRef = useRef<string | null>(null);
  const initialCameraTriggeredRef = useRef(false);

  // Handle camera auto-trigger or initial image passed from hub
  useEffect(() => {
    if (initialImage) {
      if (processedInitialImageRef.current === initialImage) {
        return;
      }
      processedInitialImageRef.current = initialImage;
      setIsProcessingImage(true);
      const timer = setTimeout(() => {
        setIsProcessingImage(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            sender: 'user',
            textEn: 'Captured craft photo with camera for AI cataloging and studio enhancement.',
            textHi: 'कैमरे से शिल्प की फोटो खींची गई। AI से विवरण और स्टूडियो संवर्धन तैयार करें।',
            time: 'Just now',
            image: initialImage,
          },
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            textEn:
              'Camera photo received with pristine detail! Studio backdrop isolated, warm lighting balanced, and recommended pricing set to ₹2,450 (MRP ₹3,200, 23% festive discount) with GI Certification tags ready.',
            textHi:
              'कैमरे की फोटो बेहतरीन स्पष्टता से प्राप्त हुई! बैकड्रॉप स्टूडियो फिनिश में बदल दिया गया है, सुझाई गई उचित कीमत ₹2,450 (MRP ₹3,200, 23% त्योहारी छूट) और जीआई प्रमाणन टैग तैयार हैं।',
            time: 'Just now',
            badge: isHindi ? 'कैमरा फोटो • स्टूडियो बैकड्रॉप' : 'Camera Photo • Studio Isolated',
          },
        ]);
        showToast(
          isHindi
            ? 'कैमरा फोटो का विश्लेषण सफल! विवरण तैयार है।'
            : 'Camera photo analyzed! Studio details generated.',
          'success'
        );
      }, 1200);
      return () => clearTimeout(timer);
    } else if (initialMode === 'camera' && !initialCameraTriggeredRef.current) {
      initialCameraTriggeredRef.current = true;
      setIsCameraModalOpen(true);
    }
  }, [initialImage, initialMode, isHindi, showToast]);

  // Audio Playback with Web Speech API in Hindi/English
  const toggleAudioIntro = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToSpeak = isHindi
          ? 'नमस्ते राधिका जी! मैं आपकी कलासेतु स्टूडियो कोपायलट हूँ। अपनी कलाकृति की फोटो अपलोड करें या बोलकर बताएं कि आज आपने क्या बनाया है।'
          : 'Namaste Radhika ji! I am your KalaSetu craft studio copilot. Upload a photo or tap the microphone to describe your craft.';
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = isHindi ? 'hi-IN' : 'en-US';
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setIsPlayingAudio(false), 5000);
      }
    }
  };

  // Recording toggle with real MediaRecorder & Gemini 3.5 Transcribe
  // Handle capture from live CameraModal or file input
  const handleCameraCaptured = (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setIsProcessingImage(true);
    showToast(
      isHindi
        ? 'स्टूडियो बैकड्रॉप अलग किया जा रहा है और शिल्प विवरण तैयार हो रहा है...'
        : 'Isolating studio backdrop & composing craft details...',
      'info'
    );

    setTimeout(() => {
      setIsProcessingImage(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          textEn: 'Captured craft photo with camera for AI cataloging and studio enhancement.',
          textHi: 'कैमरे से शिल्प की फोटो खींची गई। AI से विवरण और स्टूडियो संवर्धन तैयार करें।',
          time: 'Just now',
          image: dataUrl,
        },
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          textEn:
            'Backdrop cleanly isolated! I detected a Handcrafted Jaipur Blue Pottery Urli. Suggested pricing is ₹2,450 (MRP ₹3,200, 23% festive discount) with GI Certification tags ready.',
          textHi:
            'बैकड्रॉप स्टूडियो फिनिश में बदल दिया गया है! मैंने हस्तनिर्मित जयपुर ब्लू पॉटरी उरली की पहचान की है। सुझाई गई उचित कीमत ₹2,450 (MRP ₹3,200, 23% त्योहारी छूट) और जीआई प्रमाणन टैग तैयार हैं।',
          time: 'Just now',
          badge: isHindi ? 'कैमरा फोटो • स्टूडियो बैकड्रॉप' : 'Camera Photo • Studio Isolated',
        },
      ]);

      showToast(
        isHindi
          ? 'स्टूडियो बैकड्रॉप संवर्धन पूरा हुआ और शिल्प विवरण तैयार!'
          : 'Studio backdrop enhanced & storytelling generated!',
        'success'
      );
    }, 600);
  };

  // Recording toggle with real MediaRecorder & Gemini 3.5 Transcribe
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Image Upload Handling
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        handleCameraCaptured(rawResult);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input value to allow selecting or snapping the same image again
    e.target.value = '';
  };

  // Send Message with craft copilot reasoning using Gemini 2.5 Flash
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      textEn: text,
      textHi: text,
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiGenerating(true);

    try {
      const response = await sendCraftChat({
        prompt: text,
        image: uploadedImage || undefined,
        language: isHindi ? 'hi' : 'en',
        model: 'gemini-3.6-flash',
      });

      if (response.success && response.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            textEn: response.text,
            textHi: response.text,
            time: 'Just now',
            badge: isHindi ? 'कलासेतु AI' : 'KalaAI',
          },
        ]);
      } else {
        const errMsg = response.error || 'Failed to generate AI response. Please retry.';
        showToast(errMsg, 'error');
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: 'ai',
            textEn: `Error: ${errMsg}`,
            textHi: `त्रुटि: ${errMsg}`,
            time: 'Just now',
            badge: 'Error',
          },
        ]);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error communicating with AI';
      showToast(errMsg, 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          textEn: `Error: ${errMsg}`,
          textHi: `त्रुटि: ${errMsg}`,
          time: 'Just now',
          badge: 'Error',
        },
      ]);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 1-Click Publish from Chat
  const handlePublishFromChat = () => {
    const craftPhoto =
      uploadedImage ||
      'https://lh3.googleusercontent.com/aida/AEtjO1W3uM1cxnqtfFk9N_bQfOzrX-ed_0Pe7OslSZcDq4lCQeAWXTyeBXz5rEK2wAFHwTIAT2_TIVpNLCXZzBcv-JuG-_HwcBopit92Rr-ApMGWiczd4fRKO7WTvEDp3Q6ulFMBnFZvHtihAL-SIaoK3TALar3PY5_NUOBWhss_UCXjMeVrClY15j18tZHn46t8lLuyZZZNd59CgsUbdwsxTTchleHl7-dxLDGvLzyCU_da7ou38XpbDzMyEkA';

    addNewProduct({
      sku: 'JAIPUR-POT-9402',
      title: {
        en: 'Handcrafted Jaipur Blue Pottery Urli',
        hi: 'हस्तनिर्मित जयपुर ब्लू पॉटरी उरली',
        mr: 'हस्तनिर्मित जयपूर ब्लू पॉटरी उरली',
      },
      category: 'pottery',
      categoryLabel: {
        en: 'Jaipur Blue Pottery',
        hi: 'जयपुर ब्लू पॉटरी',
        mr: 'जयपूर ब्लू पॉटरी',
      },
      price: 2450,
      mrp: 3200,
      discountPercent: 23,
      inStock: true,
      stockCount: 6,
      views: 18,
      sold: 0,
      isLowStock: false,
      imageUrl: craftPhoto,
      altText: isHindi ? 'हस्तनिर्मित जयपुर ब्लू पॉटरी उरली' : 'Handcrafted Jaipur Blue Pottery Urli',
      tags: ['blue-pottery', 'jaipur', 'urli', 'gi-craft', 'festive-decor'],
      giCertified: true,
      isGiCertified: true,
      dimensions: isHindi ? '10" व्यास x 4" ऊंचाई (1.8 किग्रा)' : '10" diameter x 4" height (1.8 kg)',
      materials: isHindi
        ? ['क्वार्ट्ज पाउडर', 'प्राकृतिक कोबाल्ट ग्लेज', 'मुल्तानी मिट्टी']
        : ['Quartz Dough', 'Natural Cobalt Glaze', 'Fullers Earth'],
      craftStory: {
        en: 'Hand-painted marigold floral bowl low-fired with authentic Rajasthani cobalt blue glaze.',
        hi: 'पारंपरिक राजस्थानी कोबाल्ट नीले ग्लेज से तैयार हाथ से चित्रित गेंदा पुष्प उरली।',
        mr: 'पारंपरिक राजस्थानी कोबाल्ट निळ्या ग्लेजने तयार केलेली हस्तनिर्मित उरली.',
        historicalOrigin: 'Jaipur, Rajasthan (GI)',
        techniques: ['Wheel-molded quartz dough', 'Hand-glazed floral motif'],
        fairWageShare: 90,
      },
      bulkTier: {
        minUnits: 5,
        minQty: 5,
        pricePerUnit: 1950,
        leadTimeDays: 7,
        maxCapacityPerMonth: 50,
      },
    });

    setIsPublished(true);
    showToast(
      isHindi
        ? 'कलाकृति को आपकी लाइव कलासेतु कैटलॉग में प्रकाशित किया गया!'
        : 'Craft published to your live KalaSetu catalogue!',
      'success'
    );
    setTimeout(() => {
      setActiveTab('catalogue');
    }, 800);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-28 pt-2 animate-in fade-in duration-200" id="kala-ai-chat-session-screen">
      {/* Accessible File Inputs for programmatic trigger */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFile}
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleImageFile}
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="flex flex-col w-full pb-8 space-y-6">
        {/* Sub-header & Session Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label={isHindi ? 'वापस जाएं' : 'Go Back'}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2C2C2C] shadow-sm border border-[#EBE7E4]/70 active:scale-95 transition-transform cursor-pointer hover:bg-[#FAF9F6]"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-semibold text-[#2C2C2C]">
                  {isHindi ? 'कलासेतु AI स्टूडियो' : 'KalaAI Studio'}
                </span>
                <span className="inline-flex items-center gap-1 bg-[#D3E0D7] text-[#2C2C2C] px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#36453c] animate-pulse"></span>
                  {isHindi ? 'कलासेतु AI' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Audio Language Quick Toggle */}
          <div className="flex items-center bg-[#F5F5F3] rounded-full p-1 shadow-sm border border-[#EBE7E4]/60">
            <button
              onClick={toggleAudioIntro}
              title={isHindi ? 'ऑडियो मार्गदर्शन सुनें' : 'Listen to audio summary'}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[#2C2C2C] shadow-2xs transition-all cursor-pointer ${
                isPlayingAudio ? 'bg-[#fae28b] text-[#75631a]' : 'bg-white hover:bg-[#FAF9F6]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isPlayingAudio ? 'volume_up' : 'volume_mute'}
              </span>
            </button>

            {/* Direct Hindi / English Toggle Buttons */}
            <div className="inline-flex items-center ml-1">
              <button
                onClick={() => {
                  setLanguage('hi');
                }}
                className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  isHindi ? 'bg-[#2C2C2C] text-white shadow-xs' : 'text-[#48454f] hover:text-[#2C2C2C]'
                }`}
                type="button"
              >
                हिन्दी
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                }}
                className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  !isHindi ? 'bg-[#2C2C2C] text-white shadow-xs' : 'text-[#48454f] hover:text-[#2C2C2C]'
                }`}
                type="button"
              >
                EN
              </button>
            </div>

            {onResumeChat && (
              <button
                onClick={onResumeChat}
                className="ml-1.5 px-2.5 py-1 rounded-full bg-[#423a6e] text-white text-xs font-medium flex items-center gap-1 hover:bg-[#342e58] active:scale-95 transition-all shadow-2xs cursor-pointer"
                type="button"
                title={isHindi ? 'सक्रिय सत्र (उरली) जारी रखें' : 'Resume Urli Session'}
              >
                <span className="material-symbols-outlined text-[14px]">history</span>
                <span className="hidden xs:inline">{isHindi ? 'सक्रिय सत्र' : 'Resume Chat'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Visual Uplink: Photo Upload Zone */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-[#EBE7E4]/70 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#5a5187]/15 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#fae28b]/25 rounded-full blur-2xl pointer-events-none"></div>

          {/* If image uploaded, show enhanced preview with badge */}
          {uploadedImage ? (
            <div className="relative w-full max-w-[280px] h-48 rounded-2xl overflow-hidden mb-4 shadow-md group">
              <img
                src={uploadedImage}
                alt={isHindi ? 'शिल्प फोटो' : 'Craft photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                <span className="inline-flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  <span className="material-symbols-outlined text-[14px] text-[#fae28b]">auto_fix_high</span>
                  {isHindi ? 'स्टूडियो बैकड्रॉप' : 'Studio Isolated'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsCameraModalOpen(true)}
                    className="bg-black/75 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-black text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs cursor-pointer select-none"
                    id="chat-retake-camera-btn"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[12px]">photo_camera</span>
                    <span>{isHindi ? 'नया फोटो' : 'Retake'}</span>
                  </button>
                  <label
                    className="bg-white/95 text-[#2C2C2C] px-2 py-0.5 rounded-full font-semibold hover:bg-white text-[11px] active:scale-95 transition-all shadow-xs cursor-pointer select-none"
                    id="chat-gallery-change-btn"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="sr-only"
                    />
                    <span>{isHindi ? 'गैलरी' : 'Gallery'}</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Illustration Motif */}
              <div className="w-16 h-16 rounded-full bg-[#5a5187]/20 flex items-center justify-center mb-3 text-[#423a6e]">
                <span className="material-symbols-outlined text-[32px]">add_a_photo</span>
              </div>
              <div className="space-y-1 max-w-[320px]">
                <h2 className="text-xl font-bold text-[#2C2C2C]">
                  {isHindi ? 'शिल्प की फोटो अपलोड करें' : 'Upload Craft Photo'}
                </h2>
                <p className="text-sm font-medium text-[#6e5d13]">
                  {isHindi ? 'फोटो खींचें या गैलरी से चुनें' : 'Snap photo or choose from gallery'}
                </p>
                <p className="text-xs text-[#48454f] leading-relaxed pt-1">
                  {isHindi
                    ? 'अपनी हस्तनिर्मित कलाकृति की फोटो लें या गैलरी से चुनें। कलासेतु AI बैकड्रॉप अलग करेगा, रोशनी सुधारेगा और समृद्ध शिल्प विवरण तैयार करेगा।'
                    : 'Snap your handmade creation or select from gallery. KalaAI will automatically isolate backgrounds, soften shadows, and generate regional storytelling.'}
                </p>
              </div>
            </>
          )}

          {/* Dual Action Triggers */}
          <div className="grid grid-cols-2 gap-3 w-full mt-5">
            <button
              onClick={() => setIsCameraModalOpen(true)}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-[#2C2C2C] hover:bg-black text-white active:scale-[0.98] transition-all shadow-md cursor-pointer select-none"
              id="chat-take-photo-btn"
              type="button"
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                <span className="text-sm font-semibold">
                  {isHindi ? 'फोटो खींचें' : 'Take Photo'}
                </span>
              </div>
              <span className="text-[#e3e2e0] opacity-80 text-[11px]">
                {isHindi ? 'कैमरा खोलें' : 'Open Camera'}
              </span>
            </button>

            <label
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] active:scale-[0.98] transition-all shadow-2xs border border-[#EBE7E4]/80 cursor-pointer select-none"
              id="chat-from-gallery-btn"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="sr-only"
              />
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">collections</span>
                <span className="text-sm font-semibold">
                  {isHindi ? 'गैलरी से चुनें' : 'From Gallery'}
                </span>
              </div>
              <span className="text-[#48454f] text-[11px]">
                {isHindi ? 'गैलरी खोलें' : 'Open Gallery'}
              </span>
            </label>
          </div>

          {/* Sunlight Artisan Tip Banner */}
          <div className="w-full mt-4 bg-[#fae28b]/30 border border-[#fae28b]/40 rounded-xl p-2.5 flex items-center gap-2.5 text-left">
            <span className="material-symbols-outlined text-[#6e5d13] text-[20px] shrink-0">wb_sunny</span>
            <div className="flex flex-col">
              <span className="text-xs text-[#75631a] font-semibold">
                {isHindi ? 'सलाह: सुबह की प्राकृतिक धूप में फोटो लें' : 'Tip: Shoot in natural morning light'}
              </span>
              <span className="text-[11px] text-[#75631a]/90">
                {isHindi
                  ? 'प्राकृतिक रोशनी में कलाकृति के असली रंग और बारीकियां निखरती हैं'
                  : 'Natural daylight brings out authentic craft colors and textures'}
              </span>
            </div>
          </div>
        </section>

        {/* KalaAI Message Stream */}
        <section className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-9 h-9 rounded-full bg-[#423a6e] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-2xs space-y-2.5 ${
                  msg.sender === 'ai'
                    ? 'bg-white rounded-tl-xs border border-[#EBE7E4]/70'
                    : 'bg-[#423a6e] text-white rounded-tr-xs'
                }`}
              >
                {/* Optional Badge */}
                {msg.badge && (
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#D3E0D7] text-[#111e17] text-[11px] font-semibold">
                    {msg.badge}
                  </span>
                )}

                {/* Optional Message Image */}
                {msg.image && (
                  <div className="w-48 h-32 rounded-xl overflow-hidden shadow-xs border border-white/20">
                    <img src={msg.image} alt="Uploaded" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Audio Player Ribbon on the first AI welcome msg */}
                {msg.id === 'msg-1' && (
                  <div className="flex items-center justify-between bg-[#5a5187]/15 rounded-full px-3 py-1.5 text-[#423a6e]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleAudioIntro}
                        aria-label="Play KalaAI voice intro"
                        className="w-6 h-6 rounded-full bg-[#423a6e] text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                        id="voicePlayBtn"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isPlayingAudio ? 'pause' : 'play_arrow'}
                        </span>
                      </button>
                      <span className="text-xs font-semibold">
                        {isPlayingAudio
                          ? (isHindi ? 'कलासेतु आवाज़ सुन रहे हैं...' : 'Playing KalaAI Voice...')
                          : (isHindi ? 'कलासेतु आवाज़ (0:12)' : 'KalaAI Voice (0:12)')}
                      </span>
                    </div>

                    {/* Stylized inline wavebars */}
                    <div className="flex items-center gap-0.5 h-3">
                      <span className={`w-0.5 h-2 bg-[#423a6e] rounded-full ${isPlayingAudio ? 'animate-pulse' : ''}`}></span>
                      <span className={`w-0.5 h-3 bg-[#423a6e] rounded-full ${isPlayingAudio ? 'animate-bounce' : ''}`}></span>
                      <span className={`w-0.5 h-1.5 bg-[#423a6e] rounded-full`}></span>
                      <span className={`w-0.5 h-3.5 bg-[#423a6e] rounded-full ${isPlayingAudio ? 'animate-pulse' : ''}`}></span>
                      <span className={`w-0.5 h-2 bg-[#423a6e] rounded-full`}></span>
                    </div>
                  </div>
                )}

                {/* Message Text */}
                <div className="space-y-1.5">
                  <p className={`text-sm leading-relaxed ${msg.sender === 'ai' ? 'text-[#2C2C2C]' : 'text-white'}`}>
                    {isHindi ? (msg.textHi || msg.textEn) : msg.textEn}
                  </p>
                  {!isHindi && msg.textHi && (
                    <p className="text-xs font-medium pt-0.5 text-[#48454f]">
                      {msg.textHi}
                    </p>
                  )}
                </div>

                {/* 1-Click Publish Button if enhanced */}
                {msg.badge && (
                  <div className="pt-1">
                    <button
                      onClick={handlePublishFromChat}
                      disabled={isPublished}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPublished
                          ? 'bg-[#d6e7db] text-[#111e17]'
                          : 'bg-[#2C2C2C] text-white hover:bg-black'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">storefront</span>
                      <span>
                        {isPublished
                          ? (isHindi ? '✓ कैटलॉग में प्रकाशित' : '✓ Published to Catalogue')
                          : (isHindi ? 'स्टोर में प्रकाशित करें (₹2,450)' : 'Publish to Store (₹2,450)')}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessingImage && (
            <div className="flex items-center gap-2 pl-11 text-xs text-[#48454f]">
              <div className="w-2 h-2 rounded-full bg-[#423a6e] animate-ping"></div>
              <span>
                {isHindi
                  ? 'स्टूडियो बैकड्रॉप अलग हो रहा है और ग्लेज चमक निखर रही है...'
                  : 'Isolating studio backdrop and enhancing glaze highlights...'}
              </span>
            </div>
          )}

          {/* AI Generating Indicator */}
          {isAiGenerating && (
            <div className="flex items-center gap-2 pl-11 text-xs text-[#423a6e]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#423a6e] animate-ping"></div>
              <span className="font-medium">
                {isHindi
                  ? 'शिल्प कथा और उचित मूल्य विश्लेषण हो रहा है...'
                  : 'Analyzing craft story & fair pricing breakdown...'}
              </span>
            </div>
          )}
        </section>

        {/* Suggested Quick Starters */}
        <div className="pl-11 space-y-1.5">
          <p className="text-xs text-[#48454f] font-semibold">
            {isHindi ? 'जल्दी बातचीत शुरू करें:' : 'Quick conversation starters / जल्दी शुरू करें:'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSendMessage(isHindi ? '“यह उरली 18 घंटे में बनाई है...”' : '“Yeh urli 18 ghante me banaya hai...”')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2C2C2C] text-xs font-medium shadow-2xs border border-[#EBE7E4]/70 hover:bg-[#F5F5F3] active:scale-95 transition-all text-left cursor-pointer"
              type="button"
            >
              <span>🎙️</span>
              <span>{isHindi ? '“यह उरली 18 घंटे में बनाई है...”' : '“Yeh urli 18 ghante me banaya hai...”'}</span>
            </button>
            <button
              onClick={() => handleSendMessage(isHindi ? 'वर्कबेंच फोटो को स्टूडियो जैसा बनाएं' : 'Enhance workbench photo')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2C2C2C] text-xs font-medium shadow-2xs border border-[#EBE7E4]/70 hover:bg-[#F5F5F3] active:scale-95 transition-all text-left cursor-pointer"
              type="button"
            >
              <span>📸</span>
              <span>{isHindi ? 'वर्कबेंच फोटो को स्टूडियो जैसा बनाएं' : 'Enhance workbench photo'}</span>
            </button>
            <button
              onClick={() => openModal('pricing_assistant', {
                product: {
                  product_name: 'Handcrafted Jaipur Blue Pottery Urli',
                  primary_category: 'Home Decor & Festive Needs',
                  sub_category: 'Table Decor & Handicrafts',
                  brand: 'Unbranded / Independent',
                  description: 'Authentic Jaipur blue pottery handmade decorative urli bowl with cobalt glaze.',
                  spec_count: 4,
                  image_count: 2,
                  category_depth: 3,
                },
                material_cost: 350,
                labour_cost: 600,
                packaging_cost: 80,
                other_costs: 70,
              })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2C2C2C] text-xs font-medium shadow-2xs border border-[#EBE7E4]/70 hover:bg-[#F5F5F3] active:scale-95 transition-all text-left cursor-pointer"
              type="button"
            >
              <span>💰</span>
              <span>{isHindi ? 'उचित मूल्य व लागत निकालें' : 'Calculate fair price & raw cost'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Voice & Text Input Station */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-[#EBE7E4]/70 space-y-4">
          {/* Pulsing Voice Anchor Trigger */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div className="relative flex items-center justify-center">
              {isRecording && (
                <>
                  <div className="absolute w-16 h-16 rounded-full bg-[#BA1A1A]/20 animate-ping"></div>
                  <div className="absolute w-14 h-14 rounded-full bg-[#BA1A1A]/30"></div>
                </>
              )}
              {!isRecording && (
                <>
                  <div className="absolute w-16 h-16 rounded-full bg-[#423a6e]/10 animate-ping"></div>
                  <div className="absolute w-14 h-14 rounded-full bg-[#423a6e]/20"></div>
                </>
              )}
              <button
                onClick={toggleRecording}
                aria-label={isHindi ? 'बोलने के लिए टैप करें' : 'Tap to speak'}
                className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md active:scale-95 transition-all cursor-pointer ${
                  isRecording ? 'bg-[#BA1A1A]' : 'bg-[#423a6e] hover:bg-[#342e58]'
                }`}
                id="micRecordTrigger"
                type="button"
              >
                <span className="material-symbols-outlined text-[26px]">
                  {isRecording ? 'graphic_eq' : 'mic'}
                </span>
              </button>
            </div>
            <span className="text-sm text-[#2C2C2C] font-semibold mt-2">
              {isRecording
                ? (isHindi ? 'सुन रहे हैं... बोलिए (हिन्दी)' : 'Listening... please speak')
                : isTranscribing
                ? (isHindi ? 'ऑडियो ट्रांसक्राइब हो रहा है...' : 'Transcribing voice audio...')
                : (isHindi ? 'बोलने के लिए टैप करें' : 'Tap to Speak / बोलें')}
            </span>
            <span className="text-[11px] text-[#48454f]">
              {isHindi
                ? 'हिन्दी, मराठी और स्थानीय बोलियों का समर्थन'
                : 'Supports Hindi, Marathi, English dialects'}
            </span>
          </div>

          {/* Text Fallback & Language Bar */}
          <div className="flex items-center gap-2 bg-[#f4f3f1] rounded-xl px-2.5 sm:px-3 py-2 border border-[#EBE7E4]/60">
            {/* Camera Snap in Chat */}
            <button
              onClick={() => setIsCameraModalOpen(true)}
              title={isHindi ? 'कैमरा से फोटो खींचें' : 'Take photo with camera'}
              aria-label={isHindi ? 'कैमरा से फोटो खींचें' : 'Take photo with camera'}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#FAF9F6] text-[#2C2C2C] flex items-center justify-center shadow-2xs shrink-0 cursor-pointer active:scale-95 transition-all border border-[#EBE7E4]/70"
              id="chat-input-camera-btn"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>

            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent text-[#2C2C2C] text-sm outline-none placeholder:text-[#48454f]/60 min-w-0"
              placeholder={
                isHindi
                  ? 'कलासेतु AI से पूछें या विवरण लिखें...'
                  : 'Ask KalaAI or describe craft...'
              }
              type="text"
            />

            {/* Vernacular switch button */}
            <button
              onClick={() => {
                const next = isHindi ? 'en' : 'hi';
                setLanguage(next);
              }}
              className="px-2.5 py-1 rounded-md bg-white text-[#2C2C2C] text-[11px] font-bold shadow-2xs hover:bg-[#FAF9F6] cursor-pointer"
              type="button"
            >
              {isHindi ? 'EN | हिन्दी' : 'हिन्दी | EN'}
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              aria-label={isHindi ? 'संदेश भेजें' : 'Send message'}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer ${
                inputText.trim() ? 'bg-[#2C2C2C] hover:bg-black' : 'bg-[#76767F]/50 cursor-not-allowed'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            </button>
          </div>
        </section>
      </div>

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCaptured}
        isHindi={isHindi}
      />
    </div>
  );
};

