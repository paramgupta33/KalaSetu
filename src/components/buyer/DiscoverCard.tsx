import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Heart, 
  Award, 
  CheckCircle2 
} from 'lucide-react';
import { Product } from '../../types';

export interface DiscoverCardItem {
  id: string;
  product: Product;
  productId: string;
  title: string;
  mrp: string;
  price: string;
  numericPrice: number;
  category: string;
  image: string;
  artisanName: string;
  cluster: string;
  artisanAvatar: string;
  description: string;
  material: string;
  giCertified?: boolean;
}

export interface DiscoverCardProps {
  card: DiscoverCardItem;
  depth: number;
  isTop: boolean;
  isExiting: boolean;
  exitDirection: 'left' | 'right';
  onSwipe: (direction: 'left' | 'right') => void;
  onOpenStory: (card: DiscoverCardItem) => void;
  onQuickBuy?: (card: DiscoverCardItem, e: React.MouseEvent) => void;
}

/**
 * Minimal, modern shopping Reel Card for KalaSetu.
 *
 * Instagram-style shopping Reel:
 * - Large full-bleed artisan product image
 * - Minimal overlay: Product name (truncated), Price, Artisan name
 * - Tapping card or details area opens CraftStoryModal with full story & specifications
 * - Swipe LEFT  = Like / Interested
 * - Swipe RIGHT = Skip / Not Interested
 * - Like button on card is treated exactly like a left swipe
 * - Action button: Add to Cart
 */
export const DiscoverCard = React.memo(function DiscoverCard({
  card,
  depth,
  isTop,
  isExiting,
  exitDirection,
  onSwipe,
  onOpenStory,
  onQuickBuy,
}: DiscoverCardProps) {
  const [dragX, setDragX] = useState<number>(0);
  const hasDraggedRef = useRef<boolean>(false);

  // Subtle 3D stack physics based on depth
  const rotateZ = depth * -1.5;
  const scale = 1 - depth * 0.04;
  const y = depth * -6;
  const opacity = 1 - depth * 0.15;
  const zIndex = 30 - depth;

  const handleCardClick = (e: React.MouseEvent) => {
    // If user dragged, do not open details modal
    if (hasDraggedRef.current) return;
    if (isTop && !isExiting) {
      e.stopPropagation();
      onOpenStory(card);
    }
  };

  return (
    <motion.div
      key={card.id}
      style={{ 
        zIndex, 
        willChange: 'transform, opacity',
      }}
      animate={
        isExiting
          ? {
              x: exitDirection === 'left' ? -480 : 480,
              y: -20,
              rotate: exitDirection === 'left' ? -18 : 18,
              opacity: 0,
              scale: 0.9,
            }
          : {
              x: 0,
              y,
              scale,
              rotate: rotateZ,
              opacity,
            }
      }
      transition={{
        duration: isExiting ? 0.28 : 0.35,
        ease: [0.25, 1, 0.5, 1],
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragStart={() => {
        hasDraggedRef.current = false;
        setDragX(0);
      }}
      onDrag={(_, info) => {
        setDragX(info.offset.x);
        if (Math.abs(info.offset.x) > 8) {
          hasDraggedRef.current = true;
        }
      }}
      onDragEnd={(_, info) => {
        setDragX(0);
        // Clean swipe detection
        // Swipe LEFT  = Like / Interested
        if (info.offset.x < -70 || info.velocity.x < -250) {
          onSwipe('left');
        } 
        // Swipe RIGHT = Skip / Not Interested
        else if (info.offset.x > 70 || info.velocity.x > 250) {
          onSwipe('right');
        }

        // Brief delay before resetting drag flag to prevent click event on drag release
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 100);
      }}
      onClick={handleCardClick}
      className={`card-stack-item absolute inset-0 w-full h-full rounded-2xl md:rounded-[26px] overflow-hidden bg-[#181614] shadow-xl flex flex-col select-none touch-none border border-black/10 ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
      }`}
      data-index={depth}
      data-product-id={card.productId}
    >
      {/* Full-Bleed Product Image */}
      <div className="relative w-full h-full overflow-hidden bg-[#181614]">
        <img
          alt={card.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center pointer-events-none"
          src={card.image}
          loading={depth > 1 ? 'lazy' : 'eager'}
          decoding="async"
        />

        {/* Cinematic Multi-Stop Overlays */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

        {/* Minimal Top Badges (Category & optional GI badge) */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-semibold tracking-wider text-white/90 uppercase border border-white/15 shadow-xs">
              {card.category}
            </span>

            {card.giCertified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/90 backdrop-blur-md text-[10px] font-bold text-black tracking-tight shadow-xs">
                <Award className="w-3 h-3 text-black stroke-[2.5]" />
                <span>GI Certified</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Action Rail: Like (treated like left swipe) & Add to Cart */}
        <div className="absolute right-3.5 bottom-6 z-25 flex flex-col items-center gap-2.5 pointer-events-auto">
          {/* Like Button (Treated exactly like a left swipe) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSwipe('left');
            }}
            aria-label="Like Product (Swipe Left)"
            title="Like (Swipe Left)"
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60 hover:text-rose-400 active:scale-90 flex items-center justify-center transition-all cursor-pointer shadow-md"
            id={`btn-like-${card.productId}`}
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* Add to Cart (The main shopping action button) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickBuy?.(card, e);
            }}
            aria-label="Add to Bag"
            title="Add to Shopping Bag"
            className="w-10 h-10 rounded-full bg-[#F4E39E] text-[#272105] hover:bg-[#ebd787] active:scale-90 border border-white/30 flex items-center justify-center transition-all cursor-pointer shadow-md"
            id={`btn-add-to-cart-${card.productId}`}
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Minimal Bottom Overlay: Artisan Name, Product Name, Price */}
        <div 
          onClick={handleCardClick}
          className="absolute bottom-4 inset-x-0 left-0 right-16 px-4 pb-2 z-20 pointer-events-auto cursor-pointer"
        >
          {/* Artisan Name */}
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/70 shrink-0 bg-neutral-800 shadow-xs">
              <img
                alt={card.artisanName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                src={card.artisanAvatar}
                loading="lazy"
              />
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-semibold text-white/90 drop-shadow-sm truncate">
                {card.artisanName}
              </span>
              <CheckCircle2 className="w-3 h-3 text-amber-300 shrink-0 fill-amber-300/20" />
            </div>
          </div>

          {/* Product Name (Clean & Short/Truncated) */}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-md truncate mb-0.5">
            {card.title}
          </h2>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-amber-300 drop-shadow-sm">
              {card.price}
            </span>
            {card.mrp && (
              <span className="text-xs font-medium text-white/50 line-through">
                {card.mrp}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
