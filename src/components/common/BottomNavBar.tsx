import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  ShoppingBag, 
  BarChart3,
  Store,
  Compass,
  Heart,
  Clock,
  Building2,
  FileText
} from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    openModal, 
    orders, 
    userRole,
    buyerTab,
    setBuyerTab,
    buyerMode,
    wishlist,
    buyerOrders,
    t
  } = useApp();

  const customOrdersCount = orders.filter((o) => o.customRequest && o.customRequest.currentStep < 4).length;

  if (userRole === 'buyer') {
    return (
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50 pointer-events-auto">
        <nav 
          className="bg-[#2C2C2C] text-white rounded-full shadow-2xl px-3 py-2 flex items-center justify-between border border-white/10 backdrop-blur-md"
          aria-label="Buyer Navigation Dock"
          id="buyer-bottom-dock"
        >
          {/* 1. Market Home */}
          <button
            onClick={() => setBuyerTab('market')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
              buyerTab === 'market'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
            id="buyer-nav-market"
            title="Browse Crafts Market"
          >
            <Store className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">{t('tabMarket')}</span>
          </button>

          {/* 2. Swipe Discover Feed */}
          <button
            onClick={() => setBuyerTab('discover')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
              buyerTab === 'discover'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
            id="buyer-nav-discover"
            title="Swipe & Discover"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">{t('tabDiscover')}</span>
          </button>

          {/* 3. Center Floating Action: B2B Wholesale RFQ (Only in B2B Wholesale Mode) */}
          {buyerMode === 'business' && (
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setBuyerTab('b2b')}
                className={`w-12 h-12 -my-2 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all transform hover:-translate-y-0.5 ${
                  buyerTab === 'b2b'
                    ? 'bg-[#F4E39E] text-[#272105]'
                    : 'bg-white text-[#2C2C2C] hover:bg-[#F4E39E]'
                }`}
                aria-label="B2B Sourcing RFQ"
                id="btn-buyer-rfq-fab"
                title="Post Sourcing RFQ"
              >
                <Building2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 4. Wishlist */}
          <button
            onClick={() => setBuyerTab('wishlist')}
            className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
              buyerTab === 'wishlist'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
            id="buyer-nav-wishlist"
            title="Saved Wishlist"
          >
            <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'text-[#F4E39E] fill-[#F4E39E]' : ''}`} />
            <span className="text-[10px] tracking-tight mt-0.5">{t('tabWishlist')}</span>
            {wishlist.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#BA1A1A] text-white text-[9px] font-bold flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </button>

          {/* 5. Orders & Milestone Tracker */}
          <button
            onClick={() => setBuyerTab('enquiries')}
            className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
              buyerTab === 'enquiries'
                ? 'bg-white/20 text-white font-bold'
                : 'text-white/60 hover:text-white'
            }`}
            id="buyer-nav-enquiries"
            title="My Orders & Milestones"
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">{t('tabEnquiries')}</span>
            {buyerOrders.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#7D6B21] text-white text-[9px] font-bold flex items-center justify-center">
                {buyerOrders.length}
              </span>
            )}
          </button>
        </nav>
      </div>
    );
  }

  // Artisan Seller Experience Dock
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50 pointer-events-auto">
      <nav 
        className="bg-[#2C2C2C] text-white rounded-full shadow-2xl px-3 py-2 flex items-center justify-between border border-white/10 backdrop-blur-md"
        aria-label="Main Navigation Dock"
        id="main-bottom-dock"
      >
        {/* 1. Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
            activeTab === 'dashboard'
              ? 'bg-white/20 text-white font-bold'
              : 'text-white/60 hover:text-white'
          }`}
          id="nav-tab-dashboard"
          title="Artisan Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">{t('activeTabDashboard')}</span>
        </button>

        {/* 2. Catalogue */}
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
            activeTab === 'catalogue'
              ? 'bg-white/20 text-white font-bold'
              : 'text-white/60 hover:text-white'
          }`}
          id="nav-tab-catalogue"
          title="Product Catalogue"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">{t('activeTabCatalogue')}</span>
        </button>

        {/* 3. Center Floating Add Craft Button - Directs to Upload Craft Page */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-12 h-12 -my-2 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all transform hover:-translate-y-0.5 ${
              activeTab === 'upload'
                ? 'bg-[#F4E39E] text-[#272105] ring-2 ring-white/60 shadow-[#F4E39E]/30'
                : 'bg-white text-[#2C2C2C] hover:bg-[#F4E39E]'
            }`}
            aria-label="Upload New Craft"
            id="btn-add-craft-fab"
            title="Upload New Craft"
          >
            <Plus className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${activeTab === 'upload' ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {/* 4. Orders */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
            activeTab === 'orders'
              ? 'bg-white/20 text-white font-bold'
              : 'text-white/60 hover:text-white'
          }`}
          id="nav-tab-orders"
          title="Orders & Custom Requests"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">{t('activeTabOrders')}</span>
          {customOrdersCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-[#BA1A1A] text-white text-[9px] font-bold flex items-center justify-center">
              {customOrdersCount}
            </span>
          )}
        </button>

        {/* 5. Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-full transition-all duration-200 active:scale-95 ${
            activeTab === 'analytics'
              ? 'bg-white/20 text-white font-bold'
              : 'text-white/60 hover:text-white'
          }`}
          id="nav-tab-analytics"
          title="Product Analytics"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-0.5">{t('activeTabAnalytics')}</span>
        </button>
      </nav>
    </div>
  );
};

