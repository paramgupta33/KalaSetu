import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Languages, Sparkles, Copy, Check, Mic } from 'lucide-react';

export const AutoCatalogerModal: React.FC = () => {
  const { activeModal, closeModal, showToast } = useApp();
  const [inputText, setInputText] = useState(
    'यह हाथ से बना मिट्टी का फूलदान है। इसपे प्राकृतिक रंगों से दीवाली के दीये बने हैं और यह 10 इंच का है।'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputResult, setOutputResult] = useState({
    title: 'Hand-painted Earthen Terracotta Diya Vase (10-Inch)',
    description:
      'Imbued with age-old craft heritage, this artisanal terracotta clay vase is hand-thrown on the potter’s wheel in Rajasthan. Meticulously hand-painted with festive Diwali diya motifs using natural ochre and gold metallic mineral pigments, it brings timeless festive elegance to any living space or puja altar.',
    materials: 'Natural Riverbank Clay, Wheel-thrown, Mineral Pigments',
    tags: ['terracotta', 'diwali decor', 'handmade vase', 'traditional pottery'],
  });

  if (activeModal !== 'auto_cataloger') return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setOutputResult({
        title: 'Artisanal Hand-Turned Terracotta Vase with Festive Gold Diya Accents',
        description: `Crafted from natural alluvial earthenware clay, this 10-inch vase features delicate wheel-spun ridges and hand-painted festive Diya motifs. Each piece reflects authentic artisan heritage, dried under the desert sun and kiln-fired for durability.`,
        materials: 'Pure Natural Clay, Non-toxic Earth Colors, Water-sealed',
        tags: ['artisan pottery', 'handcrafted', 'diwali gift', 'heritage clay', 'eco-friendly'],
      });
      showToast('Catalog description generated in English & Hindi!', 'success');
    }, 800);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(
      `${outputResult.title}\n\n${outputResult.description}\n\nMaterials: ${outputResult.materials}`
    );
    showToast('Catalog text copied to clipboard!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-[#EBE7E4] p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE7E4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D3E0D7] text-[#252B28] flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2C2C2C]">AI Auto-Cataloger</h3>
              <p className="text-[11px] text-[#636466]">Speak your language, we write it for global buyers</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-1 rounded-full text-[#76767F] hover:bg-[#F5F5F3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-[#2C2C2C]">
            Describe your craft (in Hindi, Marathi, or English)
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#EBE7E4] text-xs sm:text-sm text-[#222222] focus:ring-1 focus:ring-[#5A5187]"
            />
            <button
              onClick={() => showToast('Voice recorded: "हाथ से बनी टेराकोटा फूलदान..."', 'info')}
              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#7D6B21]"
              title="Voice Input Simulation"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F4E39E]" />
            <span>{isGenerating ? 'Drafting Global Story...' : 'Generate Catalog & SEO Listing'}</span>
          </button>
        </div>

        {/* Generated Output */}
        <div className="mt-5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EBE7E4] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5187]">
              Generated Buyer Story
            </span>
            <button
              onClick={handleCopy}
              className="text-xs text-[#2C2C2C] font-semibold hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5 text-[#76767F]" />
              <span>Copy</span>
            </button>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">{outputResult.title}</h4>
            <p className="text-xs text-[#636466] mt-1.5 leading-relaxed">{outputResult.description}</p>
          </div>

          <div className="pt-2 border-t border-[#EBE7E4] text-[11px] text-[#2C2C2C]">
            <strong>Materials:</strong> {outputResult.materials}
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {outputResult.tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] bg-white border border-[#EBE7E4] text-[#636466] px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
