import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  IndianRupee,
  Mic,
  MicOff,
  AlertTriangle,
  Sparkles,
  Info,
  Check,
  RotateCcw,
  Layers,
  Hammer,
  Package,
  Coins,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  calculateArtisanPricing,
  parseSpokenCosts,
  ArtisanCostInputs,
  CostFieldKey,
  PricingEvaluationResult,
} from '../../services/pricingEngine';
import {
  fetchMarketPriceEstimate,
  extractCostsFromSpokenText,
} from '../../services/aiService';
import { useVoiceInput } from '../../hooks/useVoiceInput';

export const PricingAssistantModal: React.FC = () => {
  const { activeModal, modalData, closeModal, showToast, language, t } = useApp();

  // Helper to extract the CURRENT craft being priced without fallback to demo or default products
  const extractCurrentProduct = (data: any) => {
    if (data?.product) {
      const p = data.product;
      const name = p.product_name || (typeof p.title === 'string' ? p.title : p.title?.en);
      if (name && name !== 'PRICING_PRODUCT_CONTEXT_MISSING') {
        return {
          product_name: name,
          primary_category: p.primary_category || (typeof p.categoryLabel === 'string' ? p.categoryLabel : p.categoryLabel?.en) || p.category || 'Handicrafts',
          sub_category: p.sub_category || p.subCategory || 'Artisan Goods',
          brand: p.brand || 'Unbranded / Independent',
          description: p.description || (typeof p.craftStory === 'string' ? p.craftStory : p.craftStory?.en) || '',
          spec_count: p.spec_count ?? (Array.isArray(p.specifications) ? p.specifications.length : 3),
          image_count: p.image_count ?? (p.imageUrl || p.photo ? 1 : 0),
          category_depth: p.category_depth ?? 3,
        };
      }
    }

    if (data?.product_name || data?.title) {
      const name = data.product_name || (typeof data.title === 'string' ? data.title : data.title?.en);
      if (name && name !== 'PRICING_PRODUCT_CONTEXT_MISSING') {
        return {
          product_name: name,
          primary_category: data.primary_category || (typeof data.categoryLabel === 'string' ? data.categoryLabel : data.categoryLabel?.en) || data.category || 'Handicrafts',
          sub_category: data.sub_category || 'Artisan Goods',
          brand: data.brand || 'Unbranded / Independent',
          description: data.description || '',
          spec_count: data.spec_count ?? 3,
          image_count: data.image_count ?? 1,
          category_depth: data.category_depth ?? 3,
        };
      }
    }

    return {
      product_name: 'PRICING_PRODUCT_CONTEXT_MISSING',
      primary_category: '',
      sub_category: '',
      brand: 'Unbranded / Independent',
      description: '',
      spec_count: 0,
      image_count: 0,
      category_depth: 3,
    };
  };

  const initialProduct = extractCurrentProduct(modalData);

  const [productData, setProductData] = useState(initialProduct);

  // 4 Artisan Cost Inputs: number | null
  // null = "I don't know" (never converted to 0)
  const [costs, setCosts] = useState<ArtisanCostInputs>({
    material_cost: modalData?.material_cost !== undefined ? modalData.material_cost : 300,
    labour_cost: modalData?.labour_cost !== undefined ? modalData.labour_cost : 500,
    packaging_cost: modalData?.packaging_cost !== undefined ? modalData.packaging_cost : 80,
    other_costs: modalData?.other_costs !== undefined ? modalData.other_costs : null,
  });

  // Configurable minimum profit margin % (default 25%)
  const [marginPercent, setMarginPercent] = useState<number>(25);

  // Evaluation & Market results state
  // Shows results once "Get AI Price Recommendation" is clicked (or if preloaded)
  const [hasCalculated, setHasCalculated] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [marketModelError, setMarketModelError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<PricingEvaluationResult | null>(null);

  // Per-field Voice Recording or Global Voice Recording state
  const [recordingField, setRecordingField] = useState<CostFieldKey | 'global' | null>(null);
  const recordingFieldRef = useRef<CostFieldKey | 'global' | null>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Centralized voice input hook integration
  const {
    isRecording,
    isTranscribing,
    startRecording: startVoiceHookRecording,
    stopRecording: stopVoiceHookRecording,
    cancelRecording: cancelVoiceHookRecording,
  } = useVoiceInput({
    language: language === 'hi' ? 'hi' : 'en',
    onTranscript: async (transcript: string) => {
      const field = recordingFieldRef.current || 'global';
      setRecordingField(null);
      recordingFieldRef.current = null;
      await handleSpokenVoiceResult(transcript, field);
    },
    onError: (err) => {
      setRecordingField(null);
      recordingFieldRef.current = null;
      setVoiceFeedback(t('pricingCouldNotHear'));
      showToast(err, 'warning');
    },
  });

  // Reset or initialize when modal opens
  useEffect(() => {
    return () => {
      cancelVoiceHookRecording();
    };
  }, [cancelVoiceHookRecording]);

  const handleClose = () => {
    cancelVoiceHookRecording();
    closeModal();
  };

  useEffect(() => {
    if (activeModal === 'pricing_assistant') {
      const prod = extractCurrentProduct(modalData);
      setProductData(prod);

      setCosts({
        material_cost: modalData?.material_cost !== undefined ? modalData.material_cost : 300,
        labour_cost: modalData?.labour_cost !== undefined ? modalData.labour_cost : 500,
        packaging_cost: modalData?.packaging_cost !== undefined ? modalData.packaging_cost : 80,
        other_costs: modalData?.other_costs !== undefined ? modalData.other_costs : null,
      });

      // Clear previous calculation to prompt user to click "Get AI Price Recommendation"
      setHasCalculated(false);
      setEvaluation(null);
      setMarketPrice(null);
      setMarketModelError(null);
      setVoiceFeedback(null);
    }
  }, [activeModal, modalData]);

  if (activeModal !== 'pricing_assistant') return null;

  // A) Type amount handler: number | null
  const handleCostInputChange = (field: CostFieldKey, rawValue: string) => {
    if (rawValue.trim() === '') {
      // Empty input treated as unknown (null)
      setCosts((prev) => ({ ...prev, [field]: null }));
      return;
    }
    const num = parseFloat(rawValue);
    if (!isNaN(num) && num >= 0) {
      setCosts((prev) => ({ ...prev, [field]: num }));
    }
  };

  // C) Select "I don't know" toggle: strictly sets to null (or toggles back to 0)
  const handleToggleUnknown = (field: CostFieldKey) => {
    setCosts((prev) => {
      const isCurrentlyUnknown = prev[field] === null;
      return {
        ...prev,
        [field]: isCurrentlyUnknown ? 0 : null,
      };
    });
  };

  // B) Voice Input: Using centralized useVoiceInput hook
  const startFieldVoice = async (field: CostFieldKey | 'global') => {
    setVoiceFeedback(null);
    setRecordingField(field);
    recordingFieldRef.current = field;
    setVoiceFeedback(t('pricingRecordingNow'));
    await startVoiceHookRecording();
  };

  const stopVoiceRecording = async () => {
    setIsProcessingVoice(true);
    setVoiceFeedback(t('pricingTranscribingVoice'));
    await stopVoiceHookRecording();
  };

  // Process transcript: supports both single field ("300 rupees") and multi-field ("material 300, labour 500")
  const handleSpokenVoiceResult = async (transcript: string, field: CostFieldKey | 'global') => {
    setIsProcessingVoice(true);
    setVoiceFeedback(`"${transcript}"`);

    // 1. If triggered on a single specific field and speech is just a number like "300" or "300 rupees"
    const numberMatch = transcript.match(/(?:₹|rs\.?|rupees?|रुपये|रुपए)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    const isolatedNum = numberMatch ? parseFloat(numberMatch[1]) : null;

    if (field !== 'global' && isolatedNum !== null && !isNaN(isolatedNum)) {
      // Check if user specified other field names in the sentence
      const lower = transcript.toLowerCase();
      const hasOtherKeywords =
        (field !== 'material_cost' && (lower.includes('material') || lower.includes('सामग्री'))) ||
        (field !== 'labour_cost' && (lower.includes('labour') || lower.includes('labor') || lower.includes('श्रम'))) ||
        (field !== 'packaging_cost' && (lower.includes('pack') || lower.includes('पैकेजिंग'))) ||
        (field !== 'other_costs' && (lower.includes('other') || lower.includes('kiln') || lower.includes('अन्य')));

      if (!hasOtherKeywords) {
        setCosts((prev) => ({ ...prev, [field]: isolatedNum }));
        showToast(
          `${t('pricingCostRecorded')} ₹${isolatedNum}!`,
          'success'
        );
        setIsProcessingVoice(false);
        return;
      }
    }

    // 2. Multi-field extraction or complex sentence
    const localParsed = parseSpokenCosts(transcript);

    try {
      // Call Gemini extraction route for full natural language intelligence
      const serverResp = await extractCostsFromSpokenText(transcript);
      if (serverResp.success && serverResp.costs) {
        const c = serverResp.costs;
        setCosts((prev) => ({
          material_cost: c.material_cost !== null ? c.material_cost : (localParsed.material_cost ?? prev.material_cost),
          labour_cost: c.labour_cost !== null ? c.labour_cost : (localParsed.labour_cost ?? prev.labour_cost),
          packaging_cost: c.packaging_cost !== null ? c.packaging_cost : (localParsed.packaging_cost ?? prev.packaging_cost),
          other_costs: c.other_costs !== null ? c.other_costs : (localParsed.other_costs ?? prev.other_costs),
        }));
        showToast(t('pricingCostsVoiceExtracted'), 'success');
      } else if (Object.keys(localParsed).length > 0) {
        setCosts((prev) => ({ ...prev, ...localParsed }));
        showToast(t('pricingCostsVoiceExtracted'), 'success');
      } else if (field !== 'global' && isolatedNum !== null) {
        setCosts((prev) => ({ ...prev, [field]: isolatedNum }));
      }
    } catch {
      if (Object.keys(localParsed).length > 0) {
        setCosts((prev) => ({ ...prev, ...localParsed }));
        showToast(t('pricingCostsVoiceExtracted'), 'success');
      } else if (field !== 'global' && isolatedNum !== null) {
        setCosts((prev) => ({ ...prev, [field]: isolatedNum }));
      }
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // PRIMARY ACTION: "Get AI Price Recommendation"
  // 1. Collect known cost inputs
  // 2. Use existing product information
  // 3. Call existing XGBoost prediction flow
  // 4. Run pricing/business logic
  // 5. Display the result clearly
  const handleGetAiPriceRecommendation = async () => {
    if (!productData?.product_name || productData.product_name === 'PRICING_PRODUCT_CONTEXT_MISSING') {
      setMarketModelError('PRICING_PRODUCT_CONTEXT_MISSING');
      showToast('PRICING_PRODUCT_CONTEXT_MISSING: Active craft context is required for pricing.', 'warning');
      return;
    }

    setIsCalculating(true);
    setMarketModelError(null);

    let predictedMarketPrice: number | null = null;

    try {
      const res = await fetchMarketPriceEstimate({
        product_name: productData.product_name,
        primary_category: productData.primary_category,
        sub_category: productData.sub_category,
        brand: productData.brand,
        description: productData.description,
        spec_count: productData.spec_count,
        image_count: productData.image_count,
        category_depth: productData.category_depth,
      });

      if (res.success && typeof res.predicted_price === 'number') {
        predictedMarketPrice = Math.round(res.predicted_price);
        setMarketPrice(predictedMarketPrice);
      } else {
        setMarketModelError(res.error || 'Market estimate unavailable');
      }
    } catch (err: any) {
      setMarketModelError(err.message || 'Error connecting to market model');
    }

    // Run pricing engine calculation
    const resEval = calculateArtisanPricing(costs, marginPercent, predictedMarketPrice);
    setEvaluation(resEval);
    setHasCalculated(true);
    setIsCalculating(false);

    showToast(
      t('pricingRecommendationReady'),
      'success'
    );
  };

  // Apply price to product/catalog
  const handleApplyPrice = () => {
    const finalPrice =
      evaluation?.recommended_price ||
      evaluation?.minimum_viable_price ||
      marketPrice ||
      1200;

    if (modalData?.onApplyPrice) {
      modalData.onApplyPrice(finalPrice);
    }
    showToast(
      `${t('pricingFairPriceApplied')}: ₹${finalPrice.toLocaleString()}!`,
      'success'
    );
    closeModal();
  };

  // Cost field configuration
  const costFields: {
    key: CostFieldKey;
    label: string;
    sub: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'material_cost',
      label: t('pricingMaterialCost'),
      sub: t('pricingMaterialSub'),
      icon: <Layers className="w-4 h-4 text-[#55524E]" />,
    },
    {
      key: 'labour_cost',
      label: t('pricingLabourCost'),
      sub: t('pricingLabourSub'),
      icon: <Hammer className="w-4 h-4 text-[#7D6B21]" />,
    },
    {
      key: 'packaging_cost',
      label: t('pricingPackagingCost'),
      sub: t('pricingPackagingSub'),
      icon: <Package className="w-4 h-4 text-[#55524E]" />,
    },
    {
      key: 'other_costs',
      label: t('pricingOtherCosts'),
      sub: t('pricingOtherSub'),
      icon: <Coins className="w-4 h-4 text-[#55524E]" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      id="artisan-pricing-modal"
    >
      <div className="bg-[#FAF9F6] rounded-3xl max-w-xl w-full shadow-2xl border border-[#EBE7E4] p-5 sm:p-7 max-h-[94vh] overflow-y-auto flex flex-col my-auto text-[#2C2C2C]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E4DF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EBE4D5] text-[#2C2C2C] flex items-center justify-center shadow-2xs">
              <IndianRupee className="w-5 h-5 text-[#2C2C2C]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C2C2C]">
                {t('pricingModalTitle')}
              </h3>
              <p className="text-xs text-[#636466]">
                {t('pricingModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#76767F] hover:bg-[#EFECE8] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Automatically Reused Product Information (Artisan is NOT asked to re-enter) */}
        <div className="mt-3.5 px-3.5 py-2 rounded-2xl bg-white border border-[#EBE7E4] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[#888580] font-medium shrink-0">
              {t('pricingProductLabel')}
            </span>
            <span className="font-bold text-[#2C2C2C] truncate">
              {productData.product_name}
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-[#F4F1EC] text-[10px] text-[#55524E] truncate">
              {productData.primary_category}
            </span>
          </div>
          <span className="text-[11px] text-[#2A4B37] font-semibold bg-[#E8EFE9] px-2 py-0.5 rounded-full shrink-0">
            {t('pricingDetailsLinked')}
          </span>
        </div>

        {/* Global Multi-Cost Voice Bar */}
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-[#F7F4EE] to-[#F1EDE5] border border-[#E5E0D6] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
            <div className="w-8 h-8 rounded-full bg-[#E5DDD0] flex items-center justify-center text-[#2C2C2C] shrink-0">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#2C2C2C]">
                {t('pricingSpeakAllTogether')}
              </p>
              <p className="text-[11px] text-[#636466]">
                {t('pricingSpeakAllEg')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {recordingField === 'global' ? (
              <button
                onClick={stopVoiceRecording}
                className="px-3.5 py-1.5 rounded-xl bg-[#D9534F] text-white text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer shadow-xs"
              >
                <MicOff className="w-3.5 h-3.5" />
                <span>{t('pricingStopListening')}</span>
              </button>
            ) : (
              <button
                onClick={() => startFieldVoice('global')}
                disabled={isProcessingVoice || recordingField !== null}
                className="px-3.5 py-1.5 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isProcessingVoice ? t('pricingProcessing') : t('pricingSpeak')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Voice Feedback Banner */}
        {voiceFeedback && (
          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-[#EDE7DC] text-[#3D3A36] text-[11px] italic flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8A773B] shrink-0" />
            <span className="truncate">{voiceFeedback}</span>
          </div>
        )}

        {/* 4 Artisan Cost Inputs */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#55524E]">
              {t('pricingYourProductionCosts')}
            </span>
            <span className="text-[11px] text-[#76767F]">
              {t('pricingCostMethodHint')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {costFields.map((field) => {
              const val = costs[field.key];
              const isUnknown = val === null;
              const isFieldRecording = recordingField === field.key;

              return (
                <div
                  key={field.key}
                  className={`p-3 rounded-2xl bg-white border transition-all ${
                    isUnknown
                      ? 'border-[#DCD6CE] bg-[#F9F7F5]'
                      : 'border-[#EBE7E4] shadow-2xs hover:border-[#D7D2CB]'
                  }`}
                >
                  {/* Field Header */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <label className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                      {field.icon}
                      <span>{field.label}</span>
                    </label>

                    {/* C) Select "I don't know" button */}
                    <button
                      type="button"
                      onClick={() => handleToggleUnknown(field.key)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                        isUnknown
                          ? 'bg-[#EAE4D7] text-[#55524E] border border-[#D5CDBC]'
                          : 'text-[#888580] hover:bg-[#F2EFEA]'
                      }`}
                    >
                      {isUnknown ? t('pricingDontKnowSelected') : t('pricingDontKnow')}
                    </button>
                  </div>

                  <p className="text-[10px] text-[#76767F] mb-1.5 line-clamp-1">
                    {field.sub}
                  </p>

                  {/* Input row: [ ₹ Amount ] [ 🎤 ] */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[#76767F] text-xs font-bold">
                        ₹
                      </span>
                      {/* A) Type the amount */}
                      <input
                        type="number"
                        min="0"
                        placeholder={isUnknown ? t('pricingUnknownPlaceholder') : '0'}
                        value={val !== null ? val : ''}
                        onChange={(e) => handleCostInputChange(field.key, e.target.value)}
                        className={`w-full pl-6 pr-2 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isUnknown
                            ? 'bg-[#F2EFEA] border border-dashed border-[#D5CDBC] text-[#888580]'
                            : 'bg-white border border-[#E0DCD7] text-[#222222] focus:border-[#2C2C2C] focus:ring-1 focus:ring-[#2C2C2C]'
                        }`}
                      />
                    </div>

                    {/* B) Use voice button for this field */}
                    <button
                      type="button"
                      onClick={() => (isFieldRecording ? stopVoiceRecording() : startFieldVoice(field.key))}
                      disabled={isProcessingVoice || (recordingField !== null && !isFieldRecording)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isFieldRecording
                          ? 'bg-[#D9534F] text-white animate-pulse shadow-xs'
                          : 'bg-[#F2EFEA] hover:bg-[#E5DDD0] text-[#2C2C2C]'
                      }`}
                      title={t('pricingSpeakAmount')}
                    >
                      {isFieldRecording ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimum Profit Margin Selector - Responsive layout preventing text wrap */}
        <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-[#EBE7E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0">
            <span className="text-xs font-bold text-[#2C2C2C] block whitespace-nowrap">
              {t('pricingTargetProfitMargin')}
            </span>
            <span className="text-[10px] text-[#76767F] block sm:whitespace-nowrap">
              {t('pricingTargetProfitMarginSub')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {[15, 20, 25, 30].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMarginPercent(m)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  marginPercent === m
                    ? 'bg-[#2C2C2C] text-white shadow-2xs'
                    : 'bg-[#F5F4F0] text-[#636466] hover:bg-[#EBE7E0]'
                }`}
              >
                {m}%
              </button>
            ))}
          </div>
        </div>

        {/* PRIMARY ACTION BUTTON: "Get AI Price Recommendation" */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleGetAiPriceRecommendation}
            disabled={isCalculating}
            className="w-full py-3 px-4 rounded-2xl bg-[#2C2C2C] hover:bg-black text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-60"
          >
            {isCalculating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('pricingCalculatingFairPrice')}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#F4E39E]" />
                <span>{t('pricingGetRecommendationBtn')}</span>
              </>
            )}
          </button>
        </div>

        {/* RESULTS SECTION: Shown clearly after clicking the primary action */}
        {hasCalculated && evaluation && (
          <div className="mt-4 space-y-3 animate-in fade-in duration-200">
            
            {/* Simple 3-Box Breakdown */}
            <div className="grid grid-cols-3 gap-2">
              
              {/* 1. Your Production Cost */}
              <div className="p-3 rounded-2xl bg-white border border-[#EBE7E4] text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#76767F] block">
                  {t('pricingYourCost')}
                </span>
                <span className="text-base sm:text-lg font-black text-[#2C2C2C] mt-0.5 block">
                  {evaluation.total_production_cost !== null
                    ? `₹${evaluation.total_production_cost.toLocaleString()}`
                    : t('pricingIncomplete')}
                </span>
                <span className="text-[9px] text-[#888580] block mt-0.5">
                  {evaluation.isCostComplete
                    ? t('pricingAllCostsKnown')
                    : t('pricingSomeMissing')}
                </span>
              </div>

              {/* 2. Market Estimate */}
              <div className="p-3 rounded-2xl bg-white border border-[#EBE7E4] text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#76767F] block">
                  {t('pricingMarketEst')}
                </span>
                <span className="text-base sm:text-lg font-black text-[#2C2C2C] mt-0.5 block">
                  {marketPrice !== null
                    ? `₹${marketPrice.toLocaleString()}`
                    : t('pricingMarketUnavailable')}
                </span>
                <span className="text-[9px] text-[#888580] block mt-0.5">
                  {t('pricingSimilarCrafts')}
                </span>
              </div>

              {/* 3. Recommended Price */}
              <div className="p-3 rounded-2xl bg-[#FBF7EE] border border-[#E8DEC7] text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6B21] block">
                  {t('pricingRecommendedPrice')}
                </span>
                <span className="text-base sm:text-lg font-black text-[#2C2C2C] mt-0.5 block">
                  {evaluation.recommended_price !== null
                    ? `₹${evaluation.recommended_price.toLocaleString()}`
                    : marketPrice !== null
                    ? `₹${marketPrice.toLocaleString()}`
                    : '—'}
                </span>
                <span className="text-[9px] text-[#7D6B21] font-bold block mt-0.5">
                  {evaluation.warning_type === 'below_viable_cost'
                    ? t('pricingProtectedFloor')
                    : t('pricingFairPrice')}
                </span>
              </div>

            </div>

            {/* Explanation / Warning Banner */}
            {evaluation.warning_type === 'below_viable_cost' ? (
              <div className="p-3.5 rounded-2xl bg-[#FFF2F0] border border-[#FFCCC7] text-[#A8071A] flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-[#CF1322] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">
                    {t('pricingBelowViableTitle')}
                  </p>
                  <p className="leading-relaxed text-[11px] opacity-90">
                    {t('pricingBelowViableDesc')}
                  </p>
                </div>
              </div>
            ) : evaluation.warning_type === 'incomplete_costs_with_market' ? (
              <div className="p-3.5 rounded-2xl bg-[#FFFBE6] border border-[#FFE58F] text-[#874D00] flex items-start gap-2.5">
                <Info className="w-5 h-5 text-[#D48806] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">
                    {t('pricingIncompleteCostsTitle')}
                  </p>
                  <p className="leading-relaxed text-[11px] opacity-90">
                    {t('pricingIncompleteCostsDesc')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-[#F0F7F2] border border-[#CCE5D4] text-[#1E4620] flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#2A7E3B] shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">
                    {t('pricingRecommendationSuccessTitle')}
                  </p>
                  <p className="leading-relaxed text-[11px] opacity-90">
                    {t('pricingRecommendationSuccessDesc')}
                  </p>
                </div>
              </div>
            )}

            {/* Apply Recommended Price Button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[#636466] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
              >
                {t('pricingClose')}
              </button>
              <button
                type="button"
                onClick={handleApplyPrice}
                className="flex-2 py-2.5 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>
                  {`${t('pricingUsePrice')} ₹${(evaluation.recommended_price || marketPrice || 1200).toLocaleString()}`}
                </span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
