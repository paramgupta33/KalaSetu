import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderCard } from './OrderCard';
import { 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  Send, 
  CheckCircle,
  X,
  MessageCircle
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { 
    orders, 
    orderSearchQuery, 
    setOrderSearchQuery, 
    orderFilter, 
    setOrderFilter,
    showToast,
    language,
    t
  } = useApp();

  const filterTabs = useMemo(() => [
    { id: 'all', label: t('businessOverview'), count: orders.length },
    { id: 'custom', label: t('customRequests'), count: orders.filter((o) => o.customRequest).length },
    { id: 'pending', label: t('statusPendingCraft'), count: orders.filter((o) => o.status === 'pending_craft').length },
    { id: 'ready', label: t('statusReadyForDispatch'), count: orders.filter((o) => o.status === 'ready_for_dispatch').length },
    { id: 'shipped', label: t('statusShippedInTransit'), count: orders.filter((o) => o.status === 'shipped').length },
  ], [orders, t]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Filter tab
      if (orderFilter === 'custom' && !o.customRequest) return false;
      if (orderFilter === 'pending' && o.status !== 'pending_craft') return false;
      if (orderFilter === 'ready' && o.status !== 'ready_for_dispatch') return false;
      if (orderFilter === 'shipped' && o.status !== 'shipped') return false;

      // Search
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchId = o.id.toLowerCase().includes(q);
        const matchProduct = o.productTitle.toLowerCase().includes(q);
        const matchLocation = o.location.toLowerCase().includes(q);
        return matchName || matchId || matchProduct || matchLocation;
      }
      return true;
    });
  }, [orders, orderFilter, orderSearchQuery]);

  const handleBulkWhatsAppCheck = () => {
    showToast('Sent batch notification to 3 pending custom buyers via WhatsApp!', 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Title & Studio Narrative */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7D6B21]">
            {t('roleArtisanStudio')}
          </span>
          <span className="bg-[#F4E39E] text-[#272105] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {filteredOrders.length}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C2C2C] mt-0.5">
          {t('activeTabOrders')} & {t('customRequests')}
        </h1>
        <p className="text-xs sm:text-sm text-[#636466] mt-1 max-w-2xl leading-relaxed">
          {t('customizationPendingDesc')}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#76767F]">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={orderSearchQuery}
          onChange={(e) => setOrderSearchQuery(e.target.value)}
          placeholder={t('searchOrdersPh')}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#FFFFFF] border border-[#EBE7E4] focus:border-[#5A5187] focus:ring-1 focus:ring-[#5A5187] text-xs sm:text-sm text-[#222222] placeholder:text-[#76767F] transition-all shadow-xs"
          id="ordersSearchInput"
        />
        {orderSearchQuery && (
          <button
            onClick={() => setOrderSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#76767F] hover:text-[#222222]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs Horizontal Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filterTabs.map((tab) => {
          const isSelected = orderFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#2C2C2C] text-white shadow-xs'
                  : 'bg-[#FFFFFF] text-[#636466] hover:bg-[#F5F5F3] border border-[#EBE7E4]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-[#F5F5F3] text-[#76767F]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Urgent Festive Deadline Banner (only shown if there are pending custom orders) */}
      {orders.some((o) => !!o.customRequest && o.status === 'pending_craft') && (
        <section className="relative overflow-hidden rounded-2xl bg-[#F4E39E] border border-[#DFCD7E] p-4 sm:p-5 shadow-xs">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-xs flex items-center justify-center text-[#7D6B21] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#7D6B21] text-white font-bold">
                    {t('diwaliRush')}
                  </span>
                  <span className="text-xs font-bold text-[#272105]">
                    {t('expressFriday')}
                  </span>
                </div>
                <p className="text-xs text-[#272105]/90 mt-1 max-w-xl leading-relaxed">
                  <strong>{t('customizationPendingTitle')}</strong> — {t('customizationPendingDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={handleBulkWhatsAppCheck}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black active:scale-95 transition-transform shrink-0 shadow-xs"
              id="btn-bulk-whatsapp"
            >
              <MessageCircle className="w-4 h-4 text-[#C5BEFF]" />
              <span>{t('whatsApp')}</span>
            </button>
          </div>
        </section>
      )}

      {/* Order Cards Feed */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}

        {filteredOrders.length === 0 && (
          <div className="py-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#EBE7E4] p-6 space-y-2">
            <p className="text-sm font-bold text-[#2C2C2C]">{t('noOrdersYet')}</p>
            <p className="text-xs text-[#76767F] max-w-xs mx-auto">
              {orders.length === 0
                ? 'Incoming orders placed by buyers for your crafts will appear here.'
                : 'No orders match your selected search or filter criteria.'}
            </p>
            {orders.length > 0 && (
              <button
                onClick={() => {
                  setOrderFilter('all');
                  setOrderSearchQuery('');
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold"
              >
                {t('resetAllFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Artisan Protection Advisory Footer */}
      <div className="mt-8 py-4 text-center text-[#636466] text-xs space-y-1">
        <p className="font-semibold text-[#4A5950] flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-[#4A5950]" />
          {t('vocalForLocal')}
        </p>
        <p className="text-[11px]">
          {t('customizationPendingDesc')}
        </p>
      </div>
    </div>
  );
};
