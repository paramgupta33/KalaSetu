import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Sparkles, 
  Award, 
  MapPin, 
  Clock, 
  Layers, 
  Ruler, 
  Package, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  FileText
} from 'lucide-react';

interface CraftStoryModalProps {
  product: Product | null;
  onClose: () => void;
}

export const CraftStoryModal: React.FC<CraftStoryModalProps> = ({ product, onClose }) => {
  const { 
    language, 
    buyerMode, 
    addToCart, 
    wishlist, 
    toggleWishlist, 
    setBuyerTab, 
    openModal,
    showToast,
    trackAnalyticsEvent,
    t
  } = useApp();

  const [quantity, setQuantity] = useState<number>(1);
  const [customNote, setCustomNote] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'details' | 'story' | 'bulk'>('details');
  const trackedIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (product?.id && trackedIdRef.current !== product.id) {
      trackedIdRef.current = product.id;
      trackAnalyticsEvent('PRODUCT_VIEW', product.id);
    } else if (!product) {
      trackedIdRef.current = null;
    }
  }, [product, trackAnalyticsEvent]);

  if (!product) return null;

  const isLiked = wishlist.includes(product.id);
  const title = typeof product.title === 'string' 
    ? product.title 
    : ((product.title as any)?.[language] || product.title?.en || 'Handcrafted Heritage Craft');
  const categoryLabel = typeof product.categoryLabel === 'string'
    ? product.categoryLabel
    : ((product.categoryLabel as any)?.[language] || product.categoryLabel?.en || product.category || 'Handmade Craft');
  const artisan = product.artisan;
  const craftStory = product.craftStory;
  const bulkTier = product.bulkTier;

  const availableStock =
    typeof product.stockCount === 'number'
      ? product.stockCount
      : typeof product.stock === 'number'
      ? product.stock
      : 99;
  const isOutOfStock = availableStock <= 0;

  const handleAddToCart = (bulkActive: boolean = false) => {
    if (isOutOfStock) return;
    addToCart(product, Math.min(quantity, Math.max(1, availableStock)), customNote, bulkActive);
    onClose();
  };

  const handleStartBulkInquiry = () => {
    onClose();
    setBuyerTab('b2b');
    showToast(`Initiating Bulk Sourcing RFQ for ${title}`, 'info');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      id="modal-craft-story"
    >
      <div className="bg-[#FAF9F6] border border-[#EBE7E4] rounded-3xl max-w-3xl w-full shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EBE7E4] bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7D6B21] bg-[#FFF9E6] px-2.5 py-0.5 rounded-full border border-[#F4E39E]">
              {categoryLabel}
            </span>
            {product.giCertified && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#5A5187] bg-[#EDE7F6] px-2 py-0.5 rounded-full">
                <Award className="w-3 h-3 text-[#5A5187]" />
                GI Registered Craft
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                isLiked
                  ? 'bg-[#FFEBEB] text-[#BA1A1A] border-[#FFD8D8]'
                  : 'bg-white text-[#48454F] border-[#D0D0D4] hover:bg-[#F5F5F3]'
              }`}
              aria-label="Wishlist"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-[#D0D0D4] flex items-center justify-center text-[#48454F] hover:bg-[#F5F5F3] transition-all"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6">
          {/* Hero Visual & Headline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Image Container with Artisan Overlay Tag */}
            <div className="relative rounded-2xl overflow-hidden bg-[#EDEAE5] aspect-4/3 sm:aspect-square group border border-[#EBE7E4]">
              <img
                src={product.imageUrl}
                alt={product.altText}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Geographical Stamp */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <MapPin className="w-3.5 h-3.5 text-[#F4E39E]" />
                  <span>{artisan?.cluster || 'Handcrafted Heritage Cluster'}</span>
                </div>
                <div className="bg-[#2C2C2C]/80 px-2 py-1 rounded-full text-[10px] font-mono">
                  {product.sku}
                </div>
              </div>
            </div>

            {/* Pricing & Key Summary */}
            <div className="flex flex-col justify-between h-full space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] leading-snug">
                  {title}
                </h1>
                
                {/* Artisan Snippet */}
                {artisan && (
                  <div className="flex items-center gap-2.5 mt-2.5 p-2 rounded-xl bg-white border border-[#EBE7E4]">
                    <img 
                      src={artisan.avatarUrl} 
                      alt={artisan.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-[#D0D0D4]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#2C2C2C] truncate">{artisan.name}</span>
                        {artisan.verifiedBadge && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#5A5187] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#636466] truncate">{artisan.state} • {artisan.experienceYears} yrs master artisan</p>
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="mt-4 p-3.5 rounded-2xl bg-[#FFF9E6] border border-[#F4E39E]/80">
                  {buyerMode === 'business' && bulkTier ? (
                    <div>
                      <div className="text-[11px] font-bold text-[#7D6B21] uppercase tracking-wider">
                        Enterprise Bulk Tier ({bulkTier.minUnits}+ units)
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-[#2C2C2C]">
                          ₹{bulkTier.pricePerUnit.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-[#636466]">/ unit</span>
                        <span className="text-xs line-through text-[#636466]">₹{product.mrp}</span>
                        <span className="text-[11px] font-bold text-[#7D6B21] bg-[#F4E39E] px-2 py-0.5 rounded-full">
                          Save {Math.round(((product.mrp - bulkTier.pricePerUnit) / product.mrp) * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#636466] mt-1.5">
                        Minimum Order Quantity: {bulkTier.minUnits} units • Lead time: {bulkTier.leadTimeDays} days
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[11px] font-bold text-[#636466] uppercase tracking-wider">
                        Direct Artisan Retail Price
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-extrabold text-[#2C2C2C]">
                          ₹{product.price.toLocaleString()}
                        </span>
                        <span className="text-xs line-through text-[#636466]">₹{product.mrp}</span>
                        <span className="text-xs font-bold text-[#BA1A1A] bg-[#FFDAD6] px-2 py-0.5 rounded-full">
                          {product.discountPercent}% OFF
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A5187] mt-1 font-medium">
                        ✓ Fair-trade price: 92% of earnings flow directly to the artisan cooperative
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selector & Custom Note */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-[#48454F]">Select Quantity</label>
                    {isOutOfStock ? (
                      <p className="text-[11px] font-bold text-[#BA1A1A] mt-0.5">
                        Currently Out of Stock
                      </p>
                    ) : availableStock <= 3 ? (
                      <p className="text-[11px] font-semibold text-[#BA1A1A] mt-0.5">
                        Hurry, only {availableStock} unit{availableStock > 1 ? 's' : ''} left!
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 bg-white border border-[#D0D0D4] rounded-full px-2 py-1">
                    <button
                      type="button"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-6 h-6 rounded-full bg-[#F5F5F3] text-sm font-bold flex items-center justify-center hover:bg-[#EBE7E4] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#2C2C2C]">
                      {isOutOfStock ? 0 : quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= availableStock || isOutOfStock}
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      className="w-6 h-6 rounded-full bg-[#F5F5F3] text-sm font-bold flex items-center justify-center hover:bg-[#EBE7E4] disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#48454F] mb-1">
                    Customization / Inscription Notes
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder={
                      buyerMode === 'business'
                        ? 'e.g. Laser engrave company logo on packaging box, festive wrap'
                        : 'e.g. Personalized gift message for recipient, Diwali ribbon'
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D0D0D4] bg-white focus:outline-hidden focus:border-[#5A5187]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Details, Maker's Story, Bulk Pricing */}
          <div className="border-b border-[#EBE7E4] flex items-center gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 text-xs font-bold transition-colors relative ${
                activeTab === 'details' ? 'text-[#2C2C2C]' : 'text-[#636466] hover:text-[#2C2C2C]'
              }`}
            >
              Craft Specifications
              {activeTab === 'details' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C2C2C] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('story')}
              className={`pb-2.5 text-xs font-bold transition-colors relative ${
                activeTab === 'story' ? 'text-[#2C2C2C]' : 'text-[#636466] hover:text-[#2C2C2C]'
              }`}
            >
              Meet the Maker & Guild
              {activeTab === 'story' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C2C2C] rounded-full" />
              )}
            </button>

            {bulkTier && (
              <button
                onClick={() => setActiveTab('bulk')}
                className={`pb-2.5 text-xs font-bold transition-colors relative ${
                  activeTab === 'bulk' ? 'text-[#7D6B21]' : 'text-[#636466] hover:text-[#7D6B21]'
                }`}
              >
                Volume Tiers & B2B
                {activeTab === 'bulk' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7D6B21] rounded-full" />
                )}
              </button>
            )}
          </div>

          {/* Tab 1: Specifications */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-[#EBE7E4]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#636466] mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#5A5187]" />
                  <span>Materials</span>
                </div>
                <div className="text-xs font-bold text-[#2C2C2C]">
                  {product.materials?.join(', ') || 'Natural terracotta, organic pigments'}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#EBE7E4]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#636466] mb-1">
                  <Ruler className="w-3.5 h-3.5 text-[#5A5187]" />
                  <span>Dimensions</span>
                </div>
                <div className="text-xs font-bold text-[#2C2C2C]">
                  {product.dimensions || '24cm H x 14cm D'}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#EBE7E4]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#636466] mb-1">
                  <Package className="w-3.5 h-3.5 text-[#5A5187]" />
                  <span>Stock Status</span>
                </div>
                <div className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${availableStock > 0 ? 'bg-[#18794E]' : 'bg-[#BA1A1A]'}`} />
                  <span>{availableStock > 0 ? `${availableStock} in stock` : 'Out of stock'}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-[#EBE7E4]">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#636466] mb-1">
                  <Award className="w-3.5 h-3.5 text-[#7D6B21]" />
                  <span>GI Status</span>
                </div>
                <div className="text-xs font-bold text-[#2C2C2C]">
                  {product.giCertified ? 'GI Certified' : 'Heritage Craft'}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Meet the Maker */}
          {activeTab === 'story' && (
            <div className="bg-white p-5 rounded-2xl border border-[#EBE7E4] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#2C2C2C]">{artisan?.name}</h4>
                  <p className="text-xs text-[#636466]">{artisan?.cluster}, {artisan?.state}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EDE7F6] text-[#5A5187] text-[11px] font-bold">
                  {artisan?.cooperativeName || 'Handcraft Cooperative'}
                </span>
              </div>
              <p className="text-xs text-[#48454F] leading-relaxed">
                {typeof craftStory === 'string'
                  ? craftStory
                  : (craftStory?.artisanBio || (craftStory as any)?.en || (craftStory as any)?.summary || product.altText ||
                    'Carrying forward a generational heritage of natural craft techniques passed down through generations of master artisans.')}
              </p>
              <div className="pt-2 border-t border-[#EBE7E4] flex items-center gap-4 text-xs font-medium text-[#636466]">
                <span>🏅 {artisan?.awards || 'National Merit Craft Certificate'}</span>
                <span>📅 Lead Crafting: 3–5 days</span>
              </div>
            </div>
          )}

          {/* Tab 3: Volume Tiers */}
          {activeTab === 'bulk' && bulkTier && (
            <div className="bg-white p-5 rounded-2xl border border-[#EBE7E4] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7D6B21]">
                Corporate & Bulk Procurement Schedule
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7E4]">
                  <div className="text-[10px] text-[#636466] font-semibold">1 – 24 units</div>
                  <div className="text-sm font-bold text-[#2C2C2C] mt-1">₹{product.price}</div>
                  <div className="text-[10px] text-[#636466]">Standard Retail</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#EBE7E4]">
                  <div className="text-[10px] text-[#636466] font-semibold">25 – 49 units</div>
                  <div className="text-sm font-bold text-[#2C2C2C] mt-1">₹{Math.round(product.price * 0.85)}</div>
                  <div className="text-[10px] text-[#7D6B21] font-bold">15% Volume Discount</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#FFF9E6] border border-[#F4E39E]">
                  <div className="text-[10px] text-[#7D6B21] font-bold">50+ units</div>
                  <div className="text-sm font-bold text-[#2C2C2C] mt-1">₹{bulkTier.pricePerUnit}</div>
                  <div className="text-[10px] text-[#7D6B21] font-bold">Max Wholesale Rate</div>
                </div>
              </div>
              <p className="text-[11px] text-[#636466] leading-relaxed">
                Includes customized GST invoicing, artisan guild provenance stamp, and options for custom engraved brass plates or cotton tote branding.
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA Strip */}
        <div className="p-4 sm:p-5 border-t border-[#EBE7E4] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#636466]">Total ({quantity} item{quantity > 1 ? 's' : ''}):</span>
            <span className="text-lg sm:text-xl font-extrabold text-[#2C2C2C]">
              ₹{(
                (buyerMode === 'business' && bulkTier ? bulkTier.pricePerUnit : product.price) * quantity
              ).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {buyerMode === 'business' ? (
              <>
                <button
                  type="button"
                  onClick={handleStartBulkInquiry}
                  className="px-4 py-2.5 rounded-full border border-[#7D6B21] text-[#7D6B21] hover:bg-[#FFF9E6] text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('b2bDirectRFQBtn')}</span>
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock || quantity > availableStock}
                  onClick={() => handleAddToCart(true)}
                  className="px-5 py-2.5 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-add-bulk-cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : 'Add Bulk Order'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity > availableStock}
                  onClick={() => handleAddToCart(false)}
                  className="px-5 py-2.5 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-add-retail-cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : t('b2cAddToCartBtn')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
