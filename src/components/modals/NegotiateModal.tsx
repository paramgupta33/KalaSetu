import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Handshake, Send, IndianRupee } from 'lucide-react';

export const NegotiateModal: React.FC = () => {
  const { activeModal, modalData, closeModal, negotiateOrderPrice } = useApp();

  const [counterAmount, setCounterAmount] = useState('');
  const [justification, setJustification] = useState(
    'Due to intricate 24k metallic acrylic hand-detailing and rush festive timeline, the artisan commission fee is adjusted slightly.'
  );

  if (activeModal !== 'negotiate' || !modalData) return null;

  const order = modalData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(counterAmount) || order.totalAmount + 250;
    negotiateOrderPrice(order.id, val, justification);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#EBE7E4] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE7E4]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F4E39E] text-[#272105] flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#2C2C2C]">Negotiate Bespoke Commission</h3>
          </div>
          <button onClick={closeModal} className="p-1 rounded-full text-[#76767F] hover:bg-[#F5F5F3]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#EBE7E4] text-xs">
            <p className="text-[#636466]">
              Buyer: <strong className="text-[#2C2C2C]">{order.customerName}</strong> (#{order.id})
            </p>
            <p className="text-[#636466] mt-0.5">
              Current Base Price: <strong className="text-[#2C2C2C]">₹{order.totalAmount.toLocaleString()}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Proposed Price (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#76767F]">
                <IndianRupee className="w-4 h-4" />
              </span>
              <input
                type="number"
                required
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder={String(order.totalAmount + 250)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EBE7E4] text-sm font-bold text-[#2C2C2C] focus:ring-1 focus:ring-[#5A5187]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C2C2C] mb-1">
              Artisan Explanation / Note to Buyer
            </label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#EBE7E4] text-xs text-[#222222] focus:ring-1 focus:ring-[#5A5187]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EBE7E4]">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#636466] hover:bg-[#F5F5F3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#F4E39E]" />
              <span>Send Offer via WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
