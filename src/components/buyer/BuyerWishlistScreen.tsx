import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  Sparkles, 
  Award, 
  MapPin, 
  ChevronRight,
  ShieldCheck 
} from 'lucide-react';

export const BuyerWishlistScreen: React.FC = () => {
  const { 
    products, 
    wishlist, 
    toggleWishlist, 
    addToCart, 
    setSelectedBuyerProduct, 
    setBuyerTab,
    language,
    showToast,
    t
  } = useApp();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const [movingProductIds, setMovingProductIds] = React.useState<string[]>([]);
  const [isMovingAll, setIsMovingAll] = React.useState<boolean>(false);

  const handleMoveToCart = async (product: (typeof products)[0]) => {
    if (movingProductIds.includes(product.id)) return;
    setMovingProductIds((prev) => [...prev, product.id]);
    try {
      const success = await addToCart(product, 1, undefined, false, false);
      if (success) {
        toggleWishlist(product.id);
      }
    } finally {
      setMovingProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  const handleMoveAllToBag = async () => {
    if (wishlistedProducts.length === 0 || isMovingAll) return;
    const inStockItems = wishlistedProducts.filter((p) => {
      const stock =
        typeof p.stockCount === 'number'
          ? p.stockCount
          : typeof (p as any).stock === 'number'
          ? (p as any).stock
          : 99;
      return stock > 0;
    });
    if (inStockItems.length === 0) {
      showToast('All items in your wishlist are currently out of stock', 'warning');
      return;
    }

    setIsMovingAll(true);
    let addedCount = 0;
    try {
      for (const p of inStockItems) {
        const success = await addToCart(p, 1, undefined, false, true);
        if (success) {
          toggleWishlist(p.id);
          addedCount++;
        }
      }
      if (addedCount > 0) {
        showToast(
          `Moved ${addedCount} in-stock item${addedCount > 1 ? 's' : ''} to your shopping bag!`,
          'success'
        );
      }
    } finally {
      setIsMovingAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto" id="buyer-wishlist-screen">
      {/* Header */}
      <div className="border-b border-[#EBE7E4] pb-4 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEBEB] text-[#BA1A1A] text-xs font-bold mb-1">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>{t('tabWishlist')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] tracking-tight">
            {t('myWishlistTitle')} ({wishlistedProducts.length})
          </h1>
          <p className="text-xs text-[#636466] mt-0.5">
            {t('curatedMasterpieces')}
          </p>
        </div>

        {wishlistedProducts.length > 0 && (
          <button
            onClick={handleMoveAllToBag}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('moveToCartBtn')}</span>
          </button>
        )}
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EBE7E4] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FFEBEB] text-[#BA1A1A] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C2C2C]">{t('wishlistEmptyTitle')}</h3>
          <p className="text-xs text-[#636466] max-w-xs mx-auto">
            {t('wishlistEmptySubtitle')}
          </p>
          <button
            onClick={() => setBuyerTab('market')}
            className="px-5 py-2.5 rounded-full bg-[#2C2C2C] text-white text-xs font-bold hover:bg-black transition-all"
          >
            {t('exploreMarketBtn')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlistedProducts.map((product) => {
            const title = product.title[language] || product.title.en;
            const artisan = product.artisan;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#EBE7E4] p-4 flex gap-4 items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
              >
                <img
                  src={product.imageUrl}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-xl object-cover border border-[#EBE7E4] shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-[#7D6B21] bg-[#FFF9E6] px-2 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    {product.giCertified && (
                      <span className="text-[10px] font-bold text-[#5A5187] bg-[#EDE7F6] px-1.5 py-0.5 rounded-sm">
                        GI
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-[#2C2C2C] truncate mt-1">
                    {title}
                  </h3>

                  <p className="text-[11px] text-[#636466] truncate mt-0.5">
                    {artisan?.name} • {artisan?.cluster}
                  </p>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-extrabold text-[#2C2C2C]">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] line-through text-[#636466]">₹{product.mrp}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="text-[#BA1A1A] hover:text-[#93000A] p-1"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {(() => {
                    const stock =
                      typeof product.stockCount === 'number'
                        ? product.stockCount
                        : typeof (product as any).stock === 'number'
                        ? (product as any).stock
                        : 99;
                    const isOutOfStock = stock <= 0;
                    const isMoving = movingProductIds.includes(product.id) || isMovingAll;

                    return (
                      <button
                        type="button"
                        disabled={isOutOfStock || isMoving}
                        onClick={() => handleMoveToCart(product)}
                        className="px-3 py-1.5 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>
                          {isMoving
                            ? 'Moving...'
                            : isOutOfStock
                            ? 'Out of Stock'
                            : t('moveToCartBtn')}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
