import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BuyerOrder } from '../../types';
import { 
  Package, 
  Building2, 
  ShoppingBag, 
  Check, 
  Clock, 
  Award, 
  MapPin, 
  MessageCircle, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { AuthenticityCertificateModal } from './AuthenticityCertificateModal';

export const BuyerEnquiriesOrders: React.FC = () => {
  const { buyerOrders, language, setBuyerTab, showToast, buyerMode, t } = useApp();
  const [filter, setFilter] = useState<'all' | 'b2c' | 'b2b'>('all');
  const [selectedCertificateOrder, setSelectedCertificateOrder] = useState<BuyerOrder | null>(null);

  const filteredOrders = buyerOrders.filter((order) => {
    if (buyerMode === 'business' && filter === 'b2c') return false;
    if (buyerMode !== 'business' && filter === 'b2b') return false;
    if (filter === 'b2c') return order.type === 'b2c';
    if (filter === 'b2b') return order.type === 'b2b';
    return true;
  });

  const milestoneSteps = [
    { step: 1, title: t('milestoneConfirmed') },
    { step: 2, title: t('milestoneCrafting') },
    { step: 3, title: t('milestoneQuality') },
    { step: 4, title: t('milestoneDispatched') },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto" id="buyer-orders-enquiries-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#EBE7E4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#EBE7E4] text-[#636466] text-xs font-bold mb-1">
            <Clock className="w-3.5 h-3.5 text-[#5A5187]" />
            <span>{t('orderMilestoneTracker')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] tracking-tight">
            {t('myEnquiriesTitle')}
          </h1>
          <p className="text-xs text-[#636466] mt-0.5">
            {t('myEnquiriesSubtitle')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#D0D0D4]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-[#2C2C2C] text-white shadow-xs'
                : 'text-[#636466] hover:text-[#2C2C2C]'
            }`}
          >
            {t('filterAll')} ({buyerOrders.length})
          </button>
          {buyerMode !== 'business' && (
            <button
              onClick={() => setFilter('b2c')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filter === 'b2c'
                  ? 'bg-[#2C2C2C] text-white shadow-xs'
                  : 'text-[#636466] hover:text-[#2C2C2C]'
              }`}
            >
              {t('filterPersonal')}
            </button>
          )}
          {buyerMode === 'business' && (
            <button
              onClick={() => setFilter('b2b')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filter === 'b2b'
                  ? 'bg-[#2C2C2C] text-white shadow-xs'
                  : 'text-[#636466] hover:text-[#2C2C2C]'
              }`}
            >
              {t('filterB2BBulk')}
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EBE7E4] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] text-[#636466] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C2C2C]">{t('noOrdersYet')}</h3>
          <p className="text-xs text-[#636466] max-w-xs mx-auto">
            {t('noOrdersDesc')}
          </p>
          <button
            onClick={() => setBuyerTab('market')}
            className="px-5 py-2.5 rounded-full bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black transition-all"
          >
            {t('exploreMarketBtn')}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const isB2B = order.type === 'b2b';
            const primaryItem = order.items[0]?.product;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-[#EBE7E4] shadow-xs p-5 sm:p-6 space-y-5"
                id={`order-card-${order.id}`}
              >
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE7E4] pb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isB2B ? 'bg-[#FFF9E6] text-[#7D6B21]' : 'bg-[#EDE7F6] text-[#5A5187]'
                      }`}
                    >
                      {isB2B ? <Building2 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#2C2C2C] font-mono">{order.id}</h3>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isB2B
                              ? 'bg-[#F4E39E] text-[#272105]'
                              : 'bg-[#EDE7F6] text-[#5A5187]'
                          }`}
                        >
                          {isB2B ? 'B2B Enterprise Contract' : 'Personal Order'}
                        </span>
                      </div>
                      <p className="text-xs text-[#636466] mt-0.5">
                        Placed {order.createdAt} • {order.deliveryEstimate}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-base font-extrabold text-[#2C2C2C]">
                      ₹{order.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#137333] font-semibold flex items-center sm:justify-end gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Payment Protected by KalaSetu Escrow</span>
                    </div>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="bg-[#FAF9F6] rounded-2xl p-4 border border-[#EBE7E4]">
                  <div className="text-[11px] font-bold text-[#636466] uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Crafting & Fulfillment Milestone Tracker</span>
                    <span className="text-[#7D6B21] font-semibold">Step {order.currentStep} of 4</span>
                  </div>

                  <div className="flex items-center justify-between relative">
                    {milestoneSteps.map((stepItem, idx) => {
                      const isComplete = stepItem.step <= order.currentStep;
                      const isCurrent = stepItem.step === order.currentStep;

                      return (
                        <div key={stepItem.step} className="flex-1 flex flex-col items-center relative text-center">
                          {/* Connector Line */}
                          {idx < milestoneSteps.length - 1 && (
                            <div
                              className={`absolute top-3 left-1/2 w-full h-1 z-0 ${
                                stepItem.step < order.currentStep
                                  ? 'bg-[#2C2C2C]'
                                  : 'bg-[#EBE7E4]'
                              }`}
                            />
                          )}

                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold relative z-10 transition-all ${
                              isComplete
                                ? 'bg-[#2C2C2C] text-white'
                                : isCurrent
                                ? 'bg-[#7D6B21] text-white ring-2 ring-[#F4E39E]'
                                : 'bg-white text-[#636466] border border-[#D0D0D4]'
                            }`}
                          >
                            {isComplete ? <Check className="w-3 h-3 stroke-[3]" /> : stepItem.step}
                          </div>
                          <span
                            className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 max-w-[80px] sm:max-w-none leading-tight ${
                              isCurrent ? 'text-[#2C2C2C] font-bold' : 'text-[#636466]'
                            }`}
                          >
                            {stepItem.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Artisan Workshop Details & Items */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3">
                    {primaryItem && (
                      <img
                        src={primaryItem.imageUrl}
                        alt={primaryItem.altText}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-[#EBE7E4]"
                      />
                    )}
                    <div>
                      <div className="text-xs font-bold text-[#2C2C2C]">
                        {order.artisanName}
                      </div>
                      <div className="text-[11px] text-[#636466] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#7D6B21]" />
                        <span>{order.artisanCluster}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Certificate & Guild Contact */}
                  <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedCertificateOrder(order)}
                      className="px-3.5 py-1.5 rounded-full bg-[#FFF9E6] border border-[#F4E39E] text-xs font-bold text-[#7D6B21] hover:bg-[#F4E39E]/60 flex items-center gap-1.5 transition-colors shadow-2xs"
                      id={`btn-cert-${order.id}`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{t('viewCertificateBtn')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        showToast(`Connecting with ${order.artisanName} workshop via WhatsApp...`, 'info')
                      }
                      className="px-3.5 py-1.5 rounded-full bg-white border border-[#D0D0D4] text-xs font-bold text-[#2C2C2C] hover:bg-[#F5F5F3] flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#137333]" />
                      <span>Chat Workshop</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Authenticity Certificate Modal */}
      {selectedCertificateOrder && (
        <AuthenticityCertificateModal
          order={selectedCertificateOrder}
          onClose={() => setSelectedCertificateOrder(null)}
        />
      )}
    </div>
  );
};
