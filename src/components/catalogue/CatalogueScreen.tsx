import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from './ProductCard';
import { ProductCategory } from '../../types';
import { FestiveReminderBanner } from './FestiveReminderBanner';
import { 
  Search, 
  Mic, 
  Plus, 
  SlidersHorizontal, 
  LayoutList, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  X
} from 'lucide-react';

export const CatalogueScreen: React.FC = () => {
  const { 
    products, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    sortBy, 
    setSortBy, 
    viewMode, 
    setViewMode, 
    setActiveTab, 
    showToast,
    language,
    t
  } = useApp();

  const categories = useMemo(() => [
    { id: 'all' as ProductCategory, label: t('allCrafts'), count: products.length },
    { id: 'pottery' as ProductCategory, label: t('potteryClay'), count: products.filter((p) => p.category === 'pottery').length },
    { id: 'textiles' as ProductCategory, label: t('handloomTextiles'), count: products.filter((p) => p.category === 'textiles').length },
    { id: 'brass' as ProductCategory, label: t('brassMetal'), count: products.filter((p) => p.category === 'brass').length },
    { id: 'wood' as ProductCategory, label: t('woodCarving'), count: products.filter((p) => p.category === 'wood').length },
    { id: 'jute' as ProductCategory, label: t('juteFiber'), count: products.filter((p) => p.category === 'jute').length },
  ], [products, t]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle =
            product.title.en.toLowerCase().includes(q) ||
            product.title.hi.toLowerCase().includes(q) ||
            product.title.mr.toLowerCase().includes(q);
          const matchSku = product.sku.toLowerCase().includes(q);
          const matchTag = product.tags.some((t) => t.toLowerCase().includes(q));
          return matchTitle || matchSku || matchTag;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'best_selling') return b.sold - a.sold;
        if (sortBy === 'stock_low') return a.stockCount - b.stockCount;
        return 0; // recently added default
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleSimulateVoice = () => {
    setSearchQuery('vase');
    showToast('Voice search: "vase"', 'info');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Festive Reminder & Preparation Advisory (Ganesh Chaturthi & Navratri) */}
      <FestiveReminderBanner />

      {/* 2. Search & Filter Bar + Add Craft CTA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#76767F]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchCraftPh')}
              className="w-full pl-10 pr-16 py-2.5 sm:py-3 rounded-2xl bg-[#FFFFFF] border border-[#EBE7E4] focus:border-[#5A5187] focus:ring-1 focus:ring-[#5A5187] text-sm text-[#222222] placeholder:text-[#76767F] transition-all shadow-xs"
              id="craftSearchInput"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-[#76767F] hover:text-[#222222]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleSimulateVoice}
                className="p-1.5 rounded-full text-[#76767F] hover:text-[#5A5187] hover:bg-[#F5F5F3]"
                title="Voice Search Simulation"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add Product Button - Directs to Upload Craft Page */}
          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-3 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all shrink-0 bg-[#2C2C2C] hover:bg-black"
            id="btn-add-product-cta"
            title={t('addProduct')}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addProduct')}</span>
          </button>
        </div>

        {/* Secondary Controls: Sort & 1-Col vs 2-Col View Switcher */}
        <div className="flex items-center justify-between gap-3">
          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial sm:min-w-[210px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#EBE7E4] text-[#222222] text-xs font-semibold focus:border-[#5A5187] focus:ring-1 focus:ring-[#5A5187] cursor-pointer shadow-xs"
              id="craft-sort-select"
            >
              <option value="recent">{t('sortRecent')}</option>
              <option value="best_selling">{t('sortBestSelling')}</option>
              <option value="price_high">{t('sortPriceHigh')}</option>
              <option value="price_low">{t('sortPriceLow')}</option>
              <option value="stock_low">{t('sortStockLow')}</option>
            </select>
            <SlidersHorizontal className="w-4 h-4 absolute right-2.5 top-3 pointer-events-none text-[#76767F]" />
          </div>

          {/* Interactive Layout View Switcher */}
          <div className="flex items-center p-1 bg-[#F5F5F3] rounded-xl border border-[#EBE7E4] shrink-0">
            <button
              onClick={() => setViewMode('1col')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === '1col'
                  ? 'bg-[#FFFFFF] text-[#2C2C2C] shadow-xs'
                  : 'text-[#636466] hover:text-[#222222]'
              }`}
              title="1 Column Detailed View"
              id="view1ColBtn"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('2col')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === '2col'
                  ? 'bg-[#FFFFFF] text-[#2C2C2C] shadow-xs'
                  : 'text-[#636466] hover:text-[#222222]'
              }`}
              title="2 Column Grid View"
              id="view2ColBtn"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#2C2C2C] text-white shadow-xs'
                    : 'bg-[#FFFFFF] text-[#636466] hover:bg-[#F5F5F3] border border-[#EBE7E4]'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Product Listing Grid */}
      <section
        className={`grid gap-3 sm:gap-4 ${
          viewMode === '2col' ? 'grid-cols-2' : 'grid-cols-1'
        }`}
        id="productListingGrid"
      >
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} viewMode={viewMode} />
        ))}
      </section>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center bg-[#FFFFFF] rounded-2xl border border-[#EBE7E4] p-6">
          <p className="text-sm font-semibold text-[#636466]">{t('noCraftsFound')}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 px-4 py-2 rounded-xl bg-[#2C2C2C] text-white text-xs font-bold"
          >
            {t('clearSearch')}
          </button>
        </div>
      )}

      {/* 4. Pagination / Showing Count Ribbon */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t border-[#EBE7E4] text-[#636466] text-xs font-medium">
        <p>{t('showingItems')} ({filteredProducts.length})</p>
        <div className="flex items-center gap-1.5">
          <button
            disabled
            className="px-3 py-1.5 rounded-xl border border-[#EBE7E4] text-[#76767F] opacity-50 cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 rounded-lg bg-[#2C2C2C] text-white font-bold text-xs">1</span>
          <button className="px-3 py-1 rounded-lg hover:bg-[#F5F5F3] text-[#222222] text-xs">2</button>
          <button className="px-3 py-1 rounded-lg hover:bg-[#F5F5F3] text-[#222222] text-xs">3</button>
          <button className="px-3 py-1.5 rounded-xl border border-[#EBE7E4] hover:bg-[#F5F5F3] text-[#222222] text-xs transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
