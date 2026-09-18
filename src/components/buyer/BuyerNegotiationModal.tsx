import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Send, 
  Check, 
  ShieldCheck, 
  Building2, 
  Coins, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { RFQ, MatchedArtisan } from '../../types';

interface BuyerNegotiationModalProps {
  negotiation: {
    rfq: RFQ;
    matchedArtisan: MatchedArtisan;
    currentStep: number;
    buyerOffer: number;
    artisanOffer: number;
    history: { sender: 'buyer' | 'artisan'; amount: number; message: string; timestamp: string }[];
  };
  onClose: () => void;
}

export const BuyerNegotiationModal: React.FC<BuyerNegotiationModalProps> = ({
  negotiation,
  onClose,
}) => {
  const { 
    submitNegotiationCounter, 
    acceptNegotiationOffer, 
    b2bProfile,
    t
  } = useApp();

  const [counterPrice, setCounterPrice] = useState<number>(
    Math.round((negotiation.buyerOffer + negotiation.artisanOffer) / 2)
  );
  const [customMsg, setCustomMsg] = useState<string>('');

  const { rfq, matchedArtisan, history } = negotiation;

  const handleSendCounter = (e: React.FormEvent) => {
    e.preventDefault();
    submitNegotiationCounter(counterPrice, customMsg);
    setCustomMsg('');
  };

  const steps = [
    { num: 1, title: t('stepRfqSent') },
    { num: 2, title: t('stepCounterReceived') },
    { num: 3, title: t('stepAgreement') },
    { num: 4, title: t('stepOrderLocked') },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      id="modal-buyer-negotiation"
    >
      <div className="bg-[#FAF9F6] border border-[#EBE7E4] rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EBE7E4] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={matchedArtisan.imageUrl}
              alt={matchedArtisan.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#D0D0D4]"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#2C2C2C]">{matchedArtisan.name}</h3>
                <ShieldCheck className="w-3.5 h-3.5 text-[#5A5187]" />
              </div>
              <p className="text-[11px] text-[#636466]">
                {matchedArtisan.cluster} • {rfq.quantity} units {rfq.category.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#D0D0D4] flex items-center justify-center text-[#48454F] hover:bg-[#F5F5F3] transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4-Step Negotiation Progress Milestone Bar */}
        <div className="bg-[#FFFDF7] border-b border-[#EBE7E4] px-5 py-3">
          <div className="flex items-center justify-between text-xs">
            {steps.map((st, idx) => {
              const isPassed = idx + 1 <= negotiation.currentStep;
              const isCurrent = idx + 1 === negotiation.currentStep;
              return (
                <div key={st.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isPassed
                        ? 'bg-[#2C2C2C] text-white'
                        : isCurrent
                        ? 'bg-[#7D6B21] text-white ring-2 ring-[#F4E39E]'
                        : 'bg-[#FAF9F6] text-[#636466] border border-[#D0D0D4]'
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : st.num}
                  </div>
                  <span
                    className={`hidden sm:inline text-[11px] font-semibold ${
                      isCurrent ? 'text-[#2C2C2C] font-bold' : 'text-[#636466]'
                    }`}
                  >
                    {st.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className="w-6 sm:w-10 h-0.5 bg-[#EBE7E4] mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Messaging Chat Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-[#FAF9F6]">
          {history.map((msg, index) => {
            const isBuyer = msg.sender === 'buyer';
            return (
              <div
                key={index}
                className={`flex flex-col ${isBuyer ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-[#636466] mb-1 px-1">
                  <span>{isBuyer ? b2bProfile.organizationName : matchedArtisan.name}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs text-xs leading-relaxed ${
                    isBuyer
                      ? 'bg-[#2C2C2C] text-white rounded-br-xs'
                      : 'bg-white text-[#2C2C2C] border border-[#EBE7E4] rounded-bl-xs'
                  }`}
                >
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <span>Proposed Unit Price: ₹{msg.amount.toLocaleString()}</span>
                    <span className="text-[10px] opacity-75">
                      (Total ₹{(msg.amount * rfq.quantity).toLocaleString()})
                    </span>
                  </div>
                  <p className="opacity-90">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Counter Offer Input Strip & Accept Deal Action */}
        <div className="p-4 sm:p-5 border-t border-[#EBE7E4] bg-white space-y-3">
          <form onSubmit={handleSendCounter} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#48454F]">
                Buyer Proposed Counter: ₹{counterPrice.toLocaleString()}/unit
              </label>
              <span className="text-[11px] text-[#636466]">
                Artisan Guild Offer: <strong className="text-[#7D6B21]">₹{negotiation.artisanOffer.toLocaleString()}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min={rfq.targetBudget - 200}
                max={matchedArtisan.suggestedPrice + 200}
                step={25}
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="flex-1 accent-[#7D6B21]"
              />
              <span className="text-xs font-bold text-[#2C2C2C] bg-[#FAF9F6] border border-[#D0D0D4] px-3 py-1.5 rounded-xl shrink-0">
                ₹{counterPrice}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Add optional proposal note (e.g., prompt payment terms, recurring orders)..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#7D6B21]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#D0D0D4] hover:bg-[#F5F5F3] text-xs font-bold text-[#2C2C2C] flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                id="btn-send-counter"
              >
                <Send className="w-3.5 h-3.5 text-[#5A5187]" />
                <span>{t('proposeCounterBtn')}</span>
              </button>
            </div>
          </form>

          {/* Accept Offer & Lock Contract */}
          <div className="pt-2 border-t border-[#EBE7E4] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="text-xs text-center sm:text-left">
              <span className="text-[#636466]">{t('totalEstimatedLabel')}: </span>
              <strong className="text-[#2C2C2C] text-sm">
                ₹{(negotiation.artisanOffer * rfq.quantity).toLocaleString()}
              </strong>
            </div>

            <button
              type="button"
              onClick={acceptNegotiationOffer}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              id="btn-accept-deal"
            >
              <CheckCircle2 className="w-4 h-4 text-[#F4E39E] shrink-0" />
              <span>{t('acceptCounterOfferBtn')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
