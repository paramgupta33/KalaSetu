import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  RotateCcw, 
  Compass
} from 'lucide-react';
import { Product } from '../../types';
import { DiscoverCard, DiscoverCardItem } from './DiscoverCard';
import { 
  rankProductsForDiscover, 
  recordInteraction, 
  resetUserDiscoverPreferences
} from '../../services/discoverRecommendationService';

/**
 * Maps a real Product into a minimal, high-fidelity Discover Reel item
 */
function mapProductToDiscoverItem(product: Product, language: string = 'en'): DiscoverCardItem {
  const langKey = language || 'en';
  const title = typeof product.title === 'string'
    ? product.title
    : (product.title as any)?.[langKey] || product.title?.en || 'Handcrafted Heritage Craft';
  
  const categoryLabel = typeof product.categoryLabel === 'string'
    ? product.categoryLabel
    : (product.categoryLabel as any)?.[langKey] || product.categoryLabel?.en || product.category || 'Craft';
    
  const price = typeof product.price === 'number' ? product.price : 1000;
  const mrp = typeof product.mrp === 'number' && product.mrp > price ? product.mrp : Math.round(price * 1.25);

  let storyText = '';
  if (typeof product.craftStory === 'string') {
    storyText = product.craftStory;
  } else if (product.craftStory) {
    storyText = (product.craftStory as any)[langKey] || product.craftStory.en || (product.craftStory as any).summary || '';
  }
  if (!storyText && product.altText) {
    storyText = product.altText;
  }

  const materialsText = Array.isArray(product.materials) && product.materials.length > 0 
    ? product.materials.join(', ')
    : 'Traditional Craft Materials';

  const artisanName = product.artisan?.name || 'Master Artisan Guild';
  const cluster = product.artisan?.cluster || (product.artisan?.location ? `${product.artisan.location} • ${product.artisan.state || 'India'}` : 'Heritage Craft Cluster');
  const artisanAvatar = product.artisan?.avatar || product.artisan?.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80';

  return {
    id: `card-${product.id}`,
    product,
    productId: product.id,
    title,
    mrp: `₹${mrp.toLocaleString('en-IN')}`,
    price: `₹${price.toLocaleString('en-IN')}`,
    numericPrice: price,
    category: categoryLabel.toUpperCase(),
    image: product.imageUrl,
    artisanName,
    cluster,
    artisanAvatar,
    description: storyText,
    material: materialsText,
    giCertified: Boolean(product.giCertified || product.isGiCertified),
  };
}

export const BuyerDiscoverFeed: React.FC = () => {
  const { 
    products, 
    addToCart, 
    setSelectedBuyerProduct,
    showToast,
    session,
    userProfile,
    language,
    isInWishlist,
    toggleWishlist,
  } = useApp();

  // Determine active authenticated buyer ID (strictly user-specific)
  const activeUserId = useMemo(() => {
    return session?.user?.id || userProfile?.user_id || 'authenticated_buyer';
  }, [session?.user?.id, userProfile?.user_id]);

  const [cards, setCards] = useState<DiscoverCardItem[]>([]);
  const [animatingCardId, setAnimatingCardId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<'left' | 'right'>('left');
  const [isResetSpinning, setIsResetSpinning] = useState(false);

  // Synchronize Discover Feed with real products from AppContext
  useEffect(() => {
    if (!products || products.length === 0) return;

    const ranked = rankProductsForDiscover(products, activeUserId);
    const mappedCards = ranked.map((p) => mapProductToDiscoverItem(p, language));
    setCards(mappedCards);
  }, [products, activeUserId, language]);

  // Stable references for state to prevent unnecessary re-renders
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const animatingCardIdRef = useRef(animatingCardId);
  animatingCardIdRef.current = animatingCardId;
  const activeUserIdRef = useRef(activeUserId);
  activeUserIdRef.current = activeUserId;

  /**
   * Main Swipe Handler:
   * - Swipe LEFT  = Like / Interested
   * - Swipe RIGHT = Skip / Not Interested
   * - Completely clean and immediate: NO text overlays, NO toast notifications
   * - Preference signals recorded internally for recommendation learning
   */
  const sendToBack = useCallback((direction: 'left' | 'right') => {
    const currentCards = cardsRef.current;
    if (currentCards.length === 0 || animatingCardIdRef.current) return;

    const currentTop = currentCards[0];
    setAnimatingCardId(currentTop.id);
    setExitDirection(direction);

    if (direction === 'left') {
      recordInteraction(activeUserIdRef.current, currentTop.product, 'swipe_left');
      if (!isInWishlist(currentTop.product.id)) {
        toggleWishlist(currentTop.product.id);
      }
      showToast('Liked ❤️', 'success');
    } else {
      // Do NOT show any notification for Skip / right swipe
      recordInteraction(activeUserIdRef.current, currentTop.product, 'swipe_right');
    }

    setTimeout(() => {
      setCards((prev) => {
        if (prev.length <= 1) return prev;
        const next = [...prev];
        const removed = next.shift();
        if (removed) next.push(removed); // Continuous loop
        return next;
      });
      setAnimatingCardId(null);
    }, 280);
  }, [isInWishlist, toggleWishlist, showToast]);

  /**
   * Small, non-dominant Reset Feed button
   */
  const handleResetPreferences = useCallback(() => {
    setIsResetSpinning(true);
    resetUserDiscoverPreferences(activeUserIdRef.current);

    // Re-rank products to default order
    const defaultRanked = rankProductsForDiscover(products, activeUserIdRef.current);
    const mapped = defaultRanked.map((p) => mapProductToDiscoverItem(p, language));
    setCards(mapped);

    setTimeout(() => setIsResetSpinning(false), 450);
  }, [products, language]);

  /**
   * Direct Add to Cart:
   * Waits for the backend response before showing confirmation.
   * If the request fails, does NOT pretend it was added successfully.
   */
  const handleDirectBuy = useCallback(async (card: DiscoverCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // silent=false allows addToCart to show "Added to shopping bag" only upon confirmed backend success
    const success = await addToCart(card.product, 1, undefined, false, false);
    if (success) {
      recordInteraction(activeUserIdRef.current, card.product, 'wishlist');
    }
  }, [addToCart]);

  /**
   * Open Craft Story & Product Details Modal on card/overlay tap
   */
  const handleOpenStory = useCallback((card: DiscoverCardItem) => {
    recordInteraction(activeUserIdRef.current, card.product, 'story_open');
    setSelectedBuyerProduct(card.product);
  }, [setSelectedBuyerProduct]);

  return (
    <div 
      className="w-full h-full max-w-sm sm:max-w-md mx-auto flex flex-col justify-between relative px-3 pt-1 pb-24 sm:pb-28 select-none overflow-hidden" 
      id="buyer-discover-feed"
    >
      {/* Top Header: Subtle label + small Reset Feed action */}
      <div className="flex items-center justify-between px-1.5 py-1 z-30 shrink-0">
        <span className="text-xs font-semibold text-[#5A5550] tracking-wide">
          Discover
        </span>

        {/* Small, non-dominant Reset Feed button */}
        <button
          type="button"
          onClick={handleResetPreferences}
          aria-label="Reset Feed"
          title="Reset learned feed preferences"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-[#605A54] hover:text-[#2C2C2C] text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
          id="btnResetFeed"
        >
          <RotateCcw className={`w-3 h-3 ${isResetSpinning ? 'animate-spin' : ''}`} />
          <span>Reset Feed</span>
        </button>
      </div>

      {/* Main Reels Card Stack Container: Bounded strictly above the bottom navigation */}
      <div className="relative flex-1 w-full min-h-0 flex items-center justify-center perspective-1000 my-1 overflow-hidden">
        {cards.length > 0 ? (
          <div className="relative w-full h-full max-h-[620px]" id="cardStack">
            {cards.slice(0, 3).map((card, idx) => {
              const depth = idx;
              const isTop = depth === 0;
              const isExiting = isTop && animatingCardId === card.id;

              return (
                <DiscoverCard
                  key={card.id}
                  card={card}
                  depth={depth}
                  isTop={isTop}
                  isExiting={isExiting}
                  exitDirection={exitDirection}
                  onSwipe={sendToBack}
                  onOpenStory={handleOpenStory}
                  onQuickBuy={handleDirectBuy}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-[#EBE7E4] shadow-xs">
            <Compass className="w-10 h-10 text-[#5A5187] animate-pulse mb-3" />
            <h3 className="text-sm font-bold text-[#2C2C2C]">Loading Discover Feed...</h3>
            <p className="text-xs text-[#736F6A] mt-1">Connecting to artisan workshops</p>
          </div>
        )}
      </div>
    </div>
  );
};
