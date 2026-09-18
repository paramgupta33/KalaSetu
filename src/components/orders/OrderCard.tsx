import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Sparkles, 
  Gift, 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  Lock, 
  Handshake, 
  Truck, 
  Download, 
  Phone,
  ZoomIn,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { 
    language, 
    lockOrderPrice, 
    advanceOrderStep, 
    updateOrderStatus,
    openModal, 
    showToast,
    t 
  } = useApp();

  const customReq = order.customRequest;

  const handleWhatsAppChat = () => {
    showToast(`Opening WhatsApp chat with ${order.customerName}...`, 'info');
    window.open(`https://wa.me/?text=${encodeURIComponent(`Namaste ${order.customerName}! Regarding your KalaSetu custom order #${order.id}...`)}`, '_blank');
  };

  const handleInspectPhoto = () => {
    if (customReq?.referenceImage) {
      openModal('inspect_photo', {
        imageUrl: customReq.referenceImage,
        filename: customReq.referenceFilename || 'buyer_reference.jpg',
        note: customReq.note,
        customerName: order.customerName,
      });
    }
  };

  const handleDownloadLabel = () => {
    showToast(`Shipping label for #${order.id} downloaded!`, 'success');
  };

  return (
    <article className="bg-[#FFFFFF] rounded-2xl border border-[#EBE7E4] shadow-xs p-4 sm:p-5 relative space-y-4 hover:border-[#C5BEFF] transition-all">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#2C2C2C]">
              #{order.id.length > 14 ? order.id.slice(0, 10) + '...' : order.id}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  order.status === 'pending_craft'
                    ? 'bg-[#F4E39E] text-[#272105]'
                    : order.status === 'ready_for_dispatch'
                    ? 'bg-[#C5BEFF] text-[#1E1A2D]'
                    : order.status === 'in_progress'
                    ? 'bg-[#D3E0D7] text-[#252B28]'
                    : order.status === 'shipped'
                    ? 'bg-[#D3E0D7] text-[#252B28]'
                    : 'bg-[#E2E8F0] text-[#1E293B]'
                }`}
              >
                {order.status === 'pending_craft'
                  ? t('statusPendingCraft')
                  : order.status === 'ready_for_dispatch'
                  ? t('statusReadyForDispatch')
                  : order.status === 'in_progress'
                  ? t('statusInCrafting')
                  : order.status === 'shipped'
                  ? t('statusShippedInTransit')
                  : order.status}
              </span>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                className="text-[10px] font-semibold bg-[#FAF9F6] border border-[#EBE7E4] rounded px-1.5 py-0.5 text-[#2C2C2C] cursor-pointer hover:border-[#5A5187] focus:outline-none"
                title="Update status"
                id={`order-status-${order.id}`}
              >
                <option value="pending_craft">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="ready_for_dispatch">Confirmed / Ready</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-[#636466] mt-1 flex items-center gap-1 flex-wrap">
            <User className="w-3.5 h-3.5 text-[#76767F]" />
            <strong className="text-[#2C2C2C] font-semibold">{order.customerName}</strong> • {order.location} • <span className="text-[#8E8E93]">{order.orderTimeAgo?.[language] || order.orderTimeAgo?.en || 'Recent'}</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-base sm:text-lg font-extrabold text-[#2C2C2C]">
            ₹ {order.totalAmount.toLocaleString()}
          </span>
          <span className="block text-[10px] text-[#636466] font-medium">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Product Details Row */}
      <div className="flex gap-3 items-center bg-[#F7F3EF] rounded-xl p-3 border border-[#EBE7E4]/60">
        <img
          src={order.productImage}
          alt={order.productTitle}
          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[#D0D0D4]/40"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#2C2C2C] truncate">{order.productTitle}</h4>
          <p className="text-[11px] text-[#636466] mt-0.5">{order.productSpec}</p>
        </div>
      </div>

      {/* Custom Request Callout (if present) */}
      {customReq && (
        <div className="bg-[#F4E39E]/20 border border-[#F4E39E] rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#7D6B21]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                {t('buyerCustomReq')}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-[#F4E39E] text-[#272105] px-2 py-0.5 rounded-full">
              {customReq.tag}
            </span>
          </div>

          <p className="text-xs text-[#2C2C2C] leading-relaxed bg-white/90 rounded-lg p-2.5 border border-[#DFCD7E]/40 italic">
            {customReq.note}
          </p>

          {/* Reference Photo Thumbnail & Inspect Link */}
          {customReq.referenceImage && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EBE7E4]">
              <div className="flex items-center gap-2.5">
                <div 
                  onClick={handleInspectPhoto}
                  className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 cursor-pointer border border-[#D0D0D4]"
                >
                  <img
                    src={customReq.referenceImage}
                    alt="Customer reference"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <ZoomIn className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#2C2C2C]">
                    {customReq.referenceFilename || 'diya_motif_photo.jpg'}
                  </p>
                  <p className="text-[10px] text-[#636466]">{t('buyerCustomReq')}</p>
                </div>
              </div>
              <button
                onClick={handleInspectPhoto}
                className="text-[11px] text-[#5A5187] font-bold hover:underline px-2 py-1 flex items-center gap-1"
              >
                <span>{t('inspectPhoto')}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {customReq.giftWrap && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#636466] pt-0.5 font-medium">
              <Gift className="w-3.5 h-3.5 text-[#7D6B21]" />
              <span>{t('giftWrapRequested')}</span>
            </div>
          )}

          {/* Commission Milestone Progress */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#636466] mb-1.5 font-semibold">
              <span>{t('commissionProgress')}</span>
              <span className="text-[#7D6B21]">
                {t('stepProgressFormat')
                  .replace('{current}', String(customReq.currentStep))
                  .replace('{total}', '4')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <div className={`h-1.5 rounded-full ${customReq.currentStep >= 1 ? 'bg-[#2C2C2C]' : 'bg-[#EBE7E4]'}`} />
              <div className={`h-1.5 rounded-full ${customReq.currentStep >= 2 ? 'bg-[#7D6B21]' : 'bg-[#EBE7E4]'}`} />
              <div className={`h-1.5 rounded-full ${customReq.currentStep >= 3 ? 'bg-[#5A5187]' : 'bg-[#EBE7E4]'}`} />
              <div className={`h-1.5 rounded-full ${customReq.currentStep >= 4 ? 'bg-[#4A5950]' : 'bg-[#EBE7E4]'}`} />
            </div>
            <div className="grid grid-cols-4 text-center mt-1 text-[9px] text-[#636466] font-medium">
              <span className={customReq.currentStep >= 1 ? 'font-bold text-[#2C2C2C]' : ''}>{t('step1Received')}</span>
              <span className={customReq.currentStep >= 2 ? 'font-bold text-[#7D6B21]' : ''}>{t('step2Proof')}</span>
              <span className={customReq.currentStep >= 3 ? 'font-bold text-[#5A5187]' : ''}>{t('step3Crafting')}</span>
              <span className={customReq.currentStep >= 4 ? 'font-bold text-[#4A5950]' : ''}>{t('step4Dispatch')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tracking info if shipped */}
      {order.status === 'shipped' && order.customRequest?.shippingTrackingNumber && (
        <div className="p-2.5 rounded-xl bg-[#F5F5F3] flex items-center justify-between text-xs text-[#636466]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#4A5950]" />
            <span>
              {order.customRequest.shippingCarrier}: <strong>#{order.customRequest.shippingTrackingNumber}</strong>
            </span>
          </div>
          <span className="text-[11px] font-bold text-[#5A5187]">{t('statusShippedInTransit')}</span>
        </div>
      )}

      {/* Action Buttons Cluster */}
      <div className="pt-1 flex flex-col sm:flex-row gap-2">
        {order.status === 'pending_craft' ? (
          <>
            <button
              onClick={() => lockOrderPrice(order.id, order.totalAmount)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t('acceptLockPrice')} (₹{order.totalAmount.toLocaleString()})</span>
            </button>
            <button
              onClick={() => openModal('negotiate', order)}
              className="py-2.5 px-3 rounded-xl border border-[#EBE7E4] hover:bg-[#F5F5F3] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Handshake className="w-3.5 h-3.5 text-[#7D6B21]" />
              <span>{t('negotiatePrice')}</span>
            </button>
            <button
              onClick={handleWhatsAppChat}
              className="py-2.5 px-3 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#4A5950]" />
              <span>{t('whatsApp')}</span>
            </button>
          </>
        ) : order.status === 'in_progress' ? (
          <>
            <button
              onClick={() => advanceOrderStep(order.id)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('statusQualityCheck')}</span>
            </button>
            <button
              onClick={handleWhatsAppChat}
              className="py-2.5 px-3 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#4A5950]" />
              <span>{t('contactBuyer')}</span>
            </button>
          </>
        ) : order.status === 'ready_for_dispatch' ? (
          <>
            <button
              onClick={handleDownloadLabel}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadShippingLabel')}</span>
            </button>
            <button
              onClick={() => advanceOrderStep(order.id)}
              className="py-2.5 px-3 rounded-xl border border-[#EBE7E4] hover:bg-[#F5F5F3] text-[#222222] text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Truck className="w-3.5 h-3.5 text-[#5A5187]" />
              <span>{t('markReady')}</span>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between text-xs text-[#636466]">
            <span>BlueDart Express</span>
            <button
              onClick={() => showToast(`Parcel #${order.customRequest?.shippingTrackingNumber} is in transit to destination.`, 'info')}
              className="text-[#5A5187] font-bold hover:underline flex items-center gap-1"
            >
              <span>{t('trackParcel')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
