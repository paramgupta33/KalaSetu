import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, QrCode, Download, Share2, ShieldCheck } from 'lucide-react';

export const QrCodeModal: React.FC = () => {
  const { activeModal, modalData, closeModal, showToast } = useApp();

  if (activeModal !== 'qr_code' || !modalData) return null;

  const product = modalData;

  const handleDownload = () => {
    showToast(`QR Certificate downloaded for ${product.sku}`, 'success');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(`https://kalasetu.art/verify/${product.sku}`);
    showToast('Verification URL copied to clipboard!', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-[#EBE7E4] p-6 text-center relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 p-1 rounded-full text-[#76767F] hover:bg-[#F5F5F3]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#D3E0D7] text-[#4A5950] flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-[#2C2C2C]">Craft Authenticity Passport</h3>
        <p className="text-xs text-[#636466] mt-1">{product.title.en}</p>
        <span className="inline-block font-mono text-[11px] font-bold text-[#5A5187] bg-[#C5BEFF]/30 px-2 py-0.5 rounded mt-1">
          SKU: {product.sku}
        </span>

        {/* Generated SVG QR Code Graphic */}
        <div className="my-5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EBE7E4] flex flex-col items-center justify-center">
          <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none">
            {/* Outer bounds & corners */}
            <rect x="5" y="5" width="28" height="28" rx="4" fill="#2C2C2C" />
            <rect x="9" y="9" width="20" height="20" rx="2" fill="#FAF9F6" />
            <rect x="13" y="13" width="12" height="12" rx="2" fill="#2C2C2C" />

            <rect x="67" y="5" width="28" height="28" rx="4" fill="#2C2C2C" />
            <rect x="71" y="9" width="20" height="20" rx="2" fill="#FAF9F6" />
            <rect x="75" y="13" width="12" height="12" rx="2" fill="#2C2C2C" />

            <rect x="5" y="67" width="28" height="28" rx="4" fill="#2C2C2C" />
            <rect x="9" y="71" width="20" height="20" rx="2" fill="#FAF9F6" />
            <rect x="13" y="75" width="12" height="12" rx="2" fill="#2C2C2C" />

            {/* Pattern Dots */}
            <circle cx="48" cy="12" r="3" fill="#2C2C2C" />
            <circle cx="56" cy="18" r="3" fill="#2C2C2C" />
            <circle cx="40" cy="24" r="3" fill="#2C2C2C" />
            <circle cx="50" cy="32" r="3" fill="#2C2C2C" />
            
            <circle cx="20" cy="48" r="3" fill="#2C2C2C" />
            <circle cx="32" cy="50" r="3" fill="#2C2C2C" />
            <circle cx="48" cy="50" r="4" fill="#7D6B21" />
            <circle cx="64" cy="48" r="3" fill="#2C2C2C" />
            <circle cx="80" cy="50" r="3" fill="#2C2C2C" />

            <circle cx="40" cy="68" r="3" fill="#2C2C2C" />
            <circle cx="56" cy="74" r="3" fill="#2C2C2C" />
            <circle cx="82" cy="68" r="3" fill="#2C2C2C" />
            <circle cx="70" cy="80" r="3" fill="#2C2C2C" />
            <circle cx="88" cy="85" r="3" fill="#2C2C2C" />
          </svg>
          <span className="text-[10px] text-[#76767F] font-mono mt-2">Scan to verify artisan GI provenance</span>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl border border-[#EBE7E4] hover:bg-[#F5F5F3] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};
