import React from 'react';
import { 
  X, 
  Award, 
  ShieldCheck, 
  QrCode, 
  Download, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Building2
} from 'lucide-react';
import { BuyerOrder } from '../../types';

interface AuthenticityCertificateModalProps {
  order: BuyerOrder | null;
  onClose: () => void;
}

export const AuthenticityCertificateModal: React.FC<AuthenticityCertificateModalProps> = ({
  order,
  onClose,
}) => {
  if (!order) return null;

  const item = order.items[0]?.product;
  const certificateId = `GI-IND-2024-${order.id.replace(/[^0-9]/g, '') || '9481'}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      id="modal-authenticity-certificate"
    >
      <div className="bg-[#FFFDF7] border-4 border-[#7D6B21]/30 rounded-3xl max-w-xl w-full shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col p-6 sm:p-8">
        {/* Certificate Decorative Border */}
        <div className="absolute inset-2 border-2 border-[#7D6B21]/20 rounded-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between relative z-10 border-b border-[#EBE7E4] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF9E6] border border-[#F4E39E] text-[#7D6B21] flex items-center justify-center shadow-xs">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-extrabold tracking-widest text-[#7D6B21]">
                Geographical Indications Registry • India
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#2C2C2C] tracking-tight">
                Certificate of Handcraft Authenticity
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#D0D0D4] flex items-center justify-center text-[#48454F] hover:bg-[#F5F5F3]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate Body */}
        <div className="py-6 space-y-5 relative z-10 overflow-y-auto">
          <div className="text-center space-y-1">
            <p className="text-xs text-[#636466] italic">
              This document certifies that the craft item associated with Order #{order.id} is an authentic,
              non-mechanized work of cultural heritage crafted by registered generational artisans.
            </p>
            <div className="text-xs font-mono font-bold text-[#7D6B21] bg-[#FFF9E6] py-1 px-3 rounded-full inline-block border border-[#F4E39E]">
              {certificateId}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#EBE7E4] space-y-3 text-xs shadow-2xs">
            <div className="flex justify-between border-b border-[#FAF9F6] pb-2">
              <span className="text-[#636466]">Certified Craft:</span>
              <strong className="text-[#2C2C2C]">{item?.title.en || 'Heritage Handcraft Item'}</strong>
            </div>

            <div className="flex justify-between border-b border-[#FAF9F6] pb-2">
              <span className="text-[#636466]">Master Artisan Guild:</span>
              <strong className="text-[#2C2C2C]">{order.artisanName}</strong>
            </div>

            <div className="flex justify-between border-b border-[#FAF9F6] pb-2">
              <span className="text-[#636466]">Geographical Cluster:</span>
              <span className="font-semibold text-[#2C2C2C]">{order.artisanCluster}</span>
            </div>

            <div className="flex justify-between border-b border-[#FAF9F6] pb-2">
              <span className="text-[#636466]">Materials Provenance:</span>
              <span className="font-semibold text-[#2C2C2C]">
                {item?.materials?.join(', ') || '100% natural, ethically sourced organic earth materials'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-[#636466]">Fair-Trade Compensation:</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#137333]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                92% Direct Guild Revenue Guaranteed
              </span>
            </div>
          </div>

          {/* Verification Stamps */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9E6]/60 border border-[#F4E39E] text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg p-1 border border-[#D0D0D4] flex items-center justify-center">
                <QrCode className="w-8 h-8 text-[#2C2C2C]" />
              </div>
              <div>
                <div className="font-bold text-[#2C2C2C]">Blockchain Provenance Verified</div>
                <div className="text-[10px] text-[#636466]">Scan to view artisan video & cluster geo-tag</div>
              </div>
            </div>

            <div className="text-right">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#7D6B21] flex items-center justify-center text-[#7D6B21] font-bold text-[8px] uppercase text-center rotate-12 ml-auto">
                KalaSetu Verified
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#EBE7E4] flex items-center justify-between relative z-10">
          <div className="text-[10px] text-[#636466]">
            Issued under KalaSetu Artisan Guild Empowerment Charter
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
