/**
 * KalaSetu Discover Feed Recommendation & Preference Learning Service
 *
 * Implements an attribute-based preference learning system tailored to the authenticated buyer:
 * - SWIPE LEFT  = Interested / Like (+2.0 weight on category, tags, materials, price target)
 * - SWIPE RIGHT = Not Interested / Skip (-1.5 weight on category, tags, materials)
 * - WISHLIST    = Strong Positive Signal (+3.5 weight)
 * - OPEN STORY  = Exploration / Interest Signal (+1.5 weight)
 *
 * Designed with an extensible vector architecture ready for Qwen3-Embedding-0.6B embeddings.
 */

import { Product } from '../types';

export interface UserPreferenceProfile {
  userId: string;
  categoryWeights: Record<string, number>;
  tagWeights: Record<string, number>;
  materialWeights: Record<string, number>;
  priceTarget: {
    sum: number;
    count: number;
    mean: number;
  };
  swipedLeftIds: string[];
  swipedRightIds: string[];
  wishlistedIds: string[];
  openedStoryIds: string[];
  interactionCount: number;
  lastUpdated: number;
  /** Ready for Qwen3-Embedding-0.6B dense representation */
  embeddingVector?: number[];
}

const STORAGE_PREFIX = 'kalasetu_discover_pref_';

/**
 * Normalizes strings for consistent keyword matching across tags and materials
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
}

/**
 * Creates an empty baseline profile for a specific authenticated user
 */
export function createDefaultProfile(userId: string): UserPreferenceProfile {
  return {
    userId,
    categoryWeights: {},
    tagWeights: {},
    materialWeights: {},
    priceTarget: { sum: 0, count: 0, mean: 0 },
    swipedLeftIds: [],
    swipedRightIds: [],
    wishlistedIds: [],
    openedStoryIds: [],
    interactionCount: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Retrieves the stored preference profile for the authenticated buyer
 */
export function getUserDiscoverProfile(userId: string): UserPreferenceProfile {
  if (!userId) return createDefaultProfile('anonymous');
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          userId,
          categoryWeights: parsed.categoryWeights || {},
          tagWeights: parsed.tagWeights || {},
          materialWeights: parsed.materialWeights || {},
          priceTarget: parsed.priceTarget || { sum: 0, count: 0, mean: 0 },
          swipedLeftIds: Array.isArray(parsed.swipedLeftIds) ? parsed.swipedLeftIds : [],
          swipedRightIds: Array.isArray(parsed.swipedRightIds) ? parsed.swipedRightIds : [],
          wishlistedIds: Array.isArray(parsed.wishlistedIds) ? parsed.wishlistedIds : [],
          openedStoryIds: Array.isArray(parsed.openedStoryIds) ? parsed.openedStoryIds : [],
          interactionCount: typeof parsed.interactionCount === 'number' ? parsed.interactionCount : 0,
          lastUpdated: parsed.lastUpdated || Date.now(),
          embeddingVector: parsed.embeddingVector,
        };
      }
    }
  } catch (err) {
    console.warn('[DiscoverRec] Failed to load preferences from localStorage:', err);
  }
  return createDefaultProfile(userId);
}

/**
 * Persists the profile for the authenticated user
 */
function saveUserDiscoverProfile(profile: UserPreferenceProfile): void {
  if (!profile.userId) return;
  try {
    profile.lastUpdated = Date.now();
    localStorage.setItem(`${STORAGE_PREFIX}${profile.userId}`, JSON.stringify(profile));
  } catch (err) {
    console.warn('[DiscoverRec] Failed to save preferences to localStorage:', err);
  }
}

/**
 * Resets the authenticated buyer's Discover preferences and interaction history
 * (does NOT delete cart, wishlist or orders)
 */
export function resetUserDiscoverPreferences(userId: string): UserPreferenceProfile {
  const existing = getUserDiscoverProfile(userId);
  const clean = createDefaultProfile(userId);
  // Reset Feed must NOT delete the user's wishlist
  clean.wishlistedIds = Array.isArray(existing.wishlistedIds) ? [...existing.wishlistedIds] : [];
  try {
    saveUserDiscoverProfile(clean);
  } catch (err) {
    console.warn('[DiscoverRec] Failed to save preserved wishlist preferences:', err);
  }
  return clean;
}

export type DiscoverInteractionType = 'swipe_left' | 'swipe_right' | 'wishlist' | 'story_open';

/**
 * Records a user interaction and updates their real preference model weights
 */
export function recordInteraction(
  userId: string,
  product: Product,
  action: DiscoverInteractionType
): UserPreferenceProfile {
  const profile = getUserDiscoverProfile(userId);

  let categoryDelta = 0;
  let tagDelta = 0;
  let materialDelta = 0;
  let updatePrice = false;

  switch (action) {
    case 'swipe_left': // Like / Interested
      categoryDelta = 2.0;
      tagDelta = 1.5;
      materialDelta = 1.0;
      updatePrice = true;
      if (!profile.swipedLeftIds.includes(product.id)) {
        profile.swipedLeftIds.push(product.id);
      }
      break;

    case 'swipe_right': // Skip / Not Interested
      categoryDelta = -1.5;
      tagDelta = -1.0;
      materialDelta = -0.75;
      updatePrice = false;
      if (!profile.swipedRightIds.includes(product.id)) {
        profile.swipedRightIds.push(product.id);
      }
      break;

    case 'wishlist': // Strong positive
      categoryDelta = 3.5;
      tagDelta = 2.5;
      materialDelta = 2.0;
      updatePrice = true;
      if (!profile.wishlistedIds.includes(product.id)) {
        profile.wishlistedIds.push(product.id);
      }
      break;

    case 'story_open': // Craft story interest signal
      categoryDelta = 1.5;
      tagDelta = 1.0;
      materialDelta = 0.75;
      updatePrice = true;
      if (!profile.openedStoryIds.includes(product.id)) {
        profile.openedStoryIds.push(product.id);
      }
      break;
  }

  // 1. Update Category Weight (clamped between -15 and +15)
  if (product.category) {
    const cat = product.category;
    const current = profile.categoryWeights[cat] || 0;
    profile.categoryWeights[cat] = Math.max(-15, Math.min(15, current + categoryDelta));
  }

  // 2. Update Tag Weights
  if (Array.isArray(product.tags)) {
    product.tags.forEach((tag) => {
      const norm = normalizeKey(tag);
      if (norm) {
        const cur = profile.tagWeights[norm] || 0;
        profile.tagWeights[norm] = Math.max(-15, Math.min(15, cur + tagDelta));
      }
    });
  }

  // 3. Update Material Weights
  if (Array.isArray(product.materials)) {
    product.materials.forEach((mat) => {
      const norm = normalizeKey(mat);
      if (norm) {
        const cur = profile.materialWeights[norm] || 0;
        profile.materialWeights[norm] = Math.max(-15, Math.min(15, cur + materialDelta));
      }
    });
  }

  // 4. Update Preferred Price Target (moving average)
  if (updatePrice && typeof product.price === 'number' && product.price > 0) {
    profile.priceTarget.sum += product.price;
    profile.priceTarget.count += 1;
    profile.priceTarget.mean = Math.round(profile.priceTarget.sum / profile.priceTarget.count);
  }

  profile.interactionCount += 1;
  saveUserDiscoverProfile(profile);
  return profile;
}

/**
 * Calculates a personalized affinity score for a product given the user's learned profile
 */
export function scoreProduct(product: Product, profile: UserPreferenceProfile): number {
  let score = 0;

  // 1. Category affinity
  if (product.category && profile.categoryWeights[product.category]) {
    score += profile.categoryWeights[product.category] * 1.5;
  }

  // 2. Tags affinity
  if (Array.isArray(product.tags)) {
    for (const tag of product.tags) {
      const norm = normalizeKey(tag);
      if (norm && profile.tagWeights[norm]) {
        score += profile.tagWeights[norm] * 0.8;
      }
    }
  }

  // 3. Materials affinity
  if (Array.isArray(product.materials)) {
    for (const mat of product.materials) {
      const norm = normalizeKey(mat);
      if (norm && profile.materialWeights[norm]) {
        score += profile.materialWeights[norm] * 0.7;
      }
    }
  }

  // 4. Price affinity
  if (profile.priceTarget && profile.priceTarget.count >= 2 && profile.priceTarget.mean > 0) {
    const ratio = product.price / profile.priceTarget.mean;
    // Gaussian-like curve centered around 1.0 ratio
    const logDiff = Math.abs(Math.log(Math.max(0.1, ratio)));
    const priceScore = Math.max(-3, 3 - logDiff * 3);
    score += priceScore;
  }

  // 5. Freshness / Discoverability boost for newly published crafts
  if (product.id.startsWith('prod-') && !product.id.startsWith('prod-1') && !product.id.startsWith('prod-2')) {
    score += 1.2; // slight boost for new community crafts
  }

  // 6. Penalties for already seen / swiped items to avoid feed stagnation
  if (profile.swipedRightIds.includes(product.id)) {
    score -= 10.0; // Pushed far down
  } else if (profile.swipedLeftIds.includes(product.id)) {
    score -= 3.0; // Pushed down so user sees unswiped items first
  }

  return score;
}

/**
 * Ranks all available products for the Discover feed.
 * Unswiped products matching user preferences are placed at the front.
 */
export function rankProductsForDiscover(
  allProducts: Product[],
  userId: string
): Product[] {
  if (!allProducts || allProducts.length === 0) return [];

  const profile = getUserDiscoverProfile(userId);

  // If user hasn't made any interactions yet, return products with real/newest items first
  if (profile.interactionCount === 0) {
    return [...allProducts].sort((a, b) => {
      const aIsSeed = a.id === 'prod-1' || a.id === 'prod-2' || a.id === 'prod-3' || a.id === 'prod-4';
      const bIsSeed = b.id === 'prod-1' || b.id === 'prod-2' || b.id === 'prod-3' || b.id === 'prod-4';
      if (!aIsSeed && bIsSeed) return -1;
      if (aIsSeed && !bIsSeed) return 1;
      return (b.views || 0) - (a.views || 0);
    });
  }

  // Compute scored items with slight tie-breaker jitter
  const scored = allProducts.map((p, index) => {
    const score = scoreProduct(p, profile);
    // tiny stable pseudo-jitter based on product id to prevent jumpy ties
    const charCodeSum = p.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const jitter = (charCodeSum % 10) * 0.05;
    return {
      product: p,
      score: score + jitter,
      index,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.product);
}

// ---------------------------------------------------------------------------
// Extensibility hook for Qwen3-Embedding-0.6B embeddings
// ---------------------------------------------------------------------------
export interface Qwen3EmbeddingPayload {
  text: string;
  category: string;
  tags: string[];
}

/**
 * Vector embedding generator placeholder ready for Qwen3-Embedding-0.6B integration.
 * In a production setup, this sends the craft text to a backend embedding proxy.
 */
export async function getCraftEmbeddingVector(
  _payload: Qwen3EmbeddingPayload
): Promise<number[] | null> {
  // Architecture ready for Qwen3-Embedding-0.6B
  return null;
}
