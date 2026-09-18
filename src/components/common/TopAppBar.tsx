import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { 
  Globe, 
  Menu, 
  Bell, 
  ChevronDown, 
  Check,
  ShoppingBag,
  Heart,
  Store,
  Palette,
  User,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { BuyerCartModal } from '../buyer/BuyerCartModal';

export const TopAppBar: React.FC = () => {
  const { 
    language, 
    setLanguage, 
    t, 
    activeTab, 
    setActiveTab, 
    orders,
    userRole,
    setUserRole,
    buyerMode,
    setBuyerMode,
    buyerTab,
    setBuyerTab,
    cartCount,
    wishlist,
    userName,
    userPhone,
    userProfile,
    signOut,
  } = useApp();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const pendingCustomOrdersCount = orders.filter(
    (o) => o.customRequest && o.customRequest.currentStep <= 2
  ).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EBE7E4] shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 h-16 flex items-center justify-between gap-2">
          {/* Left: Brand & Concise Role Icon */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div 
              onClick={() => {
                if (userRole === 'artisan') {
                  setActiveTab('dashboard');
                } else {
                  setBuyerTab('market');
                }
              }}
              className="cursor-pointer flex items-center gap-2 select-none"
            >
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#2C2C2C] tracking-tight">
                {t('appName')}
              </span>
            </div>

            {/* Active User Persona Badge & Interactive Profile/Role/Logout Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setLangMenuOpen(false);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF9F6] hover:bg-[#EBE7E4] border border-[#c9c4d0] flex items-center justify-center text-[#2C2C2C] shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                title={
                  userRole === 'artisan'
                    ? t('roleArtisanStudio')
                    : buyerMode === 'business'
                    ? t('roleB2BWholesale')
                    : t('roleCraftBuyerRetail')
                }
                aria-label="Active Category Profile and Login/Logout Menu"
                id="btn-user-profile-menu"
              >
                {userRole === 'artisan' ? (
                  <Palette className="w-4 h-4 text-[#423a6e]" />
                ) : buyerMode === 'business' ? (
                  <Store className="w-4 h-4 text-[#6e5d13]" />
                ) : (
                  <ShoppingBag className="w-4 h-4 text-[#423a6e]" />
                )}
              </button>

              {/* Profile / Account / Logout Dropdown floating on Main Page */}
              {profileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-xs" 
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-[calc(100%+14px)] w-72 sm:w-80 bg-white border border-[#c9c4d0] rounded-2xl shadow-2xl p-4 z-[70] animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#EBE7E4]">
                      <div className="w-10 h-10 rounded-full bg-[#e6deff] text-[#423a6e] font-extrabold flex items-center justify-center text-sm">
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1a1c1a] truncate">{userName || 'KalaSetu User'}</p>
                        <p className="text-xs text-[#797580] truncate">{userProfile?.email || userPhone || '+91 98765 43210'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f4f3f1] text-[#423a6e] uppercase">
                        {userRole === 'artisan' ? t('roleSellerPill') : buyerMode === 'business' ? t('roleB2BPill') : t('roleBuyerPill')}
                      </span>
                    </div>

                    {/* Role Switcher Options */}
                    <div className="py-2.5 space-y-1 border-b border-[#EBE7E4]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#797580] px-1">
                        {t('switchRoleTitle')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setUserRole('buyer');
                          setBuyerMode('personal');
                          setBuyerTab('market');
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          userRole === 'buyer' && buyerMode === 'personal'
                            ? 'bg-[#EDE7F6] text-[#423a6e] font-bold'
                            : 'text-[#48454F] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-[#423a6e]" />
                          <span>{t('roleCraftBuyerRetail')}</span>
                        </div>
                        {userRole === 'buyer' && buyerMode === 'personal' && <Check className="w-3.5 h-3.5 text-[#423a6e]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserRole('buyer');
                          setBuyerMode('business');
                          setBuyerTab('market');
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          userRole === 'buyer' && buyerMode === 'business'
                            ? 'bg-[#F4E39E]/40 text-[#6e5d13] font-bold'
                            : 'text-[#48454F] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-[#6e5d13]" />
                          <span>{t('roleB2BWholesale')}</span>
                        </div>
                        {userRole === 'buyer' && buyerMode === 'business' && <Check className="w-3.5 h-3.5 text-[#6e5d13]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserRole('artisan');
                          setActiveTab('dashboard');
                          setProfileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          userRole === 'artisan'
                            ? 'bg-[#EDE7F6] text-[#423a6e] font-bold'
                            : 'text-[#48454F] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#423a6e]" />
                          <span>{t('roleArtisanStudio')}</span>
                        </div>
                        {userRole === 'artisan' && <Check className="w-3.5 h-3.5 text-[#423a6e]" />}
                      </button>
                    </div>

                    {/* Log Out Button */}
                    <div className="pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#BA1A1A]/10 hover:bg-[#BA1A1A]/15 text-[#BA1A1A] text-xs font-bold transition-colors active:scale-95 cursor-pointer"
                        id="btn-dropdown-logout"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('logoutReturnToLogin')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* If in Buyer Mode: Quick Wishlist & Cart Shortcuts */}
            {userRole === 'buyer' ? (
              <>
                <button
                  onClick={() => setBuyerTab('wishlist')}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#EBE7E4] active:scale-95 transition-all shrink-0"
                  aria-label="Wishlist"
                  id="btn-buyer-wishlist"
                  title={t('tabWishlist')}
                >
                  <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${wishlist.length > 0 ? 'text-[#BA1A1A] fill-[#BA1A1A]' : 'text-[#48454F]'}`} />
                  {wishlist.length > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#BA1A1A] text-white text-[9px] font-bold flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#EBE7E4] active:scale-95 transition-all shrink-0"
                  aria-label="Shopping Bag"
                  id="btn-buyer-cart"
                  title={t('cartTitle')}
                >
                  <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2C2C2C]" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#5A5187] text-white text-[9px] font-bold flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Artisan Mode Notification Bell */
              <button
                onClick={() => setActiveTab('orders')}
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[#222222] hover:bg-[#EBE7E4] active:scale-95 transition-all shrink-0"
                aria-label="View Orders Notifications"
                id="btn-notifications"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#2C2C2C]" />
                {pendingCustomOrdersCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#BA1A1A] ring-2 ring-[#FAF9F6] animate-pulse" />
                )}
              </button>
            )}

            {/* Compact 2-Letter Language Code Selector Dropdown */}
            <div className="relative shrink-0" ref={langMenuRef}>
              <button
                onClick={() => {
                  setLangMenuOpen(!langMenuOpen);
                  setProfileMenuOpen(false);
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#D0D0D4] hover:bg-[#F5F5F3] flex items-center justify-center text-xs font-extrabold text-[#423a6e] uppercase tracking-tight shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                id="current-lang-display"
                aria-label="Select Language (15 Indian Languages)"
                title={`Language: ${currentLangObj.label} (${language.toUpperCase()})`}
              >
                {language.toUpperCase()}
              </button>

              {langMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-xs" 
                    onClick={() => setLangMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+14px)] w-72 sm:w-80 max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-[#c9c4d0] py-2 z-[70] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#636466] border-b border-[#F5F5F3] flex items-center justify-between bg-[#FAF9F6] shrink-0">
                      <span>{t('languagesCountLabel')}</span>
                      <span className="text-[#5A5187] font-semibold">{SUPPORTED_LANGUAGES.length}</span>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] divide-y divide-[#F5F5F3] p-1">
                      {SUPPORTED_LANGUAGES.map((item) => (
                        <button
                          key={item.code}
                          onClick={() => {
                            setLanguage(item.code);
                            setLangMenuOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            language === item.code
                              ? 'bg-[#F4E39E]/40 text-[#2C2C2C] font-bold'
                              : 'text-[#48454F] hover:bg-[#F5F5F3]'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-[#222222]">{item.label}</span>
                            <span className="text-[10px] text-[#636466]">{item.englishName} • {item.region}</span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EBE7E4] text-[#5A5187] uppercase">
                              {item.code}
                            </span>
                            {language === item.code && <Check className="w-3.5 h-3.5 text-[#7D6B21]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Cart Modal */}
      <BuyerCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </>
  );
};

