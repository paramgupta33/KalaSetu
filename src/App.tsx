import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopAppBar } from './components/common/TopAppBar';
import { BottomNavBar } from './components/common/BottomNavBar';
import { ToastContainer } from './components/common/Toast';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { CatalogueScreen } from './components/catalogue/CatalogueScreen';
import { OrdersScreen } from './components/orders/OrdersScreen';
import { ProductAnalyticsScreen } from './components/analytics/ProductAnalyticsScreen';
import { ModalsContainer } from './components/modals/ModalsContainer';
import { BuyerMarketHome } from './components/buyer/BuyerMarketHome';
import { BuyerDiscoverFeed } from './components/buyer/BuyerDiscoverFeed';
import { B2BSourcingRFQ } from './components/buyer/B2BSourcingRFQ';
import { BuyerWishlistScreen } from './components/buyer/BuyerWishlistScreen';
import { BuyerEnquiriesOrders } from './components/buyer/BuyerEnquiriesOrders';
import { CraftStoryModal } from './components/buyer/CraftStoryModal';
import { OnboardingScreen } from './components/onboarding/OnboardingScreen';
import { UploadProductScreen } from './components/catalogue/UploadProductScreen';

const MainAppContent: React.FC = () => {
  const { 
    isOnboarded,
    authLoading,
    session,
    activeTab, 
    setActiveTab,
    userRole, 
    buyerTab, 
    selectedBuyerProduct, 
    setSelectedBuyerProduct 
  } = useApp();

  // Loading state while checking existing Supabase session
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-3 border-[#423a6e] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#48454f]">Initializing KalaSetu...</p>
      </div>
    );
  }

  // If no authenticated session exists: show Login / Signup UI
  if (!session || !isOnboarded) {
    return (
      <>
        <OnboardingScreen />
        <ToastContainer />
      </>
    );
  }

  const renderActiveScreen = () => {
    // 1. Buyer Role Screens
    if (userRole === 'buyer') {
      switch (buyerTab) {
        case 'market':
          return <BuyerMarketHome />;
        case 'discover':
          return <BuyerDiscoverFeed />;
        case 'b2b':
          return <B2BSourcingRFQ />;
        case 'wishlist':
          return <BuyerWishlistScreen />;
        case 'enquiries':
          return <BuyerEnquiriesOrders />;
        default:
          return <BuyerMarketHome />;
      }
    }

    // 2. Artisan Seller Role Screens
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'catalogue':
        return <CatalogueScreen />;
      case 'orders':
        return <OrdersScreen />;
      case 'analytics':
        return <ProductAnalyticsScreen />;
      case 'upload':
        return <UploadProductScreen onBack={() => setActiveTab('catalogue')} />;
      default:
        return <DashboardScreen />;
    }
  };

  const isDiscover = userRole === 'buyer' && buyerTab === 'discover';

  return (
    <div className={`min-h-screen bg-[#FAF9F6] text-[#222222] flex flex-col selection:bg-[#F4E39E] selection:text-[#272105] w-full max-w-full overflow-x-hidden ${isDiscover ? 'h-screen overflow-hidden' : ''}`}>
      {/* Top Bar */}
      <TopAppBar />

      {/* Main Screen Content */}
      <main className={`flex-grow w-full ${isDiscover ? 'p-0 max-w-full h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] overflow-hidden flex flex-col justify-center relative' : 'max-w-7xl mx-auto px-4 md:px-8 py-5 md:py-8 pb-32'}`}>
        {renderActiveScreen()}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNavBar />

      {/* Modals & Toasts */}
      <ModalsContainer />
      <CraftStoryModal
        product={selectedBuyerProduct}
        onClose={() => setSelectedBuyerProduct(null)}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

