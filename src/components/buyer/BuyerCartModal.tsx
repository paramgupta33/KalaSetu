import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  FileText, 
  CheckCircle2,
  Building2,
  MapPin
} from 'lucide-react';

interface BuyerCartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyerCartModal: React.FC<BuyerCartModalProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    cartTotal, 
    removeFromCart, 
    updateCartQuantity, 
    placeOrderFromCart, 
    buyerMode,
    language,
    b2bProfile,
    t
  } = useApp();

  const [address, setAddress] = useState<string>(
    buyerMode === 'business'
      ? `${b2bProfile.organizationName}, 14th Floor, Maker Maxity, Bandra Kurla Complex, Mumbai, Maharashtra 400051`
      : 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gstAmount = Math.round(cartTotal * 0.05); // 5% GST on certified handcrafts
  const finalTotal = cartTotal + gstAmount;

  const hasStockIssue = cart.some((item) => {
    const stock =
      typeof item.product.stockCount === 'number'
        ? item.product.stockCount
        : typeof item.product.stock === 'number'
        ? item.product.stock
        : 99;
    return stock <= 0 || item.quantity > stock;
  });

  const handleCheckout = async () => {
    if (isSubmitting || hasStockIssue) return;
    setIsSubmitting(true);
    try {
      const order = await placeOrderFromCart(address);
      if (order) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      id="modal-buyer-cart"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF9F6] border border-[#EBE7E4] rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px))] sm:max-h-[86vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#EBE7E4] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EDE7F6] text-[#5A5187] flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="text-sm sm:text-base font-bold text-[#2C2C2C]">
                {buyerMode === 'business' ? 'B2B Sourcing Bag' : t('cartTitle')}
              </h2>
              <p className="text-[11px] text-[#636466]">
                {cart.length} authentic handcrafted line item{cart.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#D0D0D4] flex items-center justify-center text-[#48454F] hover:bg-[#F5F5F3] transition-all shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 overscroll-contain min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white border border-[#EBE7E4] text-[#636466] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#2C2C2C]">{t('cartEmptyTitle')}</h3>
              <p className="text-xs text-[#636466] max-w-xs mx-auto">
                Explore our catalog of certified rural artisan crafts and add items to your shopping bag.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {hasStockIssue && (
                <div className="bg-[#FFDAD6] border border-[#FFB4AB] text-[#93000A] p-2.5 rounded-xl text-xs flex items-center justify-between gap-2">
                  <span className="font-medium">Some items exceed available stock.</span>
                  <button
                    type="button"
                    onClick={() => {
                      cart.forEach((c) => {
                        const s =
                          typeof c.product.stockCount === 'number'
                            ? c.product.stockCount
                            : typeof c.product.stock === 'number'
                            ? c.product.stock
                            : 99;
                        if (s <= 0) {
                          removeFromCart(c.product.id);
                        } else if (c.quantity > s) {
                          updateCartQuantity(c.product.id, s);
                        }
                      });
                    }}
                    className="font-bold underline shrink-0 cursor-pointer hover:text-black"
                  >
                    Auto-adjust bag
                  </button>
                </div>
              )}

              {cart.map((item) => {
                const title = item.product.title[language] || item.product.title.en;
                const artisan = item.product.artisan;
                const availableStock =
                  typeof item.product.stockCount === 'number'
                    ? item.product.stockCount
                    : typeof item.product.stock === 'number'
                    ? item.product.stock
                    : 99;
                const isOutOfStock = availableStock <= 0;
                const isExceedingStock = item.quantity > availableStock;

                return (
                  <div
                    key={item.product.id}
                    className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-2xs flex gap-3 sm:gap-4 items-start ${
                      isExceedingStock || isOutOfStock ? 'border-[#FFB4AB]' : 'border-[#EBE7E4]'
                    }`}
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#EBE7E4] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-[#2C2C2C] truncate">
                            {title}
                          </h4>
                          <p className="text-[11px] text-[#636466] flex items-center gap-1 mt-0.5 truncate">
                            <ShieldCheck className="w-3 h-3 text-[#5A5187] shrink-0" />
                            <span className="truncate">{artisan?.name} • {artisan?.cluster}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[#BA1A1A] hover:text-[#93000A] p-1 text-xs shrink-0 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {isOutOfStock ? (
                        <div className="mt-2 text-[11px] text-[#BA1A1A] bg-[#FFDAD6] px-2.5 py-1 rounded-lg font-medium flex items-center justify-between">
                          <span>⚠️ Currently Out of Stock</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="underline font-bold text-[#93000A] hover:text-black ml-2 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : isExceedingStock ? (
                        <div className="mt-2 text-[11px] text-[#BA1A1A] bg-[#FFDAD6] px-2.5 py-1 rounded-lg font-medium flex items-center justify-between">
                          <span>⚠️ Only {availableStock} left in stock</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, availableStock)}
                            className="underline font-bold text-[#93000A] hover:text-black ml-2 cursor-pointer"
                          >
                            Adjust to {availableStock}
                          </button>
                        </div>
                      ) : null}

                      {item.customNotes && (
                        <div className="text-[10px] text-[#7D6B21] bg-[#FFF9E6] px-2 py-0.5 rounded-md mt-1.5 border border-[#F4E39E] truncate">
                          Note: {item.customNotes}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#FAF9F6]">
                        <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#D0D0D4] rounded-full px-2 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold hover:bg-[#EBE7E4] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#2C2C2C]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= availableStock || isOutOfStock}
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold hover:bg-[#EBE7E4] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-[#2C2C2C]">
                            ₹{(item.unitPrice * item.quantity).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-[#636466]">
                            ₹{item.unitPrice.toLocaleString()}/unit
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Delivery Address Field */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EBE7E4] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2C2C]">
                  <MapPin className="w-3.5 h-3.5 text-[#5A5187] shrink-0" />
                  <span>Delivery & Dispatch Address</span>
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#D0D0D4] bg-[#FAF9F6] focus:bg-white focus:outline-hidden focus:border-[#5A5187] resize-none box-border"
                />
              </div>

              {/* Price Breakdown */}
              <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-[#EBE7E4] space-y-2 text-xs">
                <div className="flex justify-between text-[#636466]">
                  <span>{t('cartSubtotal')}</span>
                  <span className="font-semibold text-[#2C2C2C]">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#636466]">
                  <span>GST (5% on Certified Handicrafts)</span>
                  <span className="font-semibold text-[#2C2C2C]">₹{gstAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#137333]">
                  <span>Cluster Direct Shipping</span>
                  <span className="font-bold">FREE (KalaSetu ESG Subsidy)</span>
                </div>
                <div className="pt-2 border-t border-[#EBE7E4] flex justify-between text-sm font-extrabold text-[#2C2C2C]">
                  <span>Total Payable</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-[#5A5187] font-medium pt-1">
                  ✓ Includes official GI Digital Certificate of Authenticity with government registration seal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer Actions - Always 100% visible and above bottom dock */}
        {cart.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-[#EBE7E4] bg-white flex items-center justify-between gap-3 shrink-0 z-10">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-[#636466] tracking-wider">Grand Total</div>
              <div className="text-base sm:text-lg font-extrabold text-[#2C2C2C] truncate">
                ₹{finalTotal.toLocaleString()}
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || hasStockIssue}
              onClick={handleCheckout}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#2C2C2C] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              id="btn-place-order"
            >
              <span>
                {isSubmitting
                  ? 'Placing Order...'
                  : hasStockIssue
                  ? 'Fix Stock to Order'
                  : t('checkoutNowBtn')}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
