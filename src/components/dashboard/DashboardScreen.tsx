import React from 'react';
import { useApp } from '../../context/AppContext';
import { useDashboardData } from './useDashboardData';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Languages,
  Plus,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  IndianRupee,
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { t, language, setActiveTab, openModal, userName } = useApp();
  const { metrics, attentionItems, recentOrders } = useDashboardData();

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-200">
      {/* 1. Greeting Section */}
      <section className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C2C2C] tracking-tight mb-1">
          {t('namaste')}, {userName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-[#636466] font-medium">
          {t('homeAttentionSubtitle')}
        </p>
      </section>

      {/* 2. Business Snapshot */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] uppercase tracking-wider">
            {t('businessSnapshot')}
          </h2>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs font-bold text-[#5A5187] hover:underline flex items-center gap-1 cursor-pointer"
            id="btn-goto-insights"
          >
            <span>{t('viewInsights')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Snapshot 1: Sales */}
          <div
            onClick={() => setActiveTab('analytics')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#EBE7E4] hover:border-[#DFCD7E] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-semibold text-[#636466]">
                  {t('totalSales')}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F5F5F3] text-[#636466] border border-[#EBE7E4]">
                  All Time
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#F4E39E]/60 text-[#272105] flex items-center justify-center">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
                ₹{metrics.totalSales.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-[#7D6B21] text-[10px] sm:text-[11px] font-bold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>{metrics.totalSales > 0 ? `+${metrics.salesGrowthPercent}%` : '₹0'}</span>
                <span className="text-[#888580] font-normal">({t('thisMonth')})</span>
              </div>
            </div>
          </div>

          {/* Snapshot 2: Active Crafts */}
          <div
            onClick={() => setActiveTab('catalogue')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#EBE7E4] hover:border-[#C5BEFF] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[#636466]">
                {t('activeCrafts')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#C5BEFF]/60 text-[#1E1A2D] flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
                {metrics.activeCraftsCount}
              </p>
              <div className="flex items-center gap-1 text-[#5A5187] text-[10px] sm:text-[11px] font-bold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>{metrics.newCraftsThisMonth > 0 ? `+${metrics.newCraftsThisMonth}` : '0'}</span>
                <span className="text-[#888580] font-normal">({t('thisMonth')})</span>
              </div>
            </div>
          </div>

          {/* Snapshot 3: Orders */}
          <div
            onClick={() => setActiveTab('orders')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#EBE7E4] hover:border-[#D3E0D7] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[#636466]">
                {t('activeOrders')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#D3E0D7]/70 text-[#252B28] flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
                {metrics.activeOrdersCount}
              </p>
              <div className="flex items-center gap-1 text-[#4A5950] text-[10px] sm:text-[11px] font-bold mt-1">
                <Clock className="w-3 h-3" />
                <span>{metrics.activeOrdersCount} to fulfill</span>
              </div>
            </div>
          </div>

          {/* Snapshot 4: Buyer Inquiries */}
          <div
            onClick={() => setActiveTab('orders')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#EBE7E4] hover:border-[#F4E39E] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-semibold text-[#636466]">
                {t('buyerInquiries')}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#F4E39E]/60 text-[#272105] flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-black text-[#2C2C2C] tracking-tight">
                {metrics.buyerInquiriesCount}
              </p>
              <div className="flex items-center gap-1 text-[#7D6B21] text-[10px] sm:text-[11px] font-bold mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>{metrics.buyerInquiriesCount > 0 ? `+${metrics.buyerInquiriesCount}` : '0'}</span>
                <span className="text-[#888580] font-normal">({t('thisMonth')})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Needs Your Attention */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] uppercase tracking-wider">
              {t('needsYourAttention')}
            </h2>
            {attentionItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#CF1322]/10 text-[#CF1322] text-[10px] font-bold">
                {attentionItems.length}
              </span>
            )}
          </div>
        </div>

        {attentionItems.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#EBE7E4] flex items-center gap-3 text-xs text-[#55524E]">
            <CheckCircle2 className="w-5 h-5 text-[#2A7E3B] shrink-0" />
            <span className="font-semibold">{t('allCaughtUp')}</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.actionTab)}
                className={`cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 border transition-all flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs ${
                  item.severity === 'urgent'
                    ? 'border-[#CF1322]/30 hover:border-[#CF1322]'
                    : 'border-[#E8DEC7] hover:border-[#7D6B21]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.severity === 'urgent'
                        ? 'bg-[#CF1322]/10 text-[#CF1322]'
                        : 'bg-[#F4E39E]/50 text-[#7D6B21]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#2C2C2C] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#76767F] truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(item.actionTab);
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F2EFEA] border border-[#EBE7E4] text-[#2C2C2C] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="hidden sm:inline">{item.actionLabel || t('viewAllAlerts')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Quick Actions */}
      <section>
        <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] uppercase tracking-wider mb-3">
          {t('quickActions')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Action 1: Add New Craft */}
          <button
            onClick={() => setActiveTab('upload')}
            className="cursor-pointer bg-[#2C2C2C] hover:bg-black text-white rounded-2xl p-3.5 sm:p-4 text-left shadow-xs active:scale-98 transition-all flex flex-col justify-between group"
            id="quick-action-add-craft"
          >
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <Plus className="w-4 h-4 text-[#F4E39E]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold leading-tight">
                {t('addNewCraft')}
              </p>
              <p className="text-[10px] text-white/70 mt-1 line-clamp-1">
                {t('addNewCraftDesc')}
              </p>
            </div>
          </button>

          {/* Action 2: Manage Crafts */}
          <button
            onClick={() => setActiveTab('catalogue')}
            className="cursor-pointer bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#EBE7E4] hover:border-[#C5BEFF] rounded-2xl p-3.5 sm:p-4 text-left shadow-2xs active:scale-98 transition-all flex flex-col justify-between group"
            id="quick-action-manage-crafts"
          >
            <div className="w-8 h-8 rounded-xl bg-[#C5BEFF]/60 text-[#1E1A2D] flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-tight">
                {t('manageCrafts')}
              </p>
              <p className="text-[10px] text-[#76767F] mt-1 line-clamp-1">
                {t('manageCraftsDesc')}
              </p>
            </div>
          </button>

          {/* Action 3: Create Marketplace Listing */}
          <button
            onClick={() => openModal('auto_cataloger')}
            className="cursor-pointer bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#EBE7E4] hover:border-[#D3E0D7] rounded-2xl p-3.5 sm:p-4 text-left shadow-2xs active:scale-98 transition-all flex flex-col justify-between group"
            id="quick-action-marketplace-listing"
          >
            <div className="w-8 h-8 rounded-xl bg-[#D3E0D7]/70 text-[#252B28] flex items-center justify-center mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-tight">
                {t('createMarketplaceListing')}
              </p>
              <p className="text-[10px] text-[#76767F] mt-1 line-clamp-1">
                Amazon, Flipkart, GeM
              </p>
            </div>
          </button>

          {/* Action 4: View Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className="cursor-pointer bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#EBE7E4] hover:border-[#F4E39E] rounded-2xl p-3.5 sm:p-4 text-left shadow-2xs active:scale-98 transition-all flex flex-col justify-between group"
            id="quick-action-view-orders"
          >
            <div className="w-8 h-8 rounded-xl bg-[#F4E39E]/60 text-[#272105] flex items-center justify-center mb-3">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#2C2C2C] leading-tight">
                {t('viewOrders')}
              </p>
              <p className="text-[10px] text-[#76767F] mt-1 line-clamp-1">
                {t('viewOrdersDesc')}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. AI Tools (Compact, Task-Oriented Actions) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] uppercase tracking-wider">
            {t('aiToolsSection')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {/* Tool 1: Improve Product Photo */}
          <div
            onClick={() => openModal('image_enhancer')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-4 border border-[#EBE7E4] hover:border-[#C5BEFF] transition-all flex items-center justify-between gap-3 shadow-2xs group"
            id="btn-improve-photo"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#C5BEFF]/60 text-[#1E1A2D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                  {t('improveProductPhoto')}
                </h3>
                <p className="text-[11px] text-[#76767F] line-clamp-2 mt-0.5">
                  {t('improveProductPhotoDesc')}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] group-hover:bg-[#EBE4D5] text-[#2C2C2C] flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Tool 2: Create Marketplace Listing / Auto-Cataloger */}
          <div
            onClick={() => openModal('auto_cataloger')}
            className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-4 border border-[#EBE7E4] hover:border-[#D3E0D7] transition-all flex items-center justify-between gap-3 shadow-2xs group"
            id="btn-auto-cataloger"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#D3E0D7]/70 text-[#252B28] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Languages className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C]">
                  {t('createMarketplaceListing')}
                </h3>
                <p className="text-[11px] text-[#76767F] line-clamp-2 mt-0.5">
                  {t('marketplaceListingDesc')}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] group-hover:bg-[#EBE4D5] text-[#2C2C2C] flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Recent Business Activity */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm sm:text-base font-bold text-[#2C2C2C] uppercase tracking-wider">
            {t('recentBusinessActivity')}
          </h2>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-[#5A5187] hover:underline flex items-center gap-1 cursor-pointer"
            id="btn-all-recent-orders"
          >
            <span>{t('viewAll')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentOrders.length === 0 ? (
            <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#EBE7E4] text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#76767F] mx-auto opacity-50" />
              <p className="text-xs sm:text-sm font-bold text-[#2C2C2C]">{t('noOrdersYet')}</p>
              <p className="text-[11px] text-[#76767F] max-w-xs mx-auto">
                Incoming orders for your crafts will appear here in real time.
              </p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setActiveTab('orders')}
                className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3.5 sm:p-4 shadow-2xs border border-[#EBE7E4] hover:border-[#C5BEFF] transition-all flex justify-between items-center gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#FAF9F6] overflow-hidden border border-[#EBE7E4] shrink-0">
                    <img
                      src={order.productImage}
                      alt={order.customerName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-[#2C2C2C] truncate">
                        {order.customerName}
                      </span>
                      {order.customRequest && (
                        <span className="text-[9px] font-bold bg-[#F4E39E] text-[#272105] px-1.5 py-0.5 rounded">
                          {t('buyerCustomReq')}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#76767F] truncate">
                      #{order.id} • {(order.orderTimeAgo as any)?.[language] || order.orderTimeAgo.en}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-[#2C2C2C]">
                    ₹{order.totalAmount.toLocaleString()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'pending_craft'
                        ? 'bg-[#F4E39E] text-[#272105]'
                        : order.status === 'ready_for_dispatch'
                        ? 'bg-[#C5BEFF] text-[#1E1A2D]'
                        : order.status === 'in_progress'
                        ? 'bg-[#D3E0D7] text-[#252B28]'
                        : 'bg-[#EAE6DF] text-[#55524E]'
                    }`}
                  >
                    {order.status === 'pending_craft'
                      ? t('statusPendingCraft')
                      : order.status === 'ready_for_dispatch'
                      ? t('statusReadyForDispatch')
                      : order.status === 'in_progress'
                      ? t('statusInCrafting')
                      : t('statusShippedInTransit')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
