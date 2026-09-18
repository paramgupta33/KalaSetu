import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, Product } from '../../types';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Award, 
  Building2, 
  ShoppingBag, 
  Heart, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  MapPin, 
  SlidersHorizontal,
  Flame,
  Check,
  LogOut
} from 'lucide-react';

export const BuyerMarketHome: React.FC = () => {
  const { 
    language, 
    products, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory,
    buyerMode,
    b2bProfile,
    wishlist,
    toggleWishlist,
    addToCart,
    setBuyerTab,
    selectedBuyerProduct,
    setSelectedBuyerProduct,
    showToast,
    resetOnboarding,
    t
  } = useApp();

  const [giOnly, setGiOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [bulkOnly, setBulkOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset pagination when search or filters change
  React.useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, giOnly, inStockOnly, bulkOnly, searchQuery]);

  const categories: { key: ProductCategory; label: string; icon: string }[] = [
    { key: 'all', label: t('allCrafts'), icon: '✨' },
    { key: 'pottery', label: t('potteryClay'), icon: '🏺' },
    { key: 'wood', label: t('woodCarving'), icon: '🪵' },
    { key: 'textiles', label: t('handloomTextiles'), icon: '🧵' },
    { key: 'painting', label: t('folkPainting'), icon: '🎨' },
    { key: 'metal', label: t('brassMetal'), icon: '🪙' },
    { key: 'jewelry', label: t('tribalJewelry'), icon: '💎' },
  ];

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // GI Certified filter
      if (giOnly && !item.giCertified) {
        return false;
      }
      // In Stock filter
      if (inStockOnly && !item.inStock) {
        return false;
      }
      // Bulk filter
      if (bulkOnly && !item.bulkTier) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title[language] || item.title.en).toLowerCase().includes(q);
        const catMatch = (item.categoryLabel[language] || item.categoryLabel.en).toLowerCase().includes(q);
        const clusterMatch = item.artisan?.cluster.toLowerCase().includes(q);
        const stateMatch = item.artisan?.state.toLowerCase().includes(q);
        const artisanMatch = item.artisan?.name.toLowerCase().includes(q);
        return titleMatch || catMatch || clusterMatch || stateMatch || artisanMatch;
      }
      return true;
    });
  }, [products, selectedCategory, giOnly, inStockOnly, bulkOnly, searchQuery, language]);

  return (
    <div className="space-y-6 pb-12" id="buyer-market-home">
      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#636466] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchMarketPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white rounded-full border border-[#D0D0D4] placeholder:text-[#9E9E9E] focus:outline-hidden focus:border-[#5A5187] focus:ring-1 focus:ring-[#5A5187] shadow-2xs"
              id="input-buyer-search"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#636466] hover:text-black"
              >
                {t('clearSearch')}
              </button>
            )}
          </div>
        </div>

        {/* Categories Chips Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-[#2C2C2C] text-white shadow-xs'
                    : 'bg-white text-[#48454F] border border-[#EBE7E4] hover:bg-[#F5F5F3]'
                }`}
                id={`cat-chip-${cat.key}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Attribute Badges: GI Certified, In Stock, Bulk Tier */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setGiOnly(!giOnly)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
              giOnly
                ? 'bg-[#EDE7F6] text-[#5A5187] border-[#5A5187]'
                : 'bg-white text-[#636466] border-[#EBE7E4] hover:bg-[#FAF9F6]'
            }`}
            id="filter-gi-certified"
          >
            <Award className="w-3 h-3 text-[#5A5187]" />
            <span>{t('giOnlyFilter')}</span>
            {giOnly && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <button
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
              inStockOnly
                ? 'bg-[#E6F4EA] text-[#137333] border-[#137333]'
                : 'bg-white text-[#636466] border-[#EBE7E4] hover:bg-[#FAF9F6]'
            }`}
            id="filter-in-stock"
          >
            <span className="w-2 h-2 rounded-full bg-[#137333]" />
            <span>{t('inStockFilter')}</span>
            {inStockOnly && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <button
            onClick={() => setBulkOnly(!bulkOnly)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
              bulkOnly
                ? 'bg-[#FFF9E6] text-[#7D6B21] border-[#7D6B21]'
                : 'bg-white text-[#636466] border-[#EBE7E4] hover:bg-[#FAF9F6]'
            }`}
            id="filter-bulk-discounts"
          >
            <Flame className="w-3 h-3 text-[#7D6B21]" />
            <span>{t('bulkTierFilter')}</span>
            {bulkOnly && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <div className="ml-auto text-xs text-[#636466] font-medium hidden sm:block">
            {t('showingCraftCount')} (<strong className="text-[#2C2C2C]">{filteredProducts.length}</strong>)
          </div>
        </div>
      </div>

      {/* 3. Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#EBE7E4]">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] text-[#636466] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#2C2C2C]">{t('noCraftsFound')}</h3>
          <p className="text-xs text-[#636466] mt-1">
            {t('noCraftsFoundDesc')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setGiOnly(false);
              setInStockOnly(false);
              setBulkOnly(false);
            }}
            className="mt-4 px-4 py-2 rounded-full bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black"
          >
            {t('resetAllFilters')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.slice(0, visibleCount).map((product) => {
              const isLiked = wishlist.includes(product.id);
              const title = product.title[language] || product.title.en;
              const categoryLabel = product.categoryLabel[language] || product.categoryLabel.en;
              const artisan = product.artisan;
              const bulkTier = product.bulkTier;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#EBE7E4] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group cursor-pointer"
                  onClick={() => setSelectedBuyerProduct(product)}
                  id={`card-buyer-prod-${product.id}`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-[#EDEAE5]">
                    <img
                      src={product.imageUrl}
                      alt={product.altText || title}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-[#2C2C2C] backdrop-blur-xs shadow-2xs">
                        {categoryLabel}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-all ${
                          isLiked
                            ? 'bg-white text-[#BA1A1A] shadow-md'
                            : 'bg-black/30 text-white hover:bg-white hover:text-[#BA1A1A]'
                        }`}
                        aria-label="Toggle Wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom Image Tag */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      {product.giCertified ? (
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px] font-bold text-[#F4E39E] border border-white/20">
                          <Award className="w-3 h-3" />
                          <span>{t('giAuthenticated')}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] opacity-80">{artisan?.state || 'India'}</span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] backdrop-blur-xs ${
                        product.stockCount > 0 ? 'bg-black/40 text-white' : 'bg-[#BA1A1A]/80 text-white font-bold'
                      }`}>
                        {product.stockCount > 0 ? `${product.stockCount} ${t('inStockLabel')}` : 'Out of stock'}
                      </span>
                    </div>
                  </div>

                  {/* Card Info Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Artisan Snippet */}
                      {artisan && (
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={artisan.avatarUrl || artisan.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'}
                            alt={artisan.name}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover border border-[#D0D0D4]"
                          />
                          <span className="text-[11px] font-semibold text-[#636466] truncate">
                            {artisan.name} • {artisan.cluster}
                          </span>
                          {artisan.verifiedBadge && (
                            <ShieldCheck className="w-3 h-3 text-[#5A5187] shrink-0" />
                          )}
                        </div>
                      )}

                      <h4 className="text-sm sm:text-base font-bold text-[#2C2C2C] group-hover:text-[#5A5187] transition-colors line-clamp-1">
                        {title}
                      </h4>

                      <p className="text-xs text-[#636466] line-clamp-2 mt-1 leading-relaxed">
                        {(product.craftStory as any)?.historicalOrigin ||
                          (product.craftStory as any)?.[language] ||
                          'Crafted by generational master artisans using traditional regional tools and natural earth pigments.'}
                      </p>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-2 border-t border-[#EBE7E4] flex items-center justify-between">
                      <div>
                        {buyerMode === 'business' && bulkTier ? (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#7D6B21]">{t('bulkTierLabel')} ({bulkTier.minUnits || bulkTier.minQty || 50}+ pcs)</div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold text-[#2C2C2C]">
                                ₹{bulkTier.pricePerUnit.toLocaleString()}
                              </span>
                              <span className="text-[10px] line-through text-[#636466]">₹{product.mrp}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#636466]">{t('retailPriceLabel')}</div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold text-[#2C2C2C]">
                                ₹{product.price.toLocaleString()}
                              </span>
                              <span className="text-[10px] line-through text-[#636466]">₹{product.mrp}</span>
                              <span className="text-[10px] font-bold text-[#BA1A1A]">
                                -{product.discountPercent}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBuyerProduct(product);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#D0D0D4] text-xs font-bold text-[#2C2C2C] group-hover:bg-[#2C2C2C] group-hover:text-white transition-all flex items-center gap-1"
                      >
                        <span>{t('detailsBtn')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lazy Load / Pagination Controls */}
          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="px-6 py-2.5 rounded-full bg-white border border-[#D0D0D4] text-xs font-bold text-[#2C2C2C] hover:bg-[#F5F5F3] active:scale-95 transition-all shadow-2xs"
                id="btn-load-more-products"
              >
                Load More Crafts ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
