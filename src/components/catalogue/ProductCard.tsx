import React from 'react';
import { Product, ProductViewMode } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Eye, 
  ShoppingBag, 
  Package, 
  Edit3, 
  Share2, 
  QrCode, 
  PlusCircle, 
  AlertTriangle,
  MoreVertical
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  viewMode: ProductViewMode;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode }) => {
  const { 
    language, 
    toggleProductAvailability, 
    refillProductStock, 
    setSelectedAnalyticsProduct, 
    setActiveTab, 
    openModal,
    showToast,
    t
  } = useApp();

  const is2Col = viewMode === '2col';

  const handleInspectAnalytics = () => {
    setSelectedAnalyticsProduct(product);
    setActiveTab('analytics');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText?.(window.location.href);
    showToast(`Listing link for "${product.title.en}" copied to clipboard!`, 'info');
  };

  const handleOpenQr = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('qr_code', product);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openModal('edit_product', product);
  };

  return (
    <article
      className={`group bg-[#FFFFFF] rounded-2xl border ${
        product.isLowStock || product.stockCount <= 2
          ? 'border-[#F4E39E]'
          : 'border-[#EBE7E4]'
      } overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col`}
    >
      {/* Image & Overlay Badges */}
      <div 
        onClick={handleInspectAnalytics}
        className={`relative cursor-pointer overflow-hidden bg-[#F5F5F3] ${
          is2Col ? 'h-32 sm:h-40' : 'h-52 sm:h-64'
        }`}
      >
        <img
          src={product.imageUrl}
          alt={product.altText}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
          {product.isLowStock || product.stockCount <= 2 ? (
            <span className="px-2 py-0.5 rounded-md bg-[#F4E39E] text-[#272105] text-[10px] font-bold tracking-wider flex items-center gap-1 shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-[#7D6B21]" />
              <span>{t('lowStock')} • {product.stockCount} {t('lowStockLeft')}</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-[#D3E0D7]/95 backdrop-blur-xs text-[#252B28] text-[10px] font-bold tracking-wider shadow-2xs">
              {product.inStock ? t('activeInStock') : t('inactiveStock')}
            </span>
          )}

          <button
            onClick={handleInspectAnalytics}
            className="w-7 h-7 rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center text-[#222222] hover:bg-white shadow-xs transition-all shrink-0"
            title={t('detailsBtn')}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Category Chip (shown in 1col mode) */}
        {!is2Col && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#222222] text-[11px] font-semibold border border-white/40 shadow-2xs">
              {product.categoryLabel[language] || product.categoryLabel.en}
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className={`flex-1 flex flex-col justify-between ${is2Col ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5'}`}>
        <div>
          {/* Title */}
          <h3
            onClick={handleInspectAnalytics}
            className={`font-bold text-[#222222] group-hover:text-[#5A5187] transition-colors cursor-pointer leading-snug ${
              is2Col ? 'text-xs sm:text-sm line-clamp-2 min-h-[34px]' : 'text-base sm:text-lg'
            }`}
          >
            {product.title[language] || product.title.en}
          </h3>

          {!is2Col && <p className="text-[11px] text-[#76767F] mt-0.5 font-mono">SKU: {product.sku}</p>}

          {/* Price & Discount */}
          <div className={`flex items-baseline gap-1.5 flex-wrap ${is2Col ? 'mt-1.5' : 'mt-2'}`}>
            <span className={`font-extrabold text-[#222222] ${is2Col ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}>
              ₹ {product.price.toLocaleString()}
            </span>
            <span className={`text-[#76767F] line-through ${is2Col ? 'text-[11px]' : 'text-xs sm:text-sm'}`}>
              ₹ {product.mrp.toLocaleString()}
            </span>
            {!is2Col && (
              <span className="text-[10px] sm:text-[11px] font-bold text-[#7D6B21] bg-[#F4E39E]/60 px-1.5 py-0.5 rounded">
                {product.discountPercent}% {t('offDiscount')}
              </span>
            )}
          </div>

          {/* Stats Strip (1-column only) */}
          {!is2Col && (
            <div className="mt-3.5 pt-3 border-t border-[#EBE7E4] flex items-center justify-between text-[#636466] text-xs">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#76767F]" />
                <span>{product.views} {t('viewsLabel')}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-[#76767F]" />
                <span>{product.sold} {t('soldLabel')}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#4A5950] font-semibold">
                <Package className="w-3.5 h-3.5 text-[#4A5950]" />
                <span>{product.stockCount} {t('inStockLabel')}</span>
              </span>
            </div>
          )}
        </div>

        {/* Toolbar & Availability Switch */}
        <div
          className={`border-t border-[#EBE7E4] flex items-center justify-between gap-2 ${
            is2Col ? 'mt-2 pt-2' : 'mt-4 pt-3'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleEdit}
              className="p-1.5 sm:p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] active:scale-95 transition-all"
              title={t('editProduct')}
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {!is2Col && (
              <>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] active:scale-95 transition-all"
                  title={t('shareCraft')}
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleOpenQr}
                  className="p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#EBE7E4] text-[#222222] active:scale-95 transition-all"
                  title={t('qrCode')}
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </>
            )}

            {(product.isLowStock || product.stockCount <= 2) && (
              <button
                onClick={() => refillProductStock(product.id, 10)}
                className={`rounded-xl bg-[#7D6B21] text-white font-bold active:scale-95 transition-all flex items-center gap-1 ${
                  is2Col ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
                }`}
                title="Refill 10 units"
              >
                <PlusCircle className="w-3 h-3" />
                <span>{t('refillStock')}</span>
              </button>
            )}
          </div>

          {/* Quick In-Stock Switch */}
          <label className="inline-flex items-center cursor-pointer gap-1.5 select-none">
            {!is2Col && <span className="text-[11px] font-medium text-[#636466]">{t('availableToggle')}</span>}
            <div className="relative">
              <input
                type="checkbox"
                checked={product.inStock}
                onChange={() => toggleProductAvailability(product.id)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-[#EBE7E4] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#2C2C2C]" />
            </div>
          </label>
        </div>
      </div>
    </article>
  );
};
