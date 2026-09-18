import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ZoomIn, ZoomOut, MessageCircle, Download, Check } from 'lucide-react';

export const InspectPhotoModal: React.FC = () => {
  const { activeModal, modalData, closeModal, showToast } = useApp();
  const [zoomLevel, setZoomLevel] = useState(1);

  if (activeModal !== 'inspect_photo' || !modalData) return null;

  const { imageUrl, filename, note, customerName } = modalData;

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.6 : prev === 1.6 ? 2.2 : 1));
  };

  const handleWhatsApp = () => {
    showToast(`Proof confirmed! Contacting ${customerName} on WhatsApp.`, 'success');
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-[#EBE7E4] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE7E4] flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#2C2C2C]">
              Customer Reference Photo
            </h3>
            <p className="text-xs text-[#636466] mt-0.5">
              Uploaded by {customerName} • {filename}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleZoom}
              className="p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold flex items-center gap-1"
              title="Toggle Zoom"
            >
              <ZoomIn className="w-4 h-4" />
              <span>{zoomLevel}x</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-full text-[#76767F] hover:bg-[#F5F5F3]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Stage */}
        <div className="relative bg-[#1A1C1A] overflow-hidden flex items-center justify-center p-4 min-h-[300px] max-h-[50vh]">
          <img
            src={imageUrl}
            alt="Customer inspiration reference"
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-[46vh] max-w-full object-contain rounded-lg transition-transform duration-300"
          />
        </div>

        {/* Buyer Note Footnote */}
        <div className="p-4 sm:p-5 bg-[#FAF9F6] border-t border-[#EBE7E4] space-y-3">
          <div className="p-3 rounded-xl bg-white border border-[#DFCD7E] text-xs text-[#2C2C2C] italic">
            "{note}"
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => showToast(`Photo ${filename} saved to device!`, 'info')}
              className="px-3.5 py-2 rounded-xl border border-[#EBE7E4] hover:bg-[#F5F5F3] text-xs font-semibold text-[#222222] flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Photo</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#F4E39E]" />
              <span>Confirm & Send Proof on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
