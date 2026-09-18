import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { removeProductBackground } from '../../services/aiService';
import {
  X,
  Sparkles,
  Check,
  Wand2,
  RefreshCw,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

export const ImageEnhancerModal: React.FC = () => {
  const {
    activeModal,
    modalData,
    closeModal,
    showToast,
    products,
    updateProductImage,
    getOrInitAuthSession,
    language,
  } = useApp();

  const isHindi = language === 'hi';

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or modalData changes
  useEffect(() => {
    if (activeModal === 'image_enhancer') {
      setErrorMsg(null);
      setIsProcessing(false);

      // Check if image or product was provided via modalData
      const modalImg =
        modalData?.image ||
        modalData?.imageUrl ||
        modalData?.photo ||
        modalData?.product?.imageUrl;

      const modalProdId = modalData?.productId || modalData?.product?.id || '';

      if (modalImg && typeof modalImg === 'string') {
        setCurrentImage(modalImg);
        setSelectedProductId(modalProdId);
        setProcessedImage(null);
        setIsEnhanced(false);
      } else if (products && products.length > 0) {
        // Fall back to the first product in the user's catalog
        const initialProd = products[0];
        setCurrentImage(initialProd.imageUrl || '');
        setSelectedProductId(initialProd.id);
        setProcessedImage(null);
        setIsEnhanced(false);
      } else {
        setCurrentImage('');
        setSelectedProductId('');
        setProcessedImage(null);
        setIsEnhanced(false);
      }
    }
  }, [activeModal, modalData, products]);

  if (activeModal !== 'image_enhancer') return null;

  // Handle selecting a different product from the user's catalog
  const handleProductSelect = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSelectedProductId(prod.id);
      setCurrentImage(prod.imageUrl || '');
      setProcessedImage(null);
      setIsEnhanced(false);
      setErrorMsg(null);
    }
  };

  // Handle uploading a custom image
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        if (base64Url) {
          setCurrentImage(base64Url);
          setProcessedImage(null);
          setIsEnhanced(false);
          setErrorMsg(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Step 2: Remove Background using remove.bg HTTP API
  const handleRemoveBackground = async () => {
    if (!currentImage) {
      setErrorMsg(
        isHindi
          ? 'कृपया पहले एक शिल्प फोटो चुनें या अपलोड करें'
          : 'Please select or upload a product photo first'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const session = await getOrInitAuthSession();
      const res = await removeProductBackground({
        image: currentImage,
        productId: selectedProductId || undefined,
        authToken: session?.token,
      });

      if (res.success && (res.imageUrl || res.dataUrl)) {
        const resultUrl = res.imageUrl || res.dataUrl!;
        setProcessedImage(resultUrl);
        setIsEnhanced(true);
        showToast(
          isHindi
            ? 'remove.bg द्वारा बैकग्राउंड सफलतापूर्वक हटा दिया गया!'
            : 'Background removed successfully with remove.bg!',
          'success'
        );
      } else {
        const err =
          res.error ||
          (isHindi
            ? 'बैकग्राउंड हटाने में विफल रहा। कृपया API कुंजी जांचें।'
            : 'Failed to remove background. Please verify your REMOVE_BG_API_KEY.');
        setErrorMsg(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        (isHindi
          ? 'remove.bg सेवा से संपर्क करने में त्रुटि'
          : 'Failed to communicate with remove.bg service');
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4: Apply processed image to product
  const handleApply = async () => {
    const finalImage = processedImage || currentImage;

    if (!finalImage) {
      closeModal();
      return;
    }

    // If modalData provided a custom onApply callback (e.g. from UploadProductScreen)
    if (typeof modalData?.onApply === 'function') {
      modalData.onApply(finalImage, currentImage);
    }

    // If an existing product ID was selected, update its image in catalog & database
    if (selectedProductId) {
      try {
        await updateProductImage(selectedProductId, finalImage);
      } catch (err) {
        console.warn('Failed to update product in catalog:', err);
      }
    }

    showToast(
      isHindi
        ? 'संसाधित पारदर्शी फोटो उत्पाद पर लागू की गई!'
        : 'Transparent image applied to product!',
      'success'
    );
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EBE7E4] p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE7E4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#C5BEFF] text-[#1E1A2D] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C2C2C]">
                {isHindi ? 'एआई इमेज बैकग्राउंड रिमूवर' : 'AI Image Enhancer'}
              </h3>
              <p className="text-[11px] text-[#636466]">
                {isHindi
                  ? 'remove.bg API द्वारा सटीक पारदर्शी बैकग्राउंड'
                  : 'Instant transparent background removal via remove.bg'}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-full text-[#76767F] hover:bg-[#F5F5F3] cursor-pointer"
            id="close-image-enhancer-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Selector / Upload Section (When multiple products exist) */}
        {products && products.length > 0 && !modalData?.image && (
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <label className="font-semibold text-[#55524E] shrink-0">
              {isHindi ? 'उत्पाद चुनें:' : 'Product:'}
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-[#E8E4DF] bg-[#FAF9F6] text-[#2C2C2C] focus:outline-none focus:border-[#5A5187]"
            >
              {products.map((p) => {
                const titleStr = typeof p.title === 'string' ? p.title : p.title?.en || p.sku;
                return (
                  <option key={p.id} value={p.id}>
                    {titleStr} ({p.sku})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Live Preview Area (Step 1 & Step 3) */}
        <div
          className={`mt-4 relative rounded-2xl overflow-hidden border border-[#EBE7E4] h-64 sm:h-72 flex items-center justify-center transition-all ${
            isEnhanced && processedImage
              ? 'bg-[linear-gradient(45deg,#E8E5E0_25%,transparent_25%),linear-gradient(-45deg,#E8E5E0_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#E8E5E0_75%),linear-gradient(-45deg,transparent_75%,#E8E5E0_75%)] bg-[size:16px_16px] bg-[#FAF9F6]'
              : 'bg-[#F8F7F4]'
          }`}
        >
          {currentImage ? (
            <img
              src={isEnhanced && processedImage ? processedImage : currentImage}
              alt="Craft Product"
              className="w-full h-full object-contain p-2 transition-all duration-300"
            />
          ) : (
            <div className="text-center p-6 text-[#76767F]">
              <ImageIcon className="w-10 h-10 mx-auto text-[#DDD8D1] mb-2" />
              <p className="text-xs">
                {isHindi
                  ? 'कोई उत्पाद फोटो उपलब्ध नहीं है। कृपया फोटो अपलोड करें।'
                  : 'No product photo selected. Please choose or upload a photo.'}
              </p>
            </div>
          )}

          {/* Toggle Badge */}
          {processedImage && (
            <div className="absolute top-3 left-3">
              <button
                onClick={() => setIsEnhanced(!isEnhanced)}
                className="px-3 py-1.5 rounded-full bg-black/75 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-black/90 transition-all"
              >
                <Wand2 className="w-3.5 h-3.5 text-[#F4E39E]" />
                <span>
                  {isEnhanced
                    ? isHindi
                      ? 'पारदर्शी रिजल्ट (remove.bg) ✓'
                      : 'Transparent Result (remove.bg) ✓'
                    : isHindi
                    ? 'मूल कच्ची फोटो'
                    : 'Original Raw Photo'}
                </span>
              </button>
            </div>
          )}

          {/* Transparent PNG Format Badge */}
          <div className="absolute bottom-3 right-3 text-[10px] font-mono bg-white/95 text-[#2C2C2C] px-2.5 py-1 rounded-md backdrop-blur-xs font-semibold shadow-xs border border-[#E8E4DF] flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                processedImage ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
            <span>{processedImage ? 'PNG • Transparent Alpha' : 'remove.bg: Ready'}</span>
          </div>

          {/* Processing Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-10">
              <RefreshCw className="w-8 h-8 text-[#5A5187] animate-spin mb-2" />
              <p className="text-xs font-bold text-[#1E1A2D]">
                {isHindi ? 'remove.bg द्वारा बैकग्राउंड हटाया जा रहा है...' : 'Removing background with remove.bg...'}
              </p>
              <p className="text-[11px] text-[#736F6A] mt-1">
                {isHindi ? 'सटीक पारदर्शी PNG तैयार हो रहा है' : 'Generating transparent PNG output'}
              </p>
            </div>
          )}
        </div>

        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold">{errorMsg}</p>
              <p className="text-[11px] text-red-600/90 mt-0.5">
                {isHindi
                  ? 'सुनिश्चित करें कि REMOVE_BG_API_KEY कॉन्फ़िगर है और पर्याप्त क्रेडिट हैं।'
                  : 'Ensure REMOVE_BG_API_KEY is configured in your environment variables and has active credits.'}
              </p>
            </div>
          </div>
        )}

        {/* Action Panel / remove.bg trigger (Step 2) */}
        <div className="mt-4 space-y-2.5">
          <div className="p-3.5 rounded-2xl border border-[#EBE7E4] bg-[#FAF9F6] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                <span>{isHindi ? 'बैकग्राउंड हटाएं' : 'Background Removal'}</span>
                {processedImage && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                )}
              </h4>
              <p className="text-[11px] text-[#636466] mt-0.5">
                {processedImage
                  ? isHindi
                    ? 'पारदर्शी PNG तैयार है। पूर्वावलोकन के लिए ऊपर क्लिक करें।'
                    : 'Transparent PNG generated successfully. Ready to apply.'
                  : isHindi
                  ? 'वस्तु को अलग करें और स्वच्छ पारदर्शी बैकग्राउंड प्राप्त करें।'
                  : 'Isolate craft subject and remove background via remove.bg API.'}
              </p>
            </div>

            <button
              onClick={handleRemoveBackground}
              disabled={isProcessing || !currentImage}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#5A5187] text-white text-xs font-bold hover:bg-[#483F73] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-xs"
              id="btn-remove-bg-modal"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isHindi ? 'प्रसंस्करण...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {processedImage
                      ? isHindi
                        ? 'पुनः बैकग्राउंड हटाएं'
                        : 'Re-process Background'
                      : isHindi
                      ? 'बैकग्राउंड हटाएं'
                      : 'Remove Background'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Option to upload another craft photo */}
          <div className="flex items-center justify-between text-xs text-[#736F6A] px-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#5A5187] font-semibold hover:underline cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isHindi ? 'अन्य फोटो अपलोड करें' : 'Upload a different craft photo'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomFileUpload}
            />
          </div>
        </div>

        {/* Modal Actions (Step 4) */}
        <div className="mt-5 pt-3 border-t border-[#EBE7E4] flex items-center justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#636466] hover:bg-[#F5F5F3] cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            disabled={isProcessing || !processedImage}
            className="px-5 py-2.5 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            id="btn-apply-enhanced-photo"
          >
            <Check className="w-3.5 h-3.5 text-[#F4E39E]" />
            <span>
              {isHindi ? 'उत्पाद पर लागू करें' : 'Apply to Selected Product'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
