import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface ActiveSessionHistoryScreenProps {
  onBack: () => void;
  onStartNewChat?: () => void;
}

export const ActiveSessionHistoryScreen: React.FC<ActiveSessionHistoryScreenProps> = ({
  onBack,
  onStartNewChat,
}) => {
  const { addNewProduct, setActiveTab, showToast, language, setLanguage } = useApp();
  const isHindi = language === 'hi';

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedExport, setSelectedExport] = useState<string | null>(null);

  // Extra dynamic messages appended by the user
  const [extraMessages, setExtraMessages] = useState<
    Array<{ id: string; sender: 'user' | 'ai'; text: string; time: string }>
  >([]);

  // Raw & Enhanced Images
  const rawImageUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBZtbxFhtpB9BXFuRwHu_W8wwGb6iH_cOVFafqxSJ8q8ptXi5Tno8w4KjlVKFK5FLd4SpvU-Jfb8wjllVWTcjXqoCmOFvh_i6jJeFcOh6B2RDdCKS_0RLKuIp8XIzWyvf8-g8m68WleRu7IW1n-8EPe-_t4e5BAa2z2si8yULC7xl9WTu5Zk-z1ki5fFJ5rfP9brxhh-QdJp8D6QGRZfYGaPFfbJ7lcgs7XB1QrnLjYC8FgELaYqQX3';
  const isolatedStudioUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBVV4bmxl4L-jQXOLG7miGYOx7oYeUOcj1exAjCR31kR5Y6KWtpHoQHNWs697QWbw4isENUnQFFXRUPNb9pU_eNPGnnaqvtqeWCQ5gRHVk55M27aTy4bvIYtDaN6bJqiVyC1y0rGEuHcIKKlO4YTKyRCVEExDeC-OyoVHOL48cFdWJL7ckXhqdcRO07uMLSucaT6FdXGvsRkzYNQc-80_h093T9uDQsnfOlhsQS8d6K_xg5HZK4ph79';

  // Toggle audio player
  const togglePlay = (id: string, speechText?: string) => {
    if (playingAudioId === id) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      if ('speechSynthesis' in window && speechText) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = isHindi ? 'hi-IN' : 'en-US';
        utterance.rate = 0.95;
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => setPlayingAudioId(null), 4000);
      }
    }
  };

  // Publish to KalaSetu
  const handlePublishToKalaSetu = () => {
    if (isPublished) {
      showToast(
        isHindi
          ? 'शिल्प पहले से ही कलासेतु पर लाइव है! कैटलॉग खोला जा रहा है...'
          : 'Craft is already live on KalaSetu! Redirecting to catalogue...',
        'info'
      );
      setActiveTab('catalogue');
      return;
    }

    const newCraft: Omit<Product, 'id'> = {
      sku: 'JAIPUR-POT-408',
      title: {
        en: 'Handcrafted Jaipur Blue Pottery Floral Urli Bowl – Persian Floral Motifs',
        hi: 'हस्तनिर्मित जयपुर ब्लू पॉटरी फ्लोरल उरली बाउल – फारसी पुष्प रूपांकन',
        mr: 'हस्तनिर्मित जयपूर ब्लू पॉटरी फ्लोरल उरली बाउल',
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
      stockCount: 8,
      views: 56,
      sold: 2,
      isLowStock: false,
      imageUrl: isolatedStudioUrl,
      altText: isHindi
        ? 'हस्तनिर्मित प्रामाणिक भारतीय जयपुर ब्लू पॉटरी फ्लोरल उरली बाउल'
        : 'Handmade authentic Indian Jaipur blue pottery floral urli bowl',
      tags: ['jaipur-pottery', 'handcrafted-urli', 'festive-home-decor', 'artisan-made', 'gi-craft'],
      giCertified: true,
      isGiCertified: true,
      dimensions: isHindi ? '10" व्यास x 4" ऊंचाई (1.8 किग्रा)' : '10" diameter x 4" height (1.8 kg)',
      materials: isHindi
        ? ['मुल्तानी मिट्टी', 'क्वार्ट्ज पत्थर का आटा', 'प्राकृतिक कोबाल्ट ग्लेज']
        : ["Fuller's Earth (Multani Mitti)", 'Quartz Stone Dough', 'Natural Cobalt Glaze'],
      craftStory: {
        en: 'Handmade with love by Radhika Devi in Sanganer, this traditional neeli mitti (blue pottery) urli is crafted over 18 hours of meticulous artistry with ₹420 in natural raw materials—fuller’s earth, quartz stone, and natural cobalt glaze.',
        hi: 'सांगानेर में राधिका देवी द्वारा हस्तनिर्मित, यह पारंपरिक नीली मिट्टी की उरली 18 घंटे की उत्कृष्ट कारीगरी और ₹420 के प्राकृतिक कच्चे माल (मुल्तानी मिट्टी, क्वार्ट्ज और कोबाल्ट) से तैयार की गई है।',
        mr: 'सांगानेर येथे राधिका देवी यांनी हस्तनिर्मित केलेली ही पारंपारिक निळ्या मातीची उरली.',
        historicalOrigin: 'Jaipur, Rajasthan (GI Tag #RAJ-BP-408)',
        techniques: ['Wheel-molded quartz dough', 'Hand-glazed Persian floral motif', 'Low kiln firing'],
        fairWageShare: 92,
      },
      bulkTier: {
        minUnits: 5,
        minQty: 5,
        pricePerUnit: 1950,
        leadTimeDays: 7,
        maxCapacityPerMonth: 60,
      },
    };

    addNewProduct(newCraft);
    setIsPublished(true);
    showToast(
      isHindi
        ? '🎉 कलासेतु पर प्रकाशित! 1-क्लिक में लाइव स्टोर लिस्टिंग तैयार हो गई।'
        : '🎉 Published to KalaSetu! 1-Click Live store listing created.',
      'success'
    );
  };

  const handleExport = (platform: string) => {
    setSelectedExport(platform);
    showToast(
      isHindi
        ? `${platform} के लिए निर्यात टेम्प्लेट तैयार! लिस्टिंग क्लिपबोर्ड में कॉपी की गई।`
        : `Export template generated for ${platform}! Listing copied to clipboard.`,
      'success'
    );
  };

  const handleSendMessage = () => {
    const text = chatInputText.trim();
    if (!text) return;

    setExtraMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        time: isHindi ? 'अभी' : 'Just now',
      },
    ]);
    setChatInputText('');

    setTimeout(() => {
      setExtraMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: isHindi
            ? 'समझ गया! मैंने आपके अनुरोध को लिस्टिंग विनिर्देशों में शामिल कर दिया है और त्योहारी मेटाडेटा अपडेट कर दिया है।'
            : 'Noted! I have integrated this request into your listing specifications and updated the festive metadata.',
          time: isHindi ? 'अभी' : 'Just now',
        },
      ]);
    }, 900);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      showToast(isHindi ? 'आवाज़ पहचान पूरी हुई!' : 'Voice processing complete!', 'success');
      setChatInputText(
        isHindi
          ? 'दिवाली छूट 15% जोड़ दो और प्रीमियम उपहार पैकिंग का उल्लेख करो।'
          : 'Diwali discount 15% add kar do aur gift packing mention karo.'
      );
    } else {
      setIsRecording(true);
      showToast(
        isHindi ? 'सुन रहे हैं... बोलिए (हिन्दी / अंग्रेज़ी)' : 'Listening... बोलिए (Hindi / English)',
        'info'
      );
      setTimeout(() => {
        setIsRecording(false);
        setChatInputText(
          isHindi
            ? 'दिवाली छूट 15% जोड़ दो और प्रीमियम उपहार पैकिंग का उल्लेख करो।'
            : 'Diwali discount 15% add kar do aur gift packing mention karo.'
        );
        showToast(
          isHindi ? 'आवाज़ रिकॉर्ड हो गई! भेजने के लिए तीर पर टैप करें।' : 'Voice captured! Tap Send to update.',
          'success'
        );
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pb-28 pt-2 animate-in fade-in duration-200" id="active-session-history-screen">
      <div className="flex flex-col w-full gap-6 pb-12">
        {/* Top Section: Header & AI Brand Status */}
        <section className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                aria-label={isHindi ? 'स्टूडियो पर वापस जाएं' : 'Go Back to Studio'}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2C2C2C] shadow-sm border border-[#EBE7E4]/70 active:scale-95 transition-transform cursor-pointer hover:bg-[#FAF9F6]"
                type="button"
                title={isHindi ? 'स्टूडियो पर वापस जाएं' : 'Back to Studio'}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fae28b] animate-pulse"></span>
                <span className="text-xs text-[#6e5d13] uppercase font-semibold tracking-wider">
                  {isHindi ? 'AI प्रकाशन स्टूडियो' : 'AI Publish Studio'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="inline-flex items-center bg-[#F5F5F3] p-0.5 rounded-full border border-[#EBE7E4]/80 shadow-2xs">
                <button
                  onClick={() => {
                    setLanguage('hi');
                    showToast('भाषा बदलकर हिन्दी कर दी गई है', 'success');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    isHindi
                      ? 'bg-[#2C2C2C] text-white shadow-xs'
                      : 'text-[#48454f] hover:text-[#2C2C2C]'
                  }`}
                  type="button"
                >
                  हिन्दी
                </button>
                <button
                  onClick={() => {
                    setLanguage('en');
                    showToast('Language switched to English', 'info');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    !isHindi
                      ? 'bg-[#2C2C2C] text-white shadow-xs'
                      : 'text-[#48454f] hover:text-[#2C2C2C]'
                  }`}
                  type="button"
                >
                  EN
                </button>
              </div>

              {/* Start New Chat Action */}
              {onStartNewChat && (
                <button
                  onClick={onStartNewChat}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#2C2C2C] text-white text-xs font-semibold hover:bg-black active:scale-95 transition-all shadow-xs cursor-pointer"
                  type="button"
                  title={isHindi ? 'नया चैट शुरू करें' : 'Start New Chat'}
                >
                  <span className="material-symbols-outlined text-[15px] text-[#fae28b]">add</span>
                  <span>{isHindi ? 'नया चैट' : 'New Chat'}</span>
                </button>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6deff] text-[#1c1246] shadow-2xs">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span className="text-[11px] font-semibold tracking-wide">
                  {isHindi ? 'कलासेतु साथी' : 'KalaAI Copilot'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#48454f] leading-relaxed">
            {isHindi
              ? 'अपनी कलाकृति की फोटो लें। कलासेतु AI विरासत कथा तैयार करता है, उचित मूल्य निर्धारित करता है और वैश्विक निर्यात टैग बनाता है।'
              : 'Snap a photo of your craft. KalaAI drafts heritage narratives, computes ethical pricing, and generates global export tags.'}
          </p>
        </section>

        {/* Craft Image Upload & Live Analysis Zone */}
        <section className="flex flex-col gap-3">
          <div className="w-full rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-[#EBE7E4]/70 flex flex-col gap-4">
            {/* Media Showcase Card */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fae28b]/60 text-[#75631a]">
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span className="text-xs font-semibold">
                    {isHindi ? 'कच्चा कैमरा कैप्चर • असंपादित' : 'Raw Camera Capture • Unedited'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[#48454f] text-[11px] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6e5d13] animate-pulse"></span>
                    {isHindi ? 'कारीगर कार्यशाला' : 'Artisan Workshop'}
                  </span>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#dbdad7] shadow-sm">
                <img
                  src={rawImageUrl}
                  alt={
                    isHindi
                      ? 'जयपुर ब्लू पॉटरी उरली का कच्चा वर्कशॉप कैप्चर'
                      : 'Raw artisan workshop capture of Jaipur blue pottery urli bowl'
                  }
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#2C2C2C]/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] text-[#e3e2e0]">camera</span>
                  {isHindi ? 'मूल कार्यशाला फोटो' : 'Raw Workshop Photo'}
                </div>
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#2C2C2C] text-[11px] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[12px] text-[#48454f]">wb_sunny</span>
                  {isHindi ? 'प्राकृतिक अप्रकाशित रोशनी' : 'Unfiltered Ambient Light'}
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  showToast(
                    isHindi
                      ? 'स्टूडियो बैकड्रॉप अलग किया गया और कोबाल्ट ग्लेज निखारा गया!'
                      : 'Studio Backdrop Isolation & Glaze Focus Applied!',
                    'success'
                  )
                }
                className="w-full py-3 px-3 rounded-xl bg-[#423a6e] hover:bg-[#342e58] text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">magic_button</span>
                <span>{isHindi ? 'AI संवर्धन' : 'AI Enhance'}</span>
              </button>

              <button
                onClick={() =>
                  showToast(
                    isHindi
                      ? 'सुझाया गया बाज़ार मूल्य: ₹2,450 (उचित कारीगर मुनाफा +32%)'
                      : 'Suggested Marketplace Price: ₹2,450 (Ethical margin +32%)',
                    'info'
                  )
                }
                className="w-full py-3 px-3 rounded-xl bg-[#fae28b] hover:bg-[#f6d768] text-[#75631a] text-sm font-medium flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span>{isHindi ? 'उचित मूल्य निर्धारक' : 'Price Suggester'}</span>
              </button>

              <button
                onClick={() =>
                  showToast(
                    isHindi
                      ? 'ऊपरी दृश्य और निचली मोहर की फोटो अपलोड के लिए तैयार'
                      : 'Ready to upload top view and underside stamps',
                    'info'
                  )
                }
                className="w-full py-3 px-3 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-sm font-medium flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                <span>{isHindi ? 'अन्य कोण अपलोड' : 'Upload Angles'}</span>
              </button>

              <button
                onClick={handleVoiceToggle}
                className="w-full py-3 px-3 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-[#EBE7E4]/70 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
                <span>{isHindi ? 'बोलकर बताएं' : 'Voice Story'}</span>
              </button>
            </div>

            {/* Micro Specs Strip */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="flex flex-col items-center justify-center p-2.5 bg-[#F7F3EF] rounded-xl text-center border border-[#EBE7E4]/60">
                <span className="text-xs text-[#48454f]">{isHindi ? 'तकनीक' : 'Technique'}</span>
                <span className="text-sm font-semibold text-[#2C2C2C]">
                  {isHindi ? 'हाथ से ढाला' : 'Hand-Molded'}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 bg-[#F7F3EF] rounded-xl text-center border border-[#EBE7E4]/60">
                <span className="text-xs text-[#48454f]">{isHindi ? 'भट्ठी' : 'Firing'}</span>
                <span className="text-sm font-semibold text-[#2C2C2C]">
                  {isHindi ? 'धीमी भट्ठी' : 'Low Kiln'}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 bg-[#F7F3EF] rounded-xl text-center border border-[#EBE7E4]/60">
                <span className="text-xs text-[#48454f]">{isHindi ? 'जीआई क्लस्टर' : 'GI Cluster'}</span>
                <span className="text-sm font-semibold text-[#2C2C2C]">
                  {isHindi ? 'राजस्थान' : 'Rajasthan'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Prompts Horizontal Rail */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6e5d13] uppercase font-semibold">
              {isHindi ? 'कारीगर शॉर्टकट' : 'Artisan Shortcuts'}
            </span>
            <span className="text-xs text-[#48454f]">
              {isHindi ? 'और विकल्प देखें' : 'Swipe for more'}
            </span>
          </div>

          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => {
                setChatInputText(
                  isHindi
                    ? '18 घंटे के कारीगर श्रम और कच्चे माल का उचित मूल्य ब्रेकडाउन बताएं।'
                    : 'Calculate fair price and breakdown for 18h artisan labor.'
                );
                showToast(
                  isHindi ? 'प्रॉम्प्ट लोड हुआ: उचित लाभ की गणना' : 'Prompt loaded: Fair Margin Calculation',
                  'info'
                );
              }}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fae28b] text-[#75631a] text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">currency_rupee</span>
              <span>{isHindi ? 'उचित लाभ की गणना' : 'Calculate Fair Margin'}</span>
            </button>

            <button
              onClick={() => {
                setChatInputText(
                  isHindi
                    ? 'द्विभाषी हिन्दी और अंग्रेज़ी में प्रामाणिक शिल्प विवरण लिखें।'
                    : 'Write bilingual Hindi and English artisan craft description.'
                );
                showToast(
                  isHindi ? 'प्रॉम्प्ट लोड हुआ: हिन्दी व अंग्रेज़ी विवरण' : 'Prompt loaded: Hindi & English Story',
                  'info'
                );
              }}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#2C2C2C] text-xs font-semibold shadow-2xs border border-[#EBE7E4]/70 active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">translate</span>
              <span>{isHindi ? 'हिन्दी व अंग्रेज़ी विवरण' : 'Hindi & English Story'}</span>
            </button>

            <button
              onClick={() => {
                setChatInputText(
                  isHindi
                    ? 'प्रमाणित जीआई प्रमाणपत्र #RAJ-BP-408 संलग्न करें।'
                    : 'Attach verified GI Certificate #RAJ-BP-408'
                );
                showToast(
                  isHindi ? 'प्रॉम्प्ट लोड हुआ: जीआई टैग सत्यापन' : 'Prompt loaded: GI Tag Verification',
                  'info'
                );
              }}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D3E0D7] text-[#111e17] text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>{isHindi ? 'जीआई टैग प्रमाणन जोड़ें' : 'Attach GI Tag Verification'}</span>
            </button>

            <button
              onClick={() => {
                setChatInputText(
                  isHindi
                    ? 'त्योहारी और अंतरराष्ट्रीय खरीदारों के लिए उच्च सर्च कीवर्ड तैयार करें।'
                    : 'Generate high-traffic SEO keywords for international buyers.'
                );
                showToast(
                  isHindi ? 'प्रॉम्प्ट लोड हुआ: वैश्विक सर्च टैग' : 'Prompt loaded: Global SEO Tags',
                  'info'
                );
              }}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e6deff] text-[#1c1246] text-xs font-semibold shadow-2xs active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">travel_explore</span>
              <span>{isHindi ? 'वैश्विक सर्च टैग' : 'Global SEO Tags'}</span>
            </button>
          </div>
        </section>

        {/* Studio Copilot Conversational Workspace */}
        <section className="flex flex-col gap-3">
          {/* Stream Panel Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-full bg-[#5a5187] flex items-center justify-center text-[#d2c8ff]">
                <span className="material-symbols-outlined text-[20px]">volume_up</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#bacabf] animate-pulse"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-[#2C2C2C]">
                    {isHindi ? 'स्टूडियो साथी' : 'Studio Copilot'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#d6e7db] text-[#111e17] text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#36453c]"></span>
                    {isHindi ? 'आवाज़ सक्रिय' : 'Voice Active'}
                  </span>
                </div>
                <p className="text-xs text-[#48454f] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#6e5d13]">graphic_eq</span>
                  {isHindi ? 'हिन्दी में स्वचालित आवाज़' : 'Auto-speaking in English / Hindi'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextLang = isHindi ? 'en' : 'hi';
                  setLanguage(nextLang);
                  showToast(
                    nextLang === 'hi'
                      ? 'आवाज़ और भाषा हिन्दी में सेट की गई'
                      : 'Voice and language set to English',
                    'info'
                  );
                }}
                className="px-2.5 py-1 rounded-full bg-[#e6deff] text-[#1c1246] text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer hover:bg-[#d2c8ff]"
                id="lang-toggle-btn"
                type="button"
                title={isHindi ? 'अंग्रेज़ी में बदलें' : 'Switch to Hindi'}
              >
                <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                <span>{isHindi ? '🔊 हिन्दी • सक्रिय' : '🔊 English Active'}</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex flex-col gap-4">
            {/* Message 1 (Artisan Voice Note) */}
            <div className="flex items-end justify-end gap-2">
              <div className="p-4 rounded-2xl rounded-tr-xs bg-[#2C2C2C] text-white max-w-[88%] shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white/10 rounded-full">
                  <button
                    onClick={() =>
                      togglePlay(
                        'voice-1',
                        isHindi
                          ? 'भैया इसकी फोटो साफ़ कर दो स्टूडियो जैसी और अच्छा सा विवरण बना दो।'
                          : 'Please clean up this craft photo to studio quality and draft a heritage description.'
                      )
                    }
                    type="button"
                    className="w-7 h-7 rounded-full bg-[#fae28b] text-[#75631a] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
                    title={isHindi ? 'सुनें' : 'Play'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {playingAudioId === 'voice-1' ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-[#fae28b] animate-pulse">
                      graphic_eq
                    </span>
                    <span className="text-xs text-white truncate">
                      {isHindi ? 'कारीगर आवाज़ नोट • 0:11s' : 'Artisan Voice Note • 0:11s'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#e3e2e0] pr-2 flex-shrink-0">
                    {isHindi ? 'हिन्दी' : 'Hindi'}
                  </span>
                </div>
                <p className="text-sm italic text-white/95 leading-relaxed">
                  {isHindi
                    ? '“भैया इसकी फोटो साफ़ कर दो स्टूडियो जैसी और अच्छा सा विवरण बना दो...”'
                    : '“Bhaiya iski photo saaf kardo studio jaisi aur accha sa description bana do...”'}
                </p>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <span className="material-symbols-outlined text-[13px] text-[#dbdad7]">done_all</span>
                  <span className="text-xs text-[#dbdad7]">10:41 AM</span>
                </div>
              </div>
            </div>

            {/* Message 2 (KalaAI response - Studio Photo Polish) */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#5a5187] flex items-center justify-center text-[#d2c8ff] flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              </div>
              <div className="flex flex-col gap-2 max-w-[92%] w-full">
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white shadow-sm border border-[#EBE7E4]/70 text-[#2C2C2C] flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-[#e6deff]/40 rounded-full text-[#2C2C2C]">
                    <button
                      onClick={() =>
                        togglePlay(
                          'voice-2',
                          isHindi
                            ? 'मैंने आपकी वर्कबेंच फोटो को स्टूडियो स्तर के कैटलॉग शॉट में बदल दिया है, जिसमें शुद्ध सफेद बैकग्राउंड, कोबाल्ट शीन और संतुलित प्रकाश शामिल है।'
                            : 'I enhanced your workbench photo into a catalog-grade studio shot with seamless white background, crisp ceramic gloss, and diffused lighting.'
                        )
                      }
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#423a6e] text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
                      title={isHindi ? 'आवाज़ सुनें' : 'Play voice'}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {playingAudioId === 'voice-2' ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-[#423a6e]">
                        graphic_eq
                      </span>
                      <span className="text-xs truncate font-medium">
                        {isHindi ? 'कलासेतु AI आवाज़: हिन्दी' : 'KalaAI Voice: English • Hindi'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#423a6e] font-semibold pr-2 flex-shrink-0">
                      0:18s
                    </span>
                  </div>

                  <p className="text-sm text-[#1a1c1a] leading-relaxed">
                    {isHindi
                      ? 'मैंने आपकी वर्कबेंच फोटो को स्टूडियो स्तर के कैटलॉग शॉट में बदल दिया है, जिसमें शुद्ध सफेद बैकग्राउंड, कोबाल्ट शीन और संतुलित प्रकाश शामिल है।'
                      : 'I enhanced your workbench photo into a catalog-grade studio shot with seamless white background, crisp ceramic gloss, and diffused lighting.'}
                  </p>

                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-white ring-2 ring-[#e6deff]">
                    <img
                      src={isolatedStudioUrl}
                      alt={
                        isHindi
                          ? 'सफेद स्टूडियो बैकग्राउंड पर अलग की गई हस्तनिर्मित भारतीय जयपुर ब्लू पॉटरी फ्लोरल उरली बाउल'
                          : 'Handmade authentic Indian Jaipur blue pottery floral urli bowl isolated on white studio background'
                      }
                      className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <span className="px-2 py-1 rounded-full bg-[#423a6e] text-white text-[11px] font-semibold shadow-sm flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                        {isHindi
                          ? 'AI स्टूडियो फिनिश • सफेद BG'
                          : 'AI Studio Polish • Pure White BG (Isolated)'}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-[#d6e7db] text-[#111e17] text-[11px] font-semibold">
                        {isHindi ? '8K स्पष्ट फोकस' : '8K Sharp Focus'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        togglePlay(
                          'voice-2-rationale',
                          isHindi
                            ? 'प्राकृतिक प्रकाश को कोबाल्ट नीले ब्रशवर्क और नक्काशीदार पुष्प वक्रता को निखारने के लिए संतुलित किया गया है।'
                            : 'Natural lighting calibrated to highlight cobalt blue brushwork and hand-carved floral curvature.'
                        )
                      }
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fae28b] text-[#75631a] text-xs font-medium shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      <span>
                        {isHindi ? 'संवर्धन का आधार सुनें' : 'Listen to enhancement rationale'}
                      </span>
                    </button>
                    <span className="text-xs text-[#36453c] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      {isHindi ? 'बाज़ार हेतु तैयार' : 'Ready for Marketplaces'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message 3 (Artisan Voice Note) */}
            <div className="flex items-end justify-end gap-2">
              <div className="p-4 rounded-2xl rounded-tr-xs bg-[#2C2C2C] text-white max-w-[88%] shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2 p-1.5 bg-white/10 rounded-full">
                  <button
                    onClick={() =>
                      togglePlay(
                        'voice-3',
                        isHindi
                          ? 'यह नीली मिट्टी का उरली है, हाथ से बना हुआ फूलों का डिज़ाइन, मंदिर और ड्राइंग रूम के लिए अच्छा है। सामग्री लागत लगभग ₹420 आई है और 18 घंटे लगे हैं।'
                          : 'This is a blue pottery urli, hand-molded with floral motifs, ideal for mandirs and living rooms. Material cost is approximately ₹420 and took 18 artisan hours.'
                      )
                    }
                    type="button"
                    className="w-7 h-7 rounded-full bg-[#fae28b] text-[#75631a] flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
                    title={isHindi ? 'सुनें' : 'Play'}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {playingAudioId === 'voice-3' ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <span className="material-symbols-outlined text-[16px] text-[#fae28b] animate-pulse">
                      graphic_eq
                    </span>
                    <span className="text-xs text-white truncate">
                      {isHindi ? 'कारीगर आवाज़ नोट • 0:14s' : 'Artisan Voice Note • 0:14s'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#e3e2e0] pr-2 flex-shrink-0">
                    {isHindi ? 'हिन्दी' : 'Hindi'}
                  </span>
                </div>
                <p className="text-sm italic text-white/95 leading-relaxed">
                  {isHindi
                    ? '“यह नीली मिट्टी का उरली है, हाथ से बना हुआ फूलों का डिज़ाइन, मंदिर और ड्राइंग रूम के लिए अच्छा है। सामग्री लागत लगभग ₹420 आई है और 18 घंटे लगे हैं...”'
                    : '“Yeh neeli mitti ka urli hai, hath se bana hua phoolon ka design, mandir aur drawing room ke liye accha hai. Material cost lagbhag ₹420 aayi hai aur 18 ghante lage hain...”'}
                </p>
                <div className="flex items-center justify-end gap-1 pt-1">
                  <span className="material-symbols-outlined text-[13px] text-[#dbdad7]">done_all</span>
                  <span className="text-xs text-[#dbdad7]">10:42 AM</span>
                </div>
              </div>
            </div>

            {/* Message 4 (KalaAI response - Title & Heritage Story) */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#5a5187] flex items-center justify-center text-[#d2c8ff] flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
              </div>
              <div className="flex flex-col gap-2 max-w-[92%]">
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white shadow-sm border border-[#EBE7E4]/70 text-[#2C2C2C] flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-[#e6deff]/40 rounded-full text-[#2C2C2C]">
                    <button
                      onClick={() =>
                        togglePlay(
                          'voice-4',
                          isHindi
                            ? 'हस्तनिर्मित जयपुर ब्लू पॉटरी फ्लोरल उरली बाउल। सांगानेर में राधिका देवी द्वारा 18 घंटे की उत्कृष्ट कारीगरी और जीआई प्रमाणन के साथ निर्मित।'
                            : 'Handcrafted Jaipur Blue Pottery Floral Urli Bowl. Handmade with love by Radhika Devi in Sanganer.'
                        )
                      }
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#423a6e] text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
                      title={isHindi ? 'आवाज़ सुनें' : 'Play'}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {playingAudioId === 'voice-4' ? 'pause' : 'play_arrow'}
                      </span>
                    </button>
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-[16px] text-[#423a6e]">
                        graphic_eq
                      </span>
                      <span className="text-xs truncate font-medium">
                        {isHindi ? 'कलासेतु AI आवाज़: शिल्प विवरण' : 'KalaAI Voice: Hindi • English'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#423a6e] font-semibold pr-2 flex-shrink-0">
                      0:28s
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 border-b border-[#F5F5F3] pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#6e5d13] uppercase font-semibold">
                        {isHindi ? 'सर्च-अनुकूलित शीर्षक (SEO Title)' : 'SEO-Optimized Title'}
                      </span>
                      <span className="text-[11px] text-[#36453c] bg-[#d6e7db] px-2 py-0.5 rounded-full font-semibold">
                        {isHindi ? 'उच्च सर्च मांग' : 'High Search Traffic'}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-[#2C2C2C] leading-snug">
                      {isHindi
                        ? 'हस्तनिर्मित जयपुर ब्लू पॉटरी फ्लोरल उरली बाउल – मंदिर और ड्राइंग रूम हेतु फारसी पुष्प रूपांकन'
                        : 'Handcrafted Jaipur Blue Pottery Floral Urli Bowl – Persian Floral Motifs for Mandir & Living Room'}
                    </h4>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-[#6e5d13] uppercase font-semibold">
                      {isHindi ? 'विरासत शिल्प कथा' : 'Heritage Craft Story'}
                    </span>
                    <blockquote className="p-3 rounded-xl bg-[#F7F3EF] text-[#2C2C2C] italic text-xs sm:text-sm leading-relaxed border-l-3 border-[#423a6e]">
                      {isHindi
                        ? '“सांगानेर में राधिका देवी द्वारा अत्यंत प्रेम व निष्ठा से निर्मित, यह पारंपरिक नीली मिट्टी की उरली ₹420 की प्राकृतिक सामग्री (मुल्तानी मिट्टी, क्वार्ट्ज पाउडर और प्राकृतिक कोबाल्ट ग्लेज) के साथ 18 घंटे की निरंतर कारीगरी से गढ़ी गई है। नाजुक फारसी पुष्प रूपांकनों से सजी यह उरली आपके घरेलू मंदिर और बैठक में ताजे गेंदे के फूलों और तैरते दीयों के लिए एक मंगलकारी पात्र है।”'
                        : '“Handmade with love by Radhika Devi in Sanganer, this traditional neeli mitti (blue pottery) urli is crafted over 18 hours of meticulous artistry with ₹420 in natural raw materials—fuller’s earth, quartz stone, and natural cobalt glaze. Adorned with delicate Persian floral patterns, it is designed as an auspicious decorative vessel for fresh marigolds and floating diyas in your home mandir and living room.”'}
                    </blockquote>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D3E0D7] text-[#111e17] text-xs font-semibold">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      {isHindi ? 'जीआई टैग #RAJ-BP-408' : 'GI Tag #RAJ-BP-408'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[#1a1c1a] text-xs">
                      {isHindi ? '#जयपुरपॉटरी' : '#JaipurPottery'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[#1a1c1a] text-xs">
                      {isHindi ? '#हस्तनिर्मितउरली' : '#HandcraftedUrli'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[#1a1c1a] text-xs">
                      {isHindi ? '#उत्सवसजावट' : '#FestiveHomeDecor'}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#F5F5F3] text-[#1a1c1a] text-xs">
                      {isHindi ? '#कारीगरनिर्मित' : '#ArtisanMade'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message 5 (KalaAI Price Suggester) */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#fae28b] flex items-center justify-center text-[#75631a] flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-[15px]">calculate</span>
              </div>
              <div className="flex flex-col gap-2 max-w-[92%]">
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white shadow-sm border border-[#EBE7E4]/70 text-[#2C2C2C] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#6e5d13]">
                        payments
                      </span>
                      <span className="text-base font-semibold text-[#2C2C2C]">
                        {isHindi ? 'AI उचित मूल्य निर्धारक' : 'AI Price Suggester'}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        togglePlay(
                          'voice-5',
                          isHindi
                            ? 'सुझाई गई बाज़ार कीमत ₹2,450। कच्चा माल ₹420, 18 घंटे का कारीगर पारिश्रमिक ₹1,800, उचित लाभ ₹150, सुरक्षित पैकेजिंग बफ़र ₹80।'
                            : 'Suggested price ₹2,450. Material ₹420, 18 hours artisan labor ₹1,800, fair profit margin ₹150, shipping buffer ₹80.'
                        )
                      }
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fae28b] text-[#75631a] text-xs font-medium shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">volume_up</span>
                      <span>
                        {isHindi ? 'मूल्य निर्धारण का आधार सुनें' : 'Listen to Pricing Rationale'}
                      </span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F3EF] flex items-center justify-between border border-[#EBE7E4]/60">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#48454f]">
                        {isHindi ? 'सुझाया गया बाज़ार मूल्य' : 'Suggested Marketplace Price'}
                      </span>
                      <span className="text-2xl font-bold text-[#2C2C2C] leading-tight">₹2,450</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full bg-[#d6e7db] text-[#111e17] text-[11px] font-semibold">
                        {isHindi ? 'नैतिक फेयर-ट्रेड प्रमाणित' : 'Ethical Fair-Trade Certified'}
                      </span>
                      <span className="text-xs text-[#36453c] font-semibold mt-1">
                        {isHindi ? '+32% कारीगर मुनाफा' : '+32% Artisan Profit Margin'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F5F5F3]">
                    <div className="flex flex-col p-2 rounded-xl bg-[#F5F5F3]">
                      <span className="text-xs text-[#48454f]">{isHindi ? 'कच्चा माल' : 'Raw Materials'}</span>
                      <span className="text-sm font-semibold text-[#2C2C2C]">₹420</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-xl bg-[#F5F5F3]">
                      <span className="text-xs text-[#48454f]">{isHindi ? 'कारीगर पारिश्रमिक' : 'Artisan Labor'}</span>
                      <span className="text-sm font-semibold text-[#2C2C2C]">
                        {isHindi ? '₹1,800 (18 घंटे @ ₹100/घंटा)' : '₹1,800 (18h @ ₹100/h)'}
                      </span>
                    </div>
                    <div className="flex flex-col p-2 rounded-xl bg-[#F5F5F3]">
                      <span className="text-xs text-[#48454f]">{isHindi ? 'उचित मुनाफा' : 'Fair Margin'}</span>
                      <span className="text-sm font-semibold text-[#2C2C2C]">₹150 (32%)</span>
                    </div>
                    <div className="flex flex-col p-2 rounded-xl bg-[#F5F5F3]">
                      <span className="text-xs text-[#48454f]">
                        {isHindi ? 'सुरक्षित परिवहन बफ़र' : 'Fragile Shipping Buffer'}
                      </span>
                      <span className="text-sm font-semibold text-[#2C2C2C]">₹80</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message 6 (KalaAI 1-Click Publish & Marketplace Exporter) */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#5a5187] flex items-center justify-center text-[#d2c8ff] flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-[15px]">campaign</span>
              </div>
              <div className="flex flex-col gap-3 max-w-[92%] w-full">
                <div className="p-4 rounded-2xl rounded-tl-xs bg-white shadow-sm border border-[#EBE7E4]/70 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-[#F5F5F3] rounded-full text-[#2C2C2C]">
                    <button
                      onClick={() =>
                        togglePlay(
                          'voice-6',
                          isHindi
                            ? 'कलासेतु पर एक क्लिक में सीधे प्रकाशित करें, या अमेज़न, फ्लिपकार्ट, व्हाट्सएप और सरकारी जेम पोर्टल के लिए लिस्टिंग निर्यात करें।'
                            : 'Publish directly to KalaSetu in one click, or export to Amazon, Flipkart, WhatsApp and government portals.'
                        )
                      }
                      type="button"
                      className="w-7 h-7 rounded-full bg-[#423a6e] text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform cursor-pointer"
                      title={isHindi ? 'आवाज़ सुनें' : 'Play voice'}
                    >
                      <span className="material-symbols-outlined text-[16px]">volume_up</span>
                    </button>
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                      <span className="text-xs truncate font-medium text-[#2C2C2C]">
                        {isHindi ? 'कलासेतु AI आवाज़: प्रकाशन विकल्प' : 'KalaAI Voice: Dual Audio Prompt • 0:14s'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#48454f] pr-2 flex-shrink-0">0:14s</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-[#2C2C2C] font-medium">
                      {isHindi
                        ? 'कलासेतु पर एक क्लिक में सीधे प्रकाशित करें, या बाहरी प्लेटफॉर्म के लिए निर्यात लिस्टिंग तैयार करें?'
                        : 'Publish directly to KalaSetu in one click, or should I generate export-ready listings for external channels?'}
                    </p>
                    <p className="text-xs text-[#48454f] italic">
                      {isHindi
                        ? '“एक टैप में आपकी लाइव दुकान पर उपलब्ध हो जाएगा।”'
                        : '“कलासेतु पर एक क्लिक में प्रकाशित करें या अन्य प्लेटफ़ॉर्म के लिए टेम्प्लेट तैयार करें?”'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={handlePublishToKalaSetu}
                      type="button"
                      id="publish-marketplace-btn"
                      className={`w-full py-3 px-4 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer ${
                        isPublished ? 'bg-[#36453c]' : 'bg-[#2C2C2C] hover:bg-[#423a6e]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isPublished ? 'check_circle' : 'rocket_launch'}
                      </span>
                      <span>
                        {isPublished
                          ? isHindi
                            ? '✓ कलासेतु पर लाइव है! कैटलॉग में देखें'
                            : '✓ Live on KalaSetu! View in Catalogue'
                          : isHindi
                          ? 'कलासेतु पर प्रकाशित करें (1-क्लिक लाइव)'
                          : 'Publish to KalaSetu (1-Click Live)'}
                      </span>
                    </button>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#6e5d13] uppercase font-semibold">
                        {isHindi ? 'निर्यात टेम्प्लेट विकल्प' : 'Export Template Options'}
                      </span>
                      <span className="text-xs text-[#48454f]">
                        {isHindi ? 'कॉपी के लिए तैयार' : 'Ready to copy'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { name: 'Amazon', icon: 'storefront', color: 'text-[#6e5d13]' },
                        { name: 'Flipkart', icon: 'shopping_bag', color: 'text-[#423a6e]' },
                        { name: 'GeM Portal', icon: 'account_balance', color: 'text-[#36453c]' },
                        { name: 'IndiaMart', icon: 'business_center', color: 'text-[#6e5d13]' },
                        { name: 'WhatsApp', icon: 'chat', color: 'text-[#36453c]' },
                        { name: 'FB Market', icon: 'store', color: 'text-[#423a6e]' },
                      ].map((item) => (
                        <button
                          key={item.name}
                          onClick={() => handleExport(item.name)}
                          type="button"
                          className={`py-2 px-1 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer border ${
                            selectedExport === item.name ? 'border-[#423a6e] bg-[#e6deff]/40' : 'border-[#EBE7E4]/70'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${item.color}`}>
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-2 rounded-xl bg-[#fae28b]/60 text-[#75631a] flex items-center justify-center gap-1.5 text-center">
                      <span className="material-symbols-outlined text-[16px] text-[#6e5d13]">mic</span>
                      <span className="text-xs font-medium">
                        {isHindi
                          ? 'बोलें "कलासेतु पर प्रकाशित करें" या "अमेज़न पर निर्यात करें"'
                          : 'Say "Publish KalaSetu" or "Export to Amazon" / या बोलकर कमांड दें'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          showToast(
                            isHindi
                              ? 'शिल्प विवरण संपादक खोला गया'
                              : 'Opened craft details editor',
                            'info'
                          );
                          setChatInputText(
                            isHindi
                              ? 'कृपया आयाम को 10 इंच व्यास और 1.8 किग्रा में अपडेट करें।'
                              : 'Please update the dimensions to 10 inches diameter.'
                          );
                        }}
                        type="button"
                        className="w-full py-2 px-3 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                        <span>{isHindi ? 'पहले विवरण संपादित करें' : 'Edit Details First'}</span>
                      </button>

                      <button
                        onClick={() =>
                          showToast(
                            isHindi
                              ? 'शिल्प का ड्राफ्ट आपके स्टूडियो इतिहास में सहेज लिया गया!'
                              : 'Saved craft draft to your Studio history!',
                            'success'
                          )
                        }
                        type="button"
                        className="w-full py-2 px-3 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
                        <span>{isHindi ? 'ड्राफ्ट के रूप में सहेजें' : 'Save as Draft'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic extra messages */}
            {extraMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-[#5a5187] flex items-center justify-center text-[#d2c8ff] flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[85%] shadow-2xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2C2C2C] text-white rounded-tr-xs'
                      : 'bg-white text-[#2C2C2C] rounded-tl-xs border border-[#EBE7E4]/70'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="text-[10px] text-right block mt-1 opacity-70">{msg.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Chat Input Module (Above App Navigation Dock) */}
        <section className="sticky bottom-20 z-30 pt-1">
          <div className="flex flex-col gap-1.5">
            <div className="p-1.5 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-[#EBE7E4]/80 flex items-center gap-2">
              <button
                onClick={() =>
                  showToast(
                    isHindi
                      ? 'शिल्प के अन्य कोणों और विवरणों की फोटो लें'
                      : 'Take additional angle photos of craft details',
                    'info'
                  )
                }
                aria-label={isHindi ? 'अतिरिक्त फोटो जोड़ें' : 'Add visual reference'}
                className="w-10 h-10 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#2C2C2C] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 cursor-pointer"
                type="button"
                title={isHindi ? 'फोटो जोड़ें' : 'Add photo'}
              >
                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  className="w-full h-11 pl-3 pr-9 rounded-full bg-[#F5F5F3] text-[#2C2C2C] text-sm placeholder:text-[#48454f] focus:outline-none focus:ring-1 focus:ring-[#423a6e]"
                  id="chat-input"
                  placeholder={
                    isHindi
                      ? 'माइक पर बोलें या हिन्दी / अंग्रेज़ी में लिखें...'
                      : 'Tap mic or type in Hindi / English...'
                  }
                  type="text"
                />
                <button
                  onClick={() => {
                    const nextLang = isHindi ? 'en' : 'hi';
                    setLanguage(nextLang);
                    showToast(
                      nextLang === 'hi'
                        ? 'भाषा बदलकर हिन्दी कर दी गई है'
                        : 'Language switched to English',
                      'info'
                    );
                  }}
                  aria-label={isHindi ? 'भाषा बदलें' : 'Voice language toggle'}
                  className="absolute right-2 w-7 h-7 rounded-full flex items-center justify-center text-[#48454f] hover:text-[#2C2C2C] active:scale-90 transition-transform cursor-pointer"
                  type="button"
                  title={isHindi ? 'अंग्रेज़ी में बदलें' : 'Switch to Hindi'}
                >
                  <span className="material-symbols-outlined text-[18px]">translate</span>
                </button>
              </div>

              <button
                onClick={handleVoiceToggle}
                aria-label={isHindi ? 'बोलकर बताएं' : 'Speak voice prompt'}
                className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 shadow-sm relative cursor-pointer ${
                  isRecording
                    ? 'bg-[#BA1A1A] text-white'
                    : 'bg-[#fae28b] hover:bg-[#f6d768] text-[#75631a]'
                }`}
                id="voice-speech-btn"
                title={isHindi ? 'बोलने के लिए टैप करें' : 'Tap to Speak'}
                type="button"
              >
                <span className="material-symbols-outlined text-[22px]">
                  {isRecording ? 'graphic_eq' : 'mic'}
                </span>
                {!isRecording && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#6e5d13] animate-ping"></span>
                )}
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!chatInputText.trim()}
                aria-label={isHindi ? 'संदेश भेजें' : 'Send query'}
                className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 shadow-sm cursor-pointer ${
                  chatInputText.trim()
                    ? 'bg-[#2C2C2C] hover:bg-black text-white'
                    : 'bg-[#76767F]/40 text-white cursor-not-allowed'
                }`}
                id="send-msg-btn"
                type="button"
                title={isHindi ? 'भेजें' : 'Send'}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>

            <div className="flex items-center justify-between px-3 py-1 rounded-full bg-[#f4f3f1] text-[#48454f] text-xs border border-[#EBE7E4]/60">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-[15px] text-[#6e5d13] animate-pulse">
                  graphic_eq
                </span>
                <span className="truncate">
                  {isHindi
                    ? 'बोलने के लिए माइक दबाएं • आवाज़ पहचान सक्षम'
                    : 'बोलने के लिए माइक दबाएं • Tap mic to speak query'}
                </span>
              </div>
              <span className="text-[11px] text-[#6e5d13] font-semibold flex-shrink-0">
                {isHindi ? 'हिन्दी + अंग्रेज़ी STT' : 'Hindi + EN STT'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
