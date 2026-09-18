import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { CameraModal } from '../common/CameraModal';
import { ActiveSessionHistoryScreen } from './ActiveSessionHistoryScreen';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { generateStudioCraftImage, removeProductBackground, validateProductImage, ImageValidationResult } from '../../services/aiService';
import { applyStudioLightingFilter } from '../../utils/imageEnhance';
import { compressAndResizeImage } from '../../utils/imageCompress';
import {
  generateProductDetailsWithAi,
  refineProductWithAi,
  GeneratedProductDetails,
} from '../../services/aiProductGenerator';
import {
  Camera,
  Image as ImageIcon,
  Sparkles,
  Mic,
  Square,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Send,
  MessageSquare,
  IndianRupee,
  Package,
  ChevronRight,
  ArrowLeft,
  Wand2,
  Eye,
  Plus,
  Minus,
} from 'lucide-react';

interface UploadProductScreenProps {
  onBack?: () => void;
}

export const UploadProductScreen: React.FC<UploadProductScreenProps> = ({ onBack }) => {
  const {
    openModal,
    addNewProduct,
    setActiveTab,
    showToast,
    language,
    products,
    t,
    getOrInitAuthSession,
  } = useApp();
  const isHindi = language === 'hi';

  // Navigation mode: 'publish_workflow' or 'active_history'
  const [currentView, setCurrentView] = useState<'publish_workflow' | 'active_history'>('publish_workflow');

  // STEP 1 — Photo state
  const [photo, setPhoto] = useState<string | null>(null);
  const [enhancedPhoto, setEnhancedPhoto] = useState<string | null>(null);
  const [isEnhancingPhoto, setIsEnhancingPhoto] = useState<boolean>(false);
  const [showEnhancedView, setShowEnhancedView] = useState<boolean>(true);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 2 — Describe state
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);
  const [confirmedDescription, setConfirmedDescription] = useState<string>('');
  const [inputMode, setInputMode] = useState<'speak' | 'type'>('speak');

  // Voice hook integration
  const {
    isRecording,
    isTranscribing,
    error: voiceError,
    startRecording,
    stopRecording,
  } = useVoiceInput({
    language,
    onTranscript: (spokenText) => {
      setTranscript(spokenText);
      setDescriptionInput(spokenText);
      setIsEditingTranscript(false);
    },
    onError: (err) => {
      showToast(err, 'warning');
    },
  });

  // AI Product Details state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [productDetails, setProductDetails] = useState<GeneratedProductDetails | null>(null);
  const [talkToAiPrompt, setTalkToAiPrompt] = useState<string>('');
  const [isRefiningWithAi, setIsRefiningWithAi] = useState<boolean>(false);
  const [showTalkToAi, setShowTalkToAi] = useState<boolean>(false);

  // STEP 3 — Pricing state
  const [price, setPrice] = useState<number>(2450);
  const [mrp, setMrp] = useState<number>(3200);
  const [marketEstimate, setMarketEstimate] = useState<number>(2600);
  const [minimumViablePrice, setMinimumViablePrice] = useState<number>(1850);

  // STEP 4 — Stock & Publish state
  const [stockCount, setStockCount] = useState<number>(5);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishedSku, setPublishedSku] = useState<string>('');

  // Image Validation State (Image -> Validate -> AI generation -> Publish)
  const [isValidatingImage, setIsValidatingImage] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAiGenerationFailed, setIsAiGenerationFailed] = useState<boolean>(false);

  const defaultValidationMessage = isHindi
    ? 'कृपया एक स्पष्ट उत्पाद-केंद्रित फोटो अपलोड करें।'
    : 'Please upload a clear product-focused image.';

  const isImageValid = Boolean(photo && validationResult?.isValid);
  const hasAiDetails = Boolean(productDetails && !isAiGenerationFailed);
  const canPublish = Boolean(
    photo &&
    isImageValid &&
    hasAiDetails &&
    !isValidatingImage &&
    !isGeneratingAi &&
    !isPublishing
  );

  // Sample Saved Draft for "Resume Draft" feature
  const savedDraftUrli = {
    title: isHindi
      ? 'हस्तनिर्मित जयपुर ब्लू पॉटरी फ्लोरल उरली'
      : 'Handcrafted Jaipur Blue Pottery Floral Urli',
    image:
      'https://lh3.googleusercontent.com/aida/AEtjO1W3uM1cxnqtfFk9N_bQfOzrX-ed_0Pe7OslSZcDq4lCQeAWXTyeBXz5rEK2wAFHwTIAT2_TIVpNLCXZzBcv-JuG-_HwcBopit92Rr-ApMGWiczd4fRKO7WTvEDp3Q6ulFMBnFZvHtihAL-SIaoK3TALar3PY5_NUOBWhss_UCXjMeVrClY15j18tZHn46t8lLuyZZZNd59CgsUbdwsxTTchleHl7-dxLDGvLzyCU_da7ou38XpbDzMyEkA',
    stock: 8,
    category: isHindi ? 'जयपुर ब्लू पॉटरी' : 'Jaipur Blue Pottery',
  };

  // Switch to saved draft history if requested
  if (currentView === 'active_history') {
    return <ActiveSessionHistoryScreen onBack={() => setCurrentView('publish_workflow')} />;
  }

  // Reset validation and product states when image is updated, replaced, or removed
  const resetImageValidationAndAi = () => {
    setValidationResult(null);
    setValidationError(null);
    setProductDetails(null);
    setIsAiGenerationFailed(false);
    setIsPublished(false);
  };

  // Process new or replaced image: Image -> Validate -> AI generation -> Publish
  const handleProcessNewImage = async (rawUrl: string) => {
    // Compress and resize image to WebP (max 1200px) to drastically reduce upload egress
    const dataUrl = await compressAndResizeImage(rawUrl, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.85,
      format: 'image/webp',
    });

    setPhoto(dataUrl);
    setEnhancedPhoto(null);
    setShowEnhancedView(false);
    resetImageValidationAndAi();

    // Step 1: Validate image
    setIsValidatingImage(true);
    try {
      const result = await validateProductImage({
        image: dataUrl,
        language: isHindi ? 'hi' : 'en',
      });

      setValidationResult(result);

      if (!result.isValid) {
        const errorMsg = result.userMessage || defaultValidationMessage;
        setValidationError(errorMsg);
        showToast(errorMsg, 'error');
        return;
      }

      // Step 2: Image is valid! Trigger AI generation
      setValidationError(null);
      await handleGenerateAiDetails(
        confirmedDescription || descriptionInput || transcript,
        dataUrl,
        result
      );
    } catch (err: any) {
      setValidationError(defaultValidationMessage);
      showToast(defaultValidationMessage, 'error');
    } finally {
      setIsValidatingImage(false);
    }
  };

  // Handle Photo Capture from camera
  const handleCameraCapture = (dataUrl: string) => {
    setIsCameraModalOpen(false);
    handleProcessNewImage(dataUrl);
  };

  // Handle Gallery Upload from file input
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          handleProcessNewImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handle Photo Removal
  const handleRemovePhoto = () => {
    setPhoto(null);
    setEnhancedPhoto(null);
    resetImageValidationAndAi();
  };

  // Handle Background Removal via remove.bg HTTP API (transparent PNG)
  const handleImprovePhoto = async () => {
    if (!photo) return;
    setIsEnhancingPhoto(true);

    try {
      const session = await getOrInitAuthSession();
      const res = await removeProductBackground({
        image: photo,
        authToken: session?.token,
      });

      if (res.success && (res.imageUrl || res.dataUrl)) {
        const processedUrl = res.imageUrl || res.dataUrl!;
        setEnhancedPhoto(processedUrl);
        setShowEnhancedView(true);
        showToast(
          isHindi ? 'बैकग्राउंड सफलतापूर्वक हटा दिया गया!' : 'Background removed successfully (remove.bg)!',
          'success'
        );
      } else {
        const errorMsg =
          res.error ||
          (isHindi ? 'बैकग्राउंड हटाने में विफल' : 'Background removal failed. Please check REMOVE_BG_API_KEY.');
        showToast(errorMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Background removal failed. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsEnhancingPhoto(false);
    }
  };

  // Handle Confirming Description
  const handleConfirmDescription = () => {
    const textToUse = (transcript || descriptionInput).trim();
    if (!textToUse) {
      showToast(t('step2DescSubtitle'), 'warning');
      return;
    }
    setConfirmedDescription(textToUse);

    if (!photo || !validationResult?.isValid) {
      const errorMsg = validationError || defaultValidationMessage;
      showToast(errorMsg, 'warning');
      return;
    }

    handleGenerateAiDetails(textToUse);
  };

  // Handle Generating Product Details with AI (Validate -> AI generation -> Publish)
  const handleGenerateAiDetails = async (
    descText?: string,
    targetPhoto?: string | null,
    validResult?: ImageValidationResult | null
  ) => {
    const activePhoto = targetPhoto || enhancedPhoto || photo;
    const vResult = validResult || validationResult;

    if (!activePhoto) {
      showToast(t('step1PhotoDesc'), 'warning');
      return;
    }

    // Must be valid product image before AI generation
    if (vResult && !vResult.isValid) {
      const errorMsg = vResult.userMessage || defaultValidationMessage;
      setValidationError(errorMsg);
      showToast(errorMsg, 'error');
      return;
    }

    setIsGeneratingAi(true);
    setIsAiGenerationFailed(false);
    try {
      const userText = descText || confirmedDescription || descriptionInput || transcript;
      const craftHint = vResult?.productIdentified || '';
      const finalPrompt = userText.trim()
        ? `${userText} ${craftHint ? `(${craftHint})` : ''}`
        : craftHint || 'Traditional authentic Indian handicraft';

      const generated = await generateProductDetailsWithAi({
        image: activePhoto,
        description: finalPrompt,
        language: isHindi ? 'hi' : 'en',
        identifiedProduct: vResult?.productIdentified,
        craftCategory: vResult?.craftCategory,
      });

      if (!generated || !generated.title || generated.qualityCheck?.passed === false) {
        throw new Error(defaultValidationMessage);
      }

      setProductDetails(generated);
      setIsAiGenerationFailed(false);
      setValidationError(null);
      showToast(isHindi ? 'AI ने शिल्प विवरण तैयार किया!' : 'AI generated craft details!', 'success');
    } catch (err: any) {
      console.warn('[AI Details] Generation failed:', err);
      setProductDetails(null);
      setIsAiGenerationFailed(true);
      const errMsg = err?.message || defaultValidationMessage;
      setValidationError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle "Talk to AI" detail refinement
  const handleRefineWithAi = async () => {
    if (!talkToAiPrompt.trim() || !productDetails) return;
    setIsRefiningWithAi(true);

    try {
      const updated = await refineProductWithAi({
        currentDetails: productDetails,
        userInstruction: talkToAiPrompt.trim(),
        language: isHindi ? 'hi' : 'en',
      });
      setProductDetails(updated);
      setTalkToAiPrompt('');
      showToast(isHindi ? 'AI ने विवरण अपडेट कर दिया!' : 'AI updated your craft details!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not update details. Please retry.', 'error');
    } finally {
      setIsRefiningWithAi(false);
    }
  };

  // Handle Opening Pricing Assistant Modal
  const handleOpenPricingAssistant = () => {
    const activeTitle = productDetails?.title || confirmedDescription || descriptionInput;
    
    if (!activeTitle && !photo) {
      openModal('pricing_assistant', {
        product: {
          product_name: 'PRICING_PRODUCT_CONTEXT_MISSING',
          primary_category: '',
          sub_category: '',
          brand: 'Unbranded / Independent',
          description: '',
          spec_count: 0,
          image_count: 0,
          category_depth: 3,
        },
      });
      return;
    }

    const productPayload = {
      product_name: activeTitle || (isHindi ? 'हस्तनिर्मित भारतीय शिल्प' : 'Handcrafted Artisan Craft'),
      primary_category: productDetails?.categoryLabel || (isHindi ? 'हस्तशिल्प' : 'Handicrafts'),
      sub_category: productDetails?.subCategory || (isHindi ? 'कलाकृति' : 'Artisan Goods'),
      brand: 'Unbranded / Independent',
      description: productDetails?.description || confirmedDescription || descriptionInput || '',
      spec_count: productDetails?.specifications?.length || 3,
      image_count: photo ? 1 : 0,
      category_depth: 3,
    };

    openModal('pricing_assistant', {
      product: productPayload,
      onApplyPrice: (recommendedPrice: number) => {
        setPrice(recommendedPrice);
        setMrp(Math.round(recommendedPrice * 1.3));
        setMarketEstimate(Math.round(recommendedPrice * 1.05));
        setMinimumViablePrice(Math.round(recommendedPrice * 0.75));
      },
    });
  };

  // Handle Final Publish
  const handlePublish = async () => {
    if (!canPublish) {
      const errorMsg = validationError || defaultValidationMessage;
      showToast(errorMsg, 'error');
      return;
    }

    if (!photo || !validationResult?.isValid || !productDetails || isAiGenerationFailed) {
      showToast(defaultValidationMessage, 'error');
      return;
    }

    setIsPublishing(true);
    const skuCode = `KALA-${Date.now().toString().slice(-5)}`;
    setPublishedSku(skuCode);

    const activeTitle = productDetails.title;
    const activeCategory = (productDetails.category || 'pottery') as any;
    const activePhoto = showEnhancedView && enhancedPhoto ? enhancedPhoto : photo;

    const newCraft: Omit<Product, 'id'> = {
      sku: skuCode,
      title: {
        en: activeTitle,
        hi: activeTitle,
      },
      category: activeCategory,
      categoryLabel: {
        en: productDetails?.categoryLabel || 'Handmade Craft',
        hi: productDetails?.categoryLabel || 'हस्तनिर्मित शिल्प',
      },
      price: price,
      mrp: mrp,
      discountPercent: Math.round(((mrp - price) / mrp) * 100),
      inStock: true,
      stockCount: stockCount,
      views: 1,
      sold: 0,
      isLowStock: false,
      imageUrl: activePhoto,
      altText: activeTitle,
      tags: productDetails?.tags || ['handcrafted', 'artisan', 'indian-craft'],
      giCertified: true,
      isGiCertified: true,
      dimensions: productDetails?.dimensions || '10" x 4"',
      materials: productDetails?.materials || ['Traditional Materials'],
      craftStory: {
        en: productDetails?.description || confirmedDescription || 'Authentic handcrafted traditional artwork with GI heritage craftsmanship.',
        hi: productDetails?.description || confirmedDescription || 'पारंपरिक भारतीय हस्तकला द्वारा निर्मित प्रामाणिक कृति।',
        historicalOrigin: productDetails?.categoryLabel || 'India',
        techniques: productDetails?.specifications || ['Master Handcrafted'],
        fairWageShare: 88,
      },
      bulkTier: {
        minUnits: 5,
        minQty: 5,
        pricePerUnit: Math.round(price * 0.82),
        leadTimeDays: 7,
        maxCapacityPerMonth: 50,
      },
    };

    const productImagesToSave: Array<{
      image_url: string;
      image_type: 'original' | 'enhanced';
      is_primary?: boolean;
    }> = [];

    if (photo) {
      productImagesToSave.push({
        image_url: photo,
        image_type: 'original',
        is_primary: !enhancedPhoto,
      });
    }

    if (enhancedPhoto) {
      productImagesToSave.push({
        image_url: enhancedPhoto,
        image_type: 'enhanced',
        is_primary: true,
      });
    }

    try {
      await addNewProduct(newCraft, {
        images: productImagesToSave,
        pricing: {
          cost_breakdown: {
            raw_materials: Math.round(price * 0.3),
            crafting_hours: 4,
            fair_hourly_wage: Math.round((price * 0.4) / 4),
            marketplace_fee: Math.round(price * 0.05),
            logistics: Math.round(price * 0.08),
          },
          fair_price: price,
          market_estimate: marketEstimate || Math.round(price * 1.05),
          mrp: mrp,
          confidence_score: 0.95,
        },
        marketplace_listings: [
          {
            platform: 'artisan_direct',
            title: activeTitle,
            description: productDetails?.description || confirmedDescription || '',
            price: price,
            status: 'published',
          },
        ],
        status: 'published',
      });

      setIsPublished(true);
      showToast(t('publishedSuccessMsg'), 'success');
    } catch (err: any) {
      showToast(err?.message || 'Error publishing product to database', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Reset workflow for new item
  const handleResetForNewProduct = () => {
    setPhoto(null);
    setEnhancedPhoto(null);
    setDescriptionInput('');
    setTranscript('');
    setConfirmedDescription('');
    setProductDetails(null);
    setIsPublished(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C2C2C] pb-32">
      {/* Hidden File Input for Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryUpload}
      />

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DF]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (onBack ? onBack() : setActiveTab('catalogue'))}
              className="p-2 rounded-xl bg-white border border-[#E8E4DF] text-[#55524E] hover:bg-[#F2EFE9] transition-colors"
              aria-label={t('backToCrafts')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1A2D]">
                {t('publishProductTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-[#736F6A]">
                {t('publishProductSubtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Successful Published Confirmation Card */}
        {isPublished ? (
          <div className="mt-6 bg-white rounded-2xl border-2 border-[#5A5187]/20 p-6 sm:p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#EBE7FF] text-[#5A5187] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#1E1A2D]">
              {t('publishedSuccessTitle')}
            </h2>
            <p className="text-sm text-[#736F6A] mt-1 max-w-md mx-auto">
              {t('publishedSuccessMsg')}
            </p>
            <div className="mt-4 p-3 bg-[#FAF9F6] rounded-xl border border-[#E8E4DF] max-w-xs mx-auto text-xs text-[#55524E]">
              <span className="font-mono font-bold">SKU: {publishedSku}</span>
              <span className="mx-2">•</span>
              <span className="text-emerald-700 font-bold">₹{price.toLocaleString()}</span>
              <span className="mx-2">•</span>
              <span>{stockCount} {t('units')}</span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setActiveTab('catalogue')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#5A5187] text-white font-semibold text-sm hover:bg-[#483F73] transition-colors flex items-center justify-center gap-2"
              >
                <span>{t('viewInCatalogueBtn')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetForNewProduct}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#E8E4DF] text-[#55524E] font-semibold text-sm hover:bg-[#F2EFE9] transition-colors"
              >
                {t('publishAnotherBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* LINEAR PUBLISHING WORKFLOW */
          <div className="mt-6 space-y-6">
            {/* ========================================================== */}
            {/* STEP 1 — ADD A PHOTO */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1A2D] flex items-center gap-2">
                    <span>{t('step1PhotoTitle')}</span>
                    {photo && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#736F6A] mt-0.5">
                    {t('step1PhotoDesc')}
                  </p>
                </div>
              </div>

              {!photo ? (
                <div className="mt-4">
                  {/* Photo Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setIsCameraModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#5A5187] text-white font-semibold text-sm hover:bg-[#483F73] transition-all shadow-xs cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>{t('takePhotoBtn')}</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white border border-[#D5D0CA] text-[#1E1A2D] font-semibold text-sm hover:bg-[#F7F5F2] transition-all cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5 text-[#5A5187]" />
                      <span>{t('chooseGalleryBtn')}</span>
                    </button>
                  </div>

                  {/* Visual Dropzone Hint */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 border-2 border-dashed border-[#DDD8D1] rounded-xl p-6 text-center cursor-pointer hover:border-[#5A5187] hover:bg-[#FAF9F6] transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-[#A8A49E] mx-auto mb-2" />
                    <p className="text-xs text-[#736F6A]">
                      {isHindi
                        ? 'अच्छी रोशनी में अपने शिल्प की स्पष्ट फोटो लें'
                        : 'Capture craft in clear lighting for optimal AI cataloging'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {/* Image Preview Card */}
                  <div className="relative rounded-xl overflow-hidden border border-[#E8E4DF] bg-[#F2EFE9] max-h-80 flex items-center justify-center">
                    <img
                      src={showEnhancedView && enhancedPhoto ? enhancedPhoto : photo}
                      alt="Product Craft"
                      className="w-full h-72 object-contain bg-[#F8F7F4]"
                    />

                    {/* Enhanced Badge */}
                    {enhancedPhoto && (
                      <div className="absolute top-3 left-3">
                        <button
                          onClick={() => setShowEnhancedView(!showEnhancedView)}
                          className="px-3 py-1 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {showEnhancedView ? t('enhancedPhotoLabel') : t('originalPhotoLabel')}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Photo Actions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleImprovePhoto}
                        disabled={isEnhancingPhoto}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EBE7FF] text-[#5A5187] text-xs font-bold hover:bg-[#DDD7FF] transition-colors disabled:opacity-50"
                      >
                        {isEnhancingPhoto ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('improvingPhotoLoading')}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{t('improvePhotoBtn')}</span>
                          </>
                        )}
                      </button>

                      {enhancedPhoto && (
                        <button
                          onClick={() => setShowEnhancedView(!showEnhancedView)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E8E4DF] text-xs font-semibold text-[#55524E] hover:bg-[#F2EFE9]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{showEnhancedView ? 'View Raw' : 'View Enhanced'}</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#E8E4DF] text-xs font-semibold text-[#55524E] hover:bg-[#F2EFE9] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('replacePhoto')}</span>
                      </button>
                      <button
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('removePhoto')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Image Validation & Processing Status Indicator */}
                  {isValidatingImage && (
                    <div className="mt-3 p-3 rounded-xl bg-[#EBE7FF] border border-[#C5BEFF] text-xs text-[#5A5187] font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{isHindi ? 'शिल्प फोटो का सत्यापन हो रहा है...' : 'Validating craft photo...'}</span>
                    </div>
                  )}

                  {validationResult && !validationResult.isValid && (
                    <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-red-800">
                          {isHindi ? 'अमान्य उत्पाद फोटो' : 'Invalid Product Photo'}
                        </h4>
                        <p className="text-xs text-red-700 font-semibold mt-0.5">
                          {validationError || defaultValidationMessage}
                        </p>
                        {validationResult.reason && (
                          <p className="text-[11px] text-red-600/90 mt-1">
                            {validationResult.reason}
                          </p>
                        )}
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => setIsCameraModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            {isHindi ? 'दूसरी फोटो लें' : 'Take New Photo'}
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-800 text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            {isHindi ? 'गैलरी से चुनें' : 'Choose from Gallery'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationResult && validationResult.isValid && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {validationResult.productIdentified
                            ? (isHindi ? `शिल्प पहचाना गया: ${validationResult.productIdentified}` : `Verified Craft: ${validationResult.productIdentified}`)
                            : (isHindi ? 'उत्पाद फोटो सत्यापित' : 'Product image verified')}
                          {validationResult.hasHuman && (
                            <span className="ml-1 font-normal text-emerald-700">
                              ({isHindi ? 'शिल्पकार एवं उत्पाद' : 'Artisan with craft'})
                            </span>
                          )}
                        </span>
                      </div>
                      {isGeneratingAi && (
                        <span className="text-[11px] text-[#5A5187] font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {isHindi ? 'AI विवरण तैयार हो रहा है...' : 'Generating AI details...'}
                        </span>
                      )}
                    </div>
                  )}

                  {isAiGenerationFailed && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          {defaultValidationMessage}
                        </p>
                        <p className="text-[11px] text-red-600 mt-0.5">
                          {isHindi ? 'AI इस फोटो से उत्पाद विवरण तैयार करने में असमर्थ रहा।' : 'AI could not identify or generate product details from this image.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ========================================================== */}
            {/* STEP 2 — DESCRIBE YOUR CRAFT */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 sm:p-6 shadow-xs">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1E1A2D] flex items-center gap-2">
                  <span>{t('step2DescTitle')}</span>
                  {(confirmedDescription || productDetails) && (
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-[#736F6A] mt-0.5">
                  {t('step2DescSubtitle')}
                </p>
              </div>

              {/* Mode Toggle: Speak vs Type */}
              <div className="mt-4 flex items-center gap-2 p-1 bg-[#FAF9F6] border border-[#E8E4DF] rounded-xl w-fit">
                <button
                  onClick={() => setInputMode('speak')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'speak'
                      ? 'bg-[#5A5187] text-white shadow-xs'
                      : 'text-[#736F6A] hover:text-[#1E1A2D]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{t('speakBtn')}</span>
                </button>
                <button
                  onClick={() => setInputMode('type')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'type'
                      ? 'bg-[#5A5187] text-white shadow-xs'
                      : 'text-[#736F6A] hover:text-[#1E1A2D]'
                  }`}
                >
                  <span>{t('typeBtn')}</span>
                </button>
              </div>

              {/* Speak Mode Interface */}
              {inputMode === 'speak' ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        disabled={isTranscribing}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#5A5187] text-white font-semibold text-sm hover:bg-[#483F73] transition-all shadow-xs cursor-pointer"
                      >
                        <Mic className="w-5 h-5" />
                        <span>{t('speakBtn')} (बोलें)</span>
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-all animate-pulse"
                      >
                        <Square className="w-5 h-5" />
                        <span>{t('stopRecording')}</span>
                      </button>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {isRecording && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                      <span>{t('listeningVoice')}</span>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="p-3 bg-[#EBE7FF] border border-[#C5BEFF] rounded-xl text-xs text-[#5A5187] font-medium flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('transcribingVoice')}</span>
                    </div>
                  )}

                  {voiceError && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{voiceError}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Type Mode Interface */
                <div className="mt-4">
                  <textarea
                    rows={3}
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder={t('typeDescriptionPlaceholder')}
                    className="w-full p-3 rounded-xl border border-[#D5D0CA] bg-white text-sm text-[#1E1A2D] placeholder-[#A8A49E] focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                  />
                </div>
              )}

              {/* TRANSCRIPT / DESCRIPTION REVIEW BOX */}
              {(transcript || descriptionInput) && (
                <div className="mt-4 p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#736F6A]">
                    <span>{t('youSaid')}</span>
                    <button
                      onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                      className="text-[#5A5187] hover:underline"
                    >
                      {isEditingTranscript ? t('saveTranscript') : t('editTranscript')}
                    </button>
                  </div>

                  {isEditingTranscript ? (
                    <textarea
                      rows={3}
                      value={transcript || descriptionInput}
                      onChange={(e) => {
                        setTranscript(e.target.value);
                        setDescriptionInput(e.target.value);
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#D5D0CA] bg-white text-sm text-[#1E1A2D] focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  ) : (
                    <p className="text-sm text-[#1E1A2D] leading-relaxed font-medium">
                      "{transcript || descriptionInput}"
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={handleConfirmDescription}
                      disabled={isGeneratingAi}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5A5187] text-white text-xs font-bold hover:bg-[#483F73] transition-colors disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{t('generatingAiDetails')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('useDescription')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* ========================================================== */}
            {/* AI PRODUCT DETAILS (REVIEW & EDIT) */}
            {/* ========================================================== */}
            {productDetails && (
              <section className="bg-white rounded-2xl border-2 border-[#5A5187]/20 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#1E1A2D] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#5A5187]" />
                      <span>{t('aiProductDetailsTitle')}</span>
                    </h2>
                    <p className="text-xs text-[#736F6A] mt-0.5">
                      {t('aiProductDetailsSubtitle')}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowTalkToAi(!showTalkToAi)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EBE7FF] text-[#5A5187] text-xs font-bold hover:bg-[#DDD7FF] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('talkToAiBtn')}</span>
                  </button>
                </div>

                {/* Talk To AI Assistant (Collapsible / Inline) */}
                {showTalkToAi && (
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#C5BEFF] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5A5187] flex items-center gap-1">
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{t('talkToAiBtn')}</span>
                      </span>
                      <span className="text-[11px] text-[#736F6A]">
                        {t('talkToAiSubtitle')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={talkToAiPrompt}
                        onChange={(e) => setTalkToAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRefineWithAi();
                        }}
                        placeholder={t('talkToAiPlaceholder')}
                        className="flex-1 p-2.5 rounded-lg border border-[#D5D0CA] bg-white text-xs text-[#1E1A2D] focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                      />
                      <button
                        onClick={handleRefineWithAi}
                        disabled={isRefiningWithAi || !talkToAiPrompt.trim()}
                        className="px-3.5 py-2.5 rounded-lg bg-[#5A5187] text-white text-xs font-bold hover:bg-[#483F73] transition-colors disabled:opacity-50"
                      >
                        {isRefiningWithAi ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Editable Product Detail Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('productTitleLabel')}
                    </label>
                    <input
                      type="text"
                      value={productDetails.title}
                      onChange={(e) =>
                        setProductDetails({ ...productDetails, title: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-sm text-[#1E1A2D] font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('categoryLabel')}
                    </label>
                    <input
                      type="text"
                      value={productDetails.categoryLabel}
                      onChange={(e) =>
                        setProductDetails({
                          ...productDetails,
                          categoryLabel: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-xs text-[#1E1A2D] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('subCategoryLabel')}
                    </label>
                    <input
                      type="text"
                      value={productDetails.subCategory}
                      onChange={(e) =>
                        setProductDetails({
                          ...productDetails,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-xs text-[#1E1A2D] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('materialLabel')}
                    </label>
                    <input
                      type="text"
                      value={productDetails.materials.join(', ')}
                      onChange={(e) =>
                        setProductDetails({
                          ...productDetails,
                          materials: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-xs text-[#1E1A2D] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('tagsLabel')}
                    </label>
                    <input
                      type="text"
                      value={productDetails.tags.join(', ')}
                      onChange={(e) =>
                        setProductDetails({
                          ...productDetails,
                          tags: e.target.value.split(',').map((s) => s.trim()),
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-xs text-[#1E1A2D] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#55524E] mb-1">
                      {t('craftStoryDescLabel')}
                    </label>
                    <textarea
                      rows={3}
                      value={productDetails.description}
                      onChange={(e) =>
                        setProductDetails({
                          ...productDetails,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#D5D0CA] bg-[#FAF9F6] text-xs text-[#1E1A2D] leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5A5187]"
                    />
                  </div>
                </div>

                {/* AI Quality Check Verification Box */}
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">
                      {t('aiQualityCheckTitle')}
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {productDetails.qualityCheck?.message || t('aiQualityReady')}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* ========================================================== */}
            {/* STEP 3 — FAIR PRICE */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#1E1A2D] flex items-center gap-2">
                    <span>{t('step3FairPriceTitle')}</span>
                    {price > 0 && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#736F6A] mt-0.5">
                    {t('step3FairPriceDesc')}
                  </p>
                </div>
              </div>

              {/* Price Metric Breakdown Card */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Applied Price */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border-2 border-[#5A5187]/30 text-center">
                  <div className="text-xs font-bold text-[#5A5187] uppercase tracking-wider">
                    {t('priceSet')}
                  </div>
                  <div className="text-2xl font-bold text-[#1E1A2D] mt-1 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                    <span>{price.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                    {t('recommendedPrice')}
                  </div>
                </div>

                {/* Market Estimate */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] text-center">
                  <div className="text-xs font-semibold text-[#736F6A]">
                    {t('marketEstimate')}
                  </div>
                  <div className="text-xl font-bold text-[#55524E] mt-1 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                    <span>{marketEstimate.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-[#A8A49E] mt-0.5">
                    Flipkart E-Commerce Model
                  </div>
                </div>

                {/* Minimum Viable Price */}
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] text-center">
                  <div className="text-xs font-semibold text-[#736F6A]">
                    {t('minimumViablePrice')}
                  </div>
                  <div className="text-xl font-bold text-[#55524E] mt-1 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                    <span>{minimumViablePrice.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-[#A8A49E] mt-0.5">
                    Cost + 25% Wage Floor
                  </div>
                </div>
              </div>

              {/* Action: Open Pricing Assistant Modal */}
              <div className="mt-4">
                <button
                  onClick={handleOpenPricingAssistant}
                  className="w-full py-3 px-4 rounded-xl bg-[#FAF9F6] border border-[#5A5187] text-[#5A5187] font-bold text-xs hover:bg-[#EBE7FF] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>{t('openPricingAssistantBtn')}</span>
                </button>
              </div>
            </section>

            {/* ========================================================== */}
            {/* STEP 4 — FINAL REVIEW & PUBLISH */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1E1A2D]">
                  {t('step4ReviewPublishTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-[#736F6A] mt-0.5">
                  {t('step4ReviewPublishSubtitle')}
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] flex flex-col sm:flex-row items-center gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-white border border-[#E8E4DF] shrink-0">
                  {photo ? (
                    <img
                      src={showEnhancedView && enhancedPhoto ? enhancedPhoto : photo}
                      alt="Craft preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A8A49E]">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-sm font-bold text-[#1E1A2D]">
                    {productDetails?.title || confirmedDescription || 'Handcrafted Artisan Craft'}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-[#55524E]">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E8E4DF] font-medium">
                      {productDetails?.categoryLabel || 'Handmade'}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      ₹{price.toLocaleString()}
                    </span>
                  </div>

                  {/* Stock Quantity Stepper */}
                  <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                    <span className="text-xs font-bold text-[#55524E]">
                      {t('stockCountLabel')}:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStockCount(Math.max(1, stockCount - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#D5D0CA] flex items-center justify-center text-[#55524E] hover:bg-[#F2EFE9]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold w-8 text-center text-[#1E1A2D]">
                        {stockCount}
                      </span>
                      <button
                        onClick={() => setStockCount(stockCount + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-[#D5D0CA] flex items-center justify-center text-[#55524E] hover:bg-[#F2EFE9]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation / Generation Status Messages */}
              {photo && !canPublish && (
                <div className="pt-2">
                  {isValidatingImage ? (
                    <div className="p-3 rounded-xl bg-[#EBE7FF] border border-[#C5BEFF] text-xs text-[#5A5187] font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#5A5187] shrink-0" />
                      <span>{isHindi ? 'शिल्प फोटो का सत्यापन हो रहा है...' : 'Validating craft image...'}</span>
                    </div>
                  ) : isGeneratingAi ? (
                    <div className="p-3 rounded-xl bg-[#EBE7FF] border border-[#C5BEFF] text-xs text-[#5A5187] font-medium flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#5A5187] shrink-0" />
                      <span>{isHindi ? 'AI शिल्प विवरण तैयार कर रहा है...' : 'Generating product details with AI...'}</span>
                    </div>
                  ) : validationResult && !validationResult.isValid ? (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-800">
                          {validationError || defaultValidationMessage}
                        </p>
                        <p className="text-[11px] text-red-600 mt-0.5">
                          {isHindi ? 'प्रकाशन अवरुद्ध है। कृपया ऊपर जाकर एक स्पष्ट उत्पाद फोटो अपलोड करें।' : 'Publishing is blocked. Please upload a clear product-focused image.'}
                        </p>
                      </div>
                    </div>
                  ) : isAiGenerationFailed || !productDetails ? (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-800">
                          {defaultValidationMessage}
                        </p>
                        <p className="text-[11px] text-red-600 mt-0.5">
                          {isHindi ? 'AI उत्पाद विवरण तैयार नहीं कर सका। प्रकाशन अवरुद्ध है।' : 'AI could not identify or generate product details. Publishing is blocked.'}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {!photo && (
                <div className="pt-2">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{isHindi ? 'कृपया पहले चरण 1 में उत्पाद फोटो अपलोड करें।' : 'Please upload a product photo in Step 1 to begin.'}</span>
                  </div>
                </div>
              )}

              {/* Publish Primary CTA */}
              <div className="pt-2">
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="w-full py-4 px-6 rounded-xl bg-[#5A5187] text-white font-bold text-base hover:bg-[#483F73] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{t('publishingProduct')}</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>{t('publishProductBtn')}</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* ========================================================== */}
            {/* SAVED DRAFT / RESUME WORKFLOW (BELOW) */}
            {/* ========================================================== */}
            <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1E1A2D]">
                    {t('resumeSavedDraftTitle')}
                  </h3>
                  <p className="text-xs text-[#736F6A]">
                    {t('resumeSavedDraftSubtitle')}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView('active_history')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#D5D0CA] text-xs font-bold text-[#5A5187] hover:bg-[#EBE7FF] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('resumeDraftBtn')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF] flex items-center gap-3">
                <img
                  src={savedDraftUrli.image}
                  alt={savedDraftUrli.title}
                  className="w-12 h-12 rounded-lg object-cover border border-[#E8E4DF]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#1E1A2D] truncate">
                    {savedDraftUrli.title}
                  </h4>
                  <p className="text-[11px] text-[#736F6A]">
                    {savedDraftUrli.category} • {savedDraftUrli.stock} {t('units')}
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================== */}
            {/* RECENTLY POSTED (BELOW) */}
            {/* ========================================================== */}
            {products && products.length > 0 && (
              <section className="bg-white rounded-2xl border border-[#E8E4DF] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1E1A2D]">
                    {t('lastPostedTitle')}
                  </h3>
                  <button
                    onClick={() => setActiveTab('catalogue')}
                    className="text-xs font-bold text-[#5A5187] hover:underline"
                  >
                    {t('viewAll')}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF9F6] border border-[#E8E4DF]">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={products[0].imageUrl}
                      alt={typeof products[0].title === 'object' ? products[0].title.en : products[0].title}
                      className="w-12 h-12 rounded-lg object-cover border border-[#E8E4DF]"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#1E1A2D] truncate">
                        {typeof products[0].title === 'object'
                          ? isHindi && products[0].title.hi
                            ? products[0].title.hi
                            : products[0].title.en
                          : products[0].title}
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-bold">
                        ₹{products[0].price.toLocaleString()} •{' '}
                        <span className="text-[#736F6A] font-normal">
                          {products[0].stockCount} {t('units')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('catalogue')}
                    className="px-3 py-1.5 rounded-lg border border-[#D5D0CA] bg-white text-xs font-semibold text-[#55524E] hover:bg-[#F2EFE9] shrink-0"
                  >
                    {t('viewProductBtn')}
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
