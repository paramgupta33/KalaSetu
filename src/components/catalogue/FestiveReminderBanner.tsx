import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Volume2,
  Pause,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  CheckCircle2,
  Layers,
  Languages
} from 'lucide-react';

export const FestiveReminderBanner: React.FC = () => {
  const { language, setLanguage, setActiveTab, refillProductStock, showToast, products } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'hi' | 'en'>(language === 'hi' ? 'hi' : 'en');
  const [activeFestivalTab, setActiveFestivalTab] = useState<'ganesh' | 'navratri'>('ganesh');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Synchronize voice lang with app language if app language changes from outside
  useEffect(() => {
    if (language === 'hi') {
      setVoiceLang('hi');
    } else if (language === 'en') {
      setVoiceLang('en');
    }
  }, [language]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isHindi = language === 'hi' || voiceLang === 'hi';

  const speechContent = {
    hi: `कारीगर सूचना: आगामी गणेश चतुर्थी और नवरात्रि के लिए उत्सव की मांग बढ़ रही है! गणेश चतुर्थी के लिए प्राकृतिक मिट्टी की मूर्तियां, पीतल की पूजा थालियां, और फूलों की उरली तैयार करें। नवरात्रि के लिए हस्तनिर्मित डांडिया स्टिक्स, तोरण और गरबा पोशाक के बॉर्डर तैयार रखें। कच्चा माल अभी से स्टॉक करें और कलासेतु पर अपने उत्सव उत्पाद लिस्ट करें।`,
    en: `Festive Advisory: High buyer demand is approaching for Ganesh Chaturthi and Navratri! For Ganesh Chaturthi, prepare eco-friendly clay Ganesha idols, brass puja thalis, and terracotta urlis. For Navratri, craft wooden dandiya sticks, festive torans, and mirror-work borders. Stock raw materials 3 weeks in advance and publish your festive collections on KalaSetu now.`
  };

  const handleToggleVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const text = isHindi ? speechContent.hi : speechContent.en;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectLanguage = (lang: 'hi' | 'en') => {
    if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setVoiceLang(lang);
    setLanguage(lang);
  };

  const handleRefillFestiveStock = () => {
    const lowStockItems = products.filter((p) => p.isLowStock || p.stockCount <= 3);
    lowStockItems.forEach((p) => refillProductStock(p.id, 12));
    showToast(
      isHindi
        ? `गणेश चतुर्थी व नवरात्रि के लिए ${lowStockItems.length || 3} उत्पादों का स्टॉक बढ़ाया गया!`
        : `Replenished stock for ${lowStockItems.length || 3} crafts before festival rush!`,
      'success'
    );
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-[#FFF8E7] border border-[#F4E39E] text-[#2C2C2C] text-xs font-semibold">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D97706]" />
          <span>
            {isHindi
              ? 'गणेश चतुर्थी व नवरात्रि उत्सव सूचना'
              : 'Ganesh Chaturthi & Navratri Festive Reminder'}
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="text-[#B45309] hover:underline font-bold text-xs cursor-pointer"
        >
          {isHindi ? 'देखें' : 'View Advisory'}
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FFFDF5] via-[#FFF9E6] to-[#FFF3CC] border border-[#EEDB9A] shadow-xs text-[#2C2C2C] transition-all"
      id="festive-reminder-banner"
    >
      {/* Decorative festive ambient background */}
      <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />
      <div className="absolute left-1/2 -bottom-10 w-36 h-36 rounded-full bg-[#EA580C]/5 blur-2xl pointer-events-none" />

      {/* Header Notification Strip */}
      <div className="p-3.5 sm:p-4 pb-2 border-b border-[#F4E39E]/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B45309]"></span>
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11px] font-bold tracking-wide uppercase">
            <Sparkles className="w-3 h-3 text-[#D97706]" />
            <span>
              {isHindi ? 'त्योहार तैयारी सूचना' : 'Festive Preparation Advisory'}
            </span>
          </div>
          <span className="hidden xs:inline-block text-xs font-semibold text-[#78350F]">
            {isHindi ? 'आगामी उत्सव • सितंबर - अक्टूबर' : 'Upcoming Festivals • Sept – Oct'}
          </span>
        </div>

        {/* Voice Controls + Language Switcher + Minimize/Dismiss */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Interactive Language Selector Buttons (HI / EN) */}
          <div className="flex items-center bg-[#FEF3C7] rounded-full p-0.5 border border-[#FDE68A] shadow-2xs">
            <button
              onClick={() => handleSelectLanguage('hi')}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                isHindi
                  ? 'bg-[#B45309] text-white shadow-xs scale-102'
                  : 'text-[#92400E] hover:text-[#78350F] hover:bg-[#FDE68A]/60'
              }`}
              title="हिन्दी में बदलें (Switch to Hindi)"
              id="btn-lang-hi-festive"
            >
              <Languages className="w-3 h-3" />
              <span>हिन्दी</span>
            </button>
            <button
              onClick={() => handleSelectLanguage('en')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                !isHindi
                  ? 'bg-[#B45309] text-white shadow-xs scale-102'
                  : 'text-[#92400E] hover:text-[#78350F] hover:bg-[#FDE68A]/60'
              }`}
              title="Switch to English"
              id="btn-lang-en-festive"
            >
              EN
            </button>
          </div>

          {/* Voice Output Play/Pause Button */}
          <button
            onClick={handleToggleVoice}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${
              isPlaying
                ? 'bg-[#B45309] text-white animate-pulse'
                : 'bg-[#92400E] text-white hover:bg-[#78350F]'
            }`}
            title={isPlaying ? (isHindi ? 'आवाज़ रोकें' : 'Pause Voice') : (isHindi ? 'आवाज़ में सूचना सुनें' : 'Listen to Voice Advisory')}
            id="btn-voice-festive-advisory"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{isHindi ? 'रुकें (0:24)' : 'Pause (0:24)'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isHindi ? 'आवाज़ सुनें' : 'Listen Voice'}</span>
              </>
            )}
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full text-[#92400E] hover:bg-[#FEF3C7] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand'}
            aria-label="Toggle details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Dismiss button */}
          <button
            onClick={() => {
              if (isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
              }
              setIsDismissed(true);
            }}
            className="p-1 rounded-full text-[#92400E]/70 hover:text-[#92400E] hover:bg-[#FEF3C7] transition-colors cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Voice Waveform Ribbon (Shows when playing) */}
      {isPlaying && (
        <div className="bg-[#FEF3C7] px-4 py-1.5 border-b border-[#FDE68A] flex items-center justify-between text-xs text-[#92400E] animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#B45309] animate-pulse">
              graphic_eq
            </span>
            <span className="font-medium">
              {isHindi
                ? 'कलासेतु उत्सव उद्घोषणा: आवाज़ में सुनाया जा रहा है...'
                : 'KalaSetu Festive Voice Advisory: Playing audio guidance...'}
            </span>
          </div>
          <button
            onClick={handleToggleVoice}
            className="text-[11px] font-bold text-[#B45309] hover:underline cursor-pointer"
          >
            {isHindi ? 'बंद करें' : 'Stop'}
          </button>
        </div>
      )}

      {/* Body Content */}
      <div className="p-3.5 sm:p-5 pt-3">
        {/* Short Text Summary Notification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#1E1A2D] flex items-center gap-1.5">
              <span>
                {isHindi
                  ? 'गणेश चतुर्थी और नवरात्रि: उत्सव मांग एवं कारीगर तैयारी'
                  : 'Ganesh Chaturthi & Navratri: Surge in Festive Demand & Prep'}
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-[#451A03] mt-0.5 leading-relaxed max-w-2xl">
              {isHindi
                ? 'खरीदार और कॉर्पोरेट ग्राहक अभी से उत्सव सजावट, पूजा पात्र और हस्तनिर्मित उपहारों की खोज कर रहे हैं। नीचे दिए गए उत्पादों को तैयार रखें और 3-4 सप्ताह पहले स्टॉक सुनिश्चित करें।'
                : 'Corporate buyers and families are actively sourcing festive decor, puja vessels, and handcrafted gifts. Prepare your workshop stocks 3–4 weeks early.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
              id="btn-add-festive-craft"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isHindi ? '+ नया उत्सव क्राफ्ट' : '+ Add Festive Craft'}</span>
            </button>
            <button
              type="button"
              onClick={handleRefillFestiveStock}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Quick Refill Inventory"
              id="btn-refill-festive-stock"
            >
              <PackageCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isHindi ? 'स्टॉक रीफिल करें' : 'Refill Stock'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Dual-Festival Preparation Tabs & Products Guide */}
        {isExpanded && (
          <div className="pt-2 border-t border-[#F4E39E]/60 space-y-3">
            {/* Festival Switcher Tabs */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveFestivalTab('ganesh')}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 text-left ${
                  activeFestivalTab === 'ganesh'
                    ? 'bg-[#B45309] text-white shadow-xs'
                    : 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
                }`}
                id="tab-btn-ganesh"
              >
                <span className="text-base shrink-0 leading-none">🐘</span>
                <div className="min-w-0">
                  <div className="truncate font-bold text-xs leading-tight">
                    {isHindi ? 'गणेश चतुर्थी' : 'Ganesh Chaturthi'}
                  </div>
                  <div className="text-[10px] opacity-85 font-normal truncate leading-tight">
                    {isHindi ? 'तैयारी (भाद्रपद)' : 'Prep (Bhadrapada)'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveFestivalTab('navratri')}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 text-left ${
                  activeFestivalTab === 'navratri'
                    ? 'bg-[#B45309] text-white shadow-xs'
                    : 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]'
                }`}
                id="tab-btn-navratri"
              >
                <span className="text-base shrink-0 leading-none">🪔</span>
                <div className="min-w-0">
                  <div className="truncate font-bold text-xs leading-tight">
                    {isHindi ? 'नवरात्रि तैयारी' : 'Navratri Prep'}
                  </div>
                  <div className="text-[10px] opacity-85 font-normal truncate leading-tight">
                    {isHindi ? 'उत्सव (अश्विन)' : 'Prep (Ashwin)'}
                  </div>
                </div>
              </button>
            </div>

            {/* Active Festival Content Box */}
            {activeFestivalTab === 'ganesh' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-[#FFFFFF]/80 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-[#F4E39E] text-xs">
                {/* Column 1: Products to Craft */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#92400E] font-bold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? 'तैयार करने योग्य प्रमुख उत्पाद (Products to Make)'
                        : 'Key Products to Craft & Stock'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[#2C2C2C] leading-snug">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'इको-फ्रेंडली मिट्टी के गणेशजी:' : 'Eco-friendly Clay Ganesha:'}</strong>{' '}
                        {isHindi
                          ? 'शाडू माटी और पौधों के बीजों वाली प्राकृतिक मूर्तियां (घरेलू मंदिर के लिए 6" से 14" की सबसे अधिक मांग)।'
                          : 'Shadu mati & plant-seed idols (6" to 14" preferred for home mandirs).'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'पीतल व कांस्य पूजा थालियां:' : 'Brass & Bronze Puja Thalis:'}</strong>{' '}
                        {isHindi
                          ? 'नक्काशीदार मोदक पात्र, घंटी, धूपदानी, कुमकुम डिब्बी और पंचारती दीयों के साथ।'
                          : 'With engraved modak vessels, bell, and diya holders.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'टेराकोटा और ब्लू पॉटरी उरली:' : 'Terracotta & Blue Pottery Urlis:'}</strong>{' '}
                        {isHindi
                          ? 'गेंदे के फूलों की पंखुड़ियों और तैरते दीयों से मुख्य द्वार/मंदिर के स्वागत हेतु।'
                          : 'For floating marigold petals and festive foyer welcome.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'हस्त-नक्काशीदार लकड़ी की चौकियां:' : 'Hand-carved Wooden Chowkis:'}</strong>{' '}
                        {isHindi
                          ? 'गणेशजी की मूर्ति स्थापना के लिए शीशम व सागवान के पारंपरिक नक्काशीदार बाजोट।'
                          : 'Low platforms for idol sthapana.'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Artisan Workshop Preparations */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#B45309] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? 'कारीगर कार्यशाला तैयारी (Workshop Action Plan)'
                        : 'Workshop Preparations to Complete'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[#2C2C2C] leading-snug">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? '3 सप्ताह पूर्व कच्चा माल जुटाएं:' : 'Raw Materials 3 Weeks Early:'}</strong>{' '}
                        {isHindi
                          ? 'जैविक शाडू माटी, प्राकृतिक हल्दी-गेरू रंग और भट्ठी की लकड़ियां पहले से स्टॉक करें।'
                          : 'Stock organic clay dough, natural haldi/kumkum dyes, and firing firewood.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'कॉम्बो बंडल तैयार करें:' : 'Multi-Pack Bundles:'}</strong>{' '}
                        {isHindi
                          ? '1 उरली + 4 पीतल के दीयों का सेट 15% कॉम्बो छूट के साथ बनाएं ताकि खरीदार बड़ा ऑर्डर दें।'
                          : 'Bundle 1 Urli + 4 Brass Diyas at 15% combo savings for higher basket value.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'सुरक्षित पैकेजिंग सामग्री:' : 'Shatterproof Boxes:'}</strong>{' '}
                        {isHindi
                          ? 'मूर्तियों और बर्तनों के सुरक्षित परिवहन हेतु हनीकॉम्ब पेपर व कुशन वाले मजबूत बॉक्स तैयार रखें।'
                          : 'Pre-cut honeycomb paper & cushioned corrugated crates for idol dispatches.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'कलासेतु पर अग्रिम लिस्टिंग:' : 'Early KalaSetu Listing:'}</strong>{' '}
                        {isHindi
                          ? 'जीआई टैग और प्रामाणिकता प्रमाणपत्र के साथ लिस्ट करें ताकि कॉर्पोरेट खरीदार समय पर बुक करें।'
                          : 'Publish with GI tags so bulk corporate orders lock in before festival week.'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 bg-[#FFFFFF]/80 backdrop-blur-xs rounded-xl p-3 sm:p-3.5 border border-[#F4E39E] text-xs">
                {/* Column 1: Products to Craft for Navratri */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#92400E] font-bold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? 'नवरात्रि के लिए क्राफ्ट उत्पाद (Navratri Craft Items)'
                        : 'Key Products for Navratri & Garba'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[#2C2C2C] leading-snug">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'हस्तनिर्मित डांडिया स्टिक्स:' : 'Handcrafted Dandiya Sticks:'}</strong>{' '}
                        {isHindi
                          ? 'संखेड़ा नक्काशीदार लकड़ी, बंधेज कपड़ा लिपटी और पीतल की घुंघरू लगी डांडिया जोड़ियां।'
                          : 'Painted Sankheda wood, Bandhani wrapped, and brass studded pairs.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'गरबा गरबी टेराकोटा मटके (दीप पात्र):' : 'Garba Garbi Terracotta Pots:'}</strong>{' '}
                        {isHindi
                          ? 'अखंड ज्योत के लिए बारीक छेद व कांच (मिरर) वर्क वाले पारंपरिक मिट्टी के दिए।'
                          : 'Perforated clay lamps with mirrored accents for 9-night akhand jyot.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'कच्छ मिरर-वर्क बॉर्डर व लेस:' : 'Kutch Mirror-Work Borders:'}</strong>{' '}
                        {isHindi
                          ? 'हाथ से कढ़ाई किए हुए बॉर्डर, चनिया-चोली के पैच और गुजराती कशीदाकारी दुपट्टे।'
                          : 'Embroidered ribbons, chaniya choli patches, and festive dupattas.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">•</span>
                      <span>
                        <strong>{isHindi ? 'उत्सव तोरण और शुभ-लाभ हैंगिंग्स:' : 'Festive Torans & Shubh Labh Hangings:'}</strong>{' '}
                        {isHindi
                          ? 'पीतल की घंटियां, गेंदे के फूलों वाले कपड़े के वंदनवार और कौड़ी वाली लटकन।'
                          : 'Brass bells, marigold fabric garlands, and cowrie shells.'}
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Artisan Workshop Preparations for Navratri */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#B45309] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isHindi
                        ? 'नवरात्रि कार्यशाला तैयारी (Navratri Action Plan)'
                        : 'Workshop Preparations to Complete'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-[#2C2C2C] leading-snug">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'कपड़े और धागों की अग्रिम रंगाई:' : 'Pre-dye Fabrics & Yarns:'}</strong>{' '}
                        {isHindi
                          ? 'गरबा के लिए लाल, पीला, हरा और रानी गुलाबी रंगों के सूती व रेशमी धागे रंग कर रखें।'
                          : 'Ensure vibrant red, yellow, green, and royal blue palette lots are dyed.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'पारिवारिक डांडिया सेट बनाएं:' : 'Family Pair Sets:'}</strong>{' '}
                        {isHindi
                          ? 'डांडिया को 2, 4 और 10 जोड़ों के पारिवारिक पैक में आकर्षक थैली के साथ पैक करें।'
                          : 'Package dandiya pairs in sets of 2, 4, and 10 pairs for community groups.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'कूरियर व लॉजिस्टिक्स तैयारी:' : 'Courier Dispatch Buffers:'}</strong>{' '}
                        {isHindi
                          ? 'त्योहार के अंतिम सप्ताह की भीड़ से बचने के लिए स्थानीय डाक व कूरियर से 2 सप्ताह पहले जुड़ें।'
                          : 'Partner with local logistics 2 weeks in advance to avoid festive delays.'}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#B45309] font-bold">✓</span>
                      <span>
                        <strong>{isHindi ? 'गरबा नाइट लाइटिंग फोटोग्राफी:' : 'Warm Light Photography:'}</strong>{' '}
                        {isHindi
                          ? 'कलाएआई स्टूडियो से दीयों और शीशों की चमक वाली तस्वीरें बनाकर कैटलॉग में लगाएं।'
                          : 'Capture nighttime sparkle and festive glow using KalaAI studio enhancer.'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Quick Keyword Tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#78350F]">
                {isHindi ? 'प्रचलित सर्च टैग्स:' : 'Trending Search Tags:'}
              </span>
              {isHindi ? (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #इकोक्लेगणेश
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #नवरात्रिगरबा
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #पीतलपूजाथाली
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #हस्तनिर्मितडांडिया
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #टेराकोटाउरली
                  </span>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #EcoClayGanesh
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #NavratriGarba
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #BrassPujaThali
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #PaintedDandiya
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-semibold border border-[#FDE68A]">
                    #TerracottaUrli
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
