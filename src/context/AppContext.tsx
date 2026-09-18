import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
  Language,
  NavigationTab,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductViewMode,
  TimeRangeFilter,
  ToastMessage,
  UserRole,
  UserProfile,
  BuyerMode,
  BuyerTab,
  B2BProfile,
  RFQ,
  MatchedArtisan,
  CartItem,
  BuyerOrder,
  BusinessEvent,
  AppNotification,
  ArtisanAnalyticsState,
} from '../types';
import { NotificationService } from '../services/notificationService';
import { I18N_STRINGS, INITIAL_PRODUCTS } from '../data/initialData';
import { I18NKey, getTranslation, SUPPORTED_LANGUAGES } from '../i18n';
import {
  calculateArtisanMatches,
} from '../data/buyerData';
import { getUserDiscoverProfile } from '../services/discoverRecommendationService';

const EMPTY_B2B_PROFILE: B2BProfile = {
  organizationName: '',
  buyerIndustry: 'corporate',
  sourcingVolume: 'volume_50_200',
  industry: 'corporate',
  targetVolume: 'volume_50_200',
  contactPerson: '',
  email: '',
  phone: '',
};

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: I18NKey) => string;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  
  // Dual-Role & Buyer Persona
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  buyerMode: BuyerMode;
  setBuyerMode: (mode: BuyerMode) => void;
  hasSelectedPersona: boolean;
  setHasSelectedPersona: (selected: boolean) => void;
  b2bProfile: B2BProfile;
  updateB2BProfile: (profile: Partial<B2BProfile>) => void;
  buyerTab: BuyerTab;
  setBuyerTab: (tab: BuyerTab) => void;

  // Onboarding & Supabase Authentication
  isOnboarded: boolean;
  completeOnboarding: (info: {
    fullName: string;
    phone: string;
    role: UserRole;
    buyerType: BuyerMode;
  }) => void;
  resetOnboarding: () => void;
  userName: string;
  userPhone: string;
  session: Session | null;
  authLoading: boolean;
  userProfile: UserProfile | null;
  getOrInitAuthSession: (options?: { name?: string; phone?: string; role?: string }) => Promise<{ userId: string; token: string } | null>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
    language: string;
  }) => Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Products & Inventory (Artisan & Buyer)
  products: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: ProductCategory;
  setSelectedCategory: (cat: ProductCategory) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  viewMode: ProductViewMode;
  setViewMode: (mode: ProductViewMode) => void;
  toggleProductAvailability: (productId: string) => void;
  refillProductStock: (productId: string, amount?: number) => void;
  updateProductImage: (productId: string, imageUrl: string) => Promise<void>;
  updateProduct: (
    productId: string,
    updates: Partial<Product> & {
      pricing?: any;
      marketplace_listings?: any[];
      status?: 'draft' | 'published';
      image_url?: string;
      images?: any[];
    }
  ) => Promise<Product | null>;
  addNewProduct: (
    product: Omit<Product, 'id'>,
    options?: {
      pricing?: any;
      marketplace_listings?: any[];
      status?: 'draft' | 'published';
      images?: Array<{
        image_url: string;
        image_type: 'original' | 'enhanced' | 'gallery' | 'thumbnail';
        is_primary?: boolean;
      }>;
    }
  ) => Promise<Product>;
  fetchProducts: (roleOverride?: UserRole) => Promise<void>;

  // Buyer Specific: Product View, Wishlist & Cart
  selectedBuyerProduct: Product | null;
  setSelectedBuyerProduct: (prod: Product | null) => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cart: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, customNotes?: string, bulkTierActive?: boolean, silent?: boolean) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Buyer Specific: RFQ & AI Matching
  rfqs: RFQ[];
  activeRFQ: RFQ | null;
  setActiveRFQ: (rfq: RFQ | null) => void;
  createRFQ: (rfqData: {
    category: ProductCategory;
    quantity: number;
    targetBudget: number;
    deliveryDate: string;
    notes?: string;
    organizationName?: string;
  }) => RFQ;

  // Buyer Specific: Collaborative Negotiation
  activeNegotiation: {
    rfq: RFQ;
    matchedArtisan: MatchedArtisan;
    currentStep: number;
    buyerOffer: number;
    artisanOffer: number;
    history: { sender: 'buyer' | 'artisan'; amount: number; message: string; timestamp: string }[];
  } | null;
  startNegotiation: (rfq: RFQ, matchedArtisan: MatchedArtisan) => void;
  closeNegotiation: () => void;
  submitNegotiationCounter: (newPrice: number, message?: string) => void;
  acceptNegotiationOffer: () => void;

  // Buyer Orders & Confirmation
  buyerOrders: BuyerOrder[];
  placeOrderFromCart: (deliveryAddress?: string) => Promise<BuyerOrder | null>;
  placeOrderFromRFQ: (rfq: RFQ, matchedArtisan: MatchedArtisan, agreedPrice: number) => BuyerOrder;
  lastConfirmedOrder: BuyerOrder | null;
  setLastConfirmedOrder: (order: BuyerOrder | null) => void;

  // Orders (Artisan)
  orders: Order[];
  fetchOrders: (roleOverride?: UserRole) => Promise<void>;
  orderSearchQuery: string;
  setOrderSearchQuery: (query: string) => void;
  orderFilter: string;
  setOrderFilter: (filter: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus | string) => Promise<void> | void;
  advanceOrderStep: (orderId: string) => Promise<void> | void;
  lockOrderPrice: (orderId: string, price: number) => Promise<void> | void;
  negotiateOrderPrice: (orderId: string, counterPrice: number, message: string) => void;
  
  // Analytics target product & Real Artisan Analytics
  selectedAnalyticsProduct: Product | null;
  setSelectedAnalyticsProduct: (prod: Product | null) => void;
  salesPeriod: TimeRangeFilter;
  setSalesPeriod: (period: TimeRangeFilter) => void;
  artisanAnalytics: ArtisanAnalyticsState | null;
  fetchArtisanAnalytics: (periodOverride?: TimeRangeFilter, productId?: string) => Promise<void>;
  trackAnalyticsEvent: (
    eventType: 'PRODUCT_VIEW' | 'PRODUCT_CLICK' | 'PRODUCT_SAVE' | 'PRODUCT_UNSAVE' | 'ADD_TO_CART',
    productId: string,
    metadata?: any
  ) => Promise<void>;

  // Modals & Sheets
  activeModal: string | null;
  modalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;

  // Toasts & Notifications
  toasts: ToastMessage[];
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error', eventId?: string) => void;
  dismissToast: (id?: string) => void;
  dispatchBusinessEvent: (event: BusinessEvent) => void;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // View frame toggle
  deviceMode: 'responsive' | 'mobile_frame';
  setDeviceMode: (mode: 'responsive' | 'mobile_frame') => void;
}

function mapDbProductToUiProduct(dbProd: any): Product {
  const titleStr = typeof dbProd.title === 'string'
    ? dbProd.title
    : (dbProd.title?.en || 'Handcrafted Craft');

  const rawCat = (dbProd.category || 'pottery').toLowerCase();
  const validCategories: ProductCategory[] = ['pottery', 'textiles', 'brass', 'wood', 'jute', 'painting', 'metal', 'jewelry'];
  const category: ProductCategory = validCategories.includes(rawCat as ProductCategory) ? (rawCat as ProductCategory) : 'pottery';

  const catLabelMap: Record<string, string> = {
    pottery: 'Handmade Pottery & Ceramics',
    textiles: 'Handloom Textiles & Sarees',
    brass: 'Traditional Brass & Bronze',
    metal: 'Handcrafted Metal Craft',
    wood: 'Handcarved Woodwork',
    jute: 'Natural Fiber & Jute Craft',
    painting: 'Heritage Indian Paintings',
    jewelry: 'Handcrafted Tribal Jewelry',
    gifts: 'Artisan Decor & Collectibles',
  };
  const categoryLabelStr = catLabelMap[rawCat] || catLabelMap[category] || 'Handcrafted Artisan Craft';

  const primaryImage =
    (Array.isArray(dbProd.images) && dbProd.images.length > 0 && dbProd.images[0]?.image_url) ||
    dbProd.image_url ||
    'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800';

  const price = typeof dbProd.price === 'number' ? dbProd.price : 0;
  const rawMrp = dbProd.pricing?.market_estimate || dbProd.pricing?.mrp;
  const mrp = typeof rawMrp === 'number' && rawMrp > price ? rawMrp : Math.round(price * 1.25);
  const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const stockCount = typeof dbProd.stock === 'number' ? dbProd.stock : 1;

  const rawId = String(dbProd.product_id || dbProd.id || `prod-${Date.now()}`);
  const cleanSkuId = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '001';
  const skuPrefix = category.slice(0, 3).toUpperCase();
  const sku = dbProd.sku || `KALA-${skuPrefix}-${cleanSkuId}`;

  const artisanName = dbProd.artisan?.name || 'Radhika Devi';
  const artisanState = dbProd.artisan?.state || 'Rajasthan';

  return {
    id: rawId,
    sku,
    title: {
      en: titleStr,
      hi: typeof dbProd.title === 'object' && dbProd.title?.hi ? dbProd.title.hi : titleStr,
      mr: typeof dbProd.title === 'object' && dbProd.title?.mr ? dbProd.title.mr : titleStr,
      ...(typeof dbProd.title === 'object' ? dbProd.title : {}),
    },
    category,
    categoryLabel: {
      en: categoryLabelStr,
      hi: categoryLabelStr,
      mr: categoryLabelStr,
      ...(typeof dbProd.categoryLabel === 'object' ? dbProd.categoryLabel : {}),
    },
    price,
    mrp,
    discountPercent,
    inStock: stockCount > 0 && dbProd.status !== 'archived',
    stockCount,
    stock: stockCount,
    views: typeof dbProd.views === 'number' ? dbProd.views : 0,
    sold: typeof dbProd.sold === 'number' ? dbProd.sold : 0,
    isLowStock: stockCount <= 3 && stockCount > 0,
    imageUrl: primaryImage,
    altText: titleStr,
    tags: Array.isArray(dbProd.tags) && dbProd.tags.length > 0 ? dbProd.tags : ['handcrafted', 'artisan', 'heritage'],
    giCertified: true,
    isGiCertified: true,
    artisan: {
      id: dbProd.artisan?.user_id || dbProd.artisan?.id || dbProd.artisan_id || 'artisan-user',
      name: artisanName,
      location: 'India',
      state: artisanState,
      cluster: 'Heritage Jaipur Craft Cluster',
      experienceYears: 15,
      speciality: categoryLabelStr,
      giTag: 'GI-IN-2024-HERITAGE',
      verifiedBadge: true,
      avatarUrl: dbProd.artisan?.profile_image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
      heritageStory: {
        en: 'Dedicated to preserving centuries-old Indian artisan heritage and fair-wage craftsmanship.',
        hi: 'शताब्दियों पुरानी भारतीय हस्तशिल्प परंपरा को संरक्षित करने के लिए समर्पित।',
        mr: 'शतकानुशतके जुन्या भारतीय हस्तकला परंपरेचे जतन करण्यासाठी समर्पित.',
      },
      capacityPerMonth: 45,
      rating: 4.9,
      reviewsCount: 32,
      responseRate: '100%',
    },
    craftStory: {
      en: dbProd.description || 'Authentic handcrafted traditional artwork with GI heritage craftsmanship.',
      hi: dbProd.description || 'पारंपरिक भारतीय हस्तकला द्वारा निर्मित प्रामाणिक कृति।',
      mr: dbProd.description || 'पारंपारिक भारतीय हस्तकलेने तयार केलेली अस्सल कलाकृती.',
      historicalOrigin: categoryLabelStr,
      techniques: Array.isArray(dbProd.specifications) && dbProd.specifications.length > 0
        ? dbProd.specifications
        : ['Handcrafted', 'Authentic Masterwork'],
      fairWageShare: 88,
    },
    bulkTier: {
      minQty: 5,
      minUnits: 5,
      pricePerUnit: Math.round(price * 0.82),
      leadTimeDays: 7,
      maxCapacityPerMonth: 50,
    },
    materials: Array.isArray(dbProd.materials) && dbProd.materials.length > 0 ? dbProd.materials : ['Traditional Materials'],
    dimensions: dbProd.dimensions || '10" x 4"',
  };
}

function formatOrderTimeAgo(dateStr?: string): { en: string; hi: string; mr: string } {
  if (!dateStr) {
    return { en: 'Just now', hi: 'अभी', mr: 'आत्ताच' };
  }
  const date = new Date(dateStr);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return { en: 'Just now', hi: 'अभी', mr: 'आत्ताच' };
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return { en: `${diffMin}m ago`, hi: `${diffMin} मिनट पहले`, mr: `${diffMin} मिनिटांपूर्वी` };
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return { en: `${diffHour}h ago`, hi: `${diffHour} घंटे पहले`, mr: `${diffHour} तासांपूर्वी` };
  const diffDay = Math.floor(diffHour / 24);
  return { en: `${diffDay}d ago`, hi: `${diffDay} दिन पहले`, mr: `${diffDay} दिवसांपूर्वी` };
}

function mapDbOrderToArtisanOrder(dbOrder: any): Order {
  const item = Array.isArray(dbOrder.order_items) && dbOrder.order_items.length > 0
    ? dbOrder.order_items[0]
    : null;
  const prod = item?.products;
  const buyer = dbOrder.buyer;
  const quantity = item?.quantity || 1;
  const totalAmount = Number(dbOrder.total_amount) || (Number(item?.price || 0) * quantity);

  let uiStatus: OrderStatus = 'pending_craft';
  switch (dbOrder.status) {
    case 'pending':
      uiStatus = 'pending_craft';
      break;
    case 'confirmed':
      uiStatus = 'ready_for_dispatch';
      break;
    case 'processing':
      uiStatus = 'in_progress';
      break;
    case 'shipped':
      uiStatus = 'shipped';
      break;
    case 'delivered':
      uiStatus = 'delivered';
      break;
    default:
      uiStatus = 'pending_craft';
  }

  const timeAgo = formatOrderTimeAgo(dbOrder.created_at);
  const img = prod?.product_images?.[0]?.image_url || prod?.image_url || 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=600';
  const title = prod?.title || 'Authentic Handcrafted Piece';

  const rawItems = Array.isArray(dbOrder.order_items)
    ? dbOrder.order_items.map((it: any) => ({
        product_id: it.product_id,
        quantity: it.quantity || 1,
        unitPrice: Number(it.price) || 0,
        price: Number(it.price) || 0,
        product: it.products ? mapDbProductToUiProduct(it.products) : undefined,
      }))
    : [];

  return {
    id: dbOrder.order_id,
    customerName: buyer?.name || 'Valued Heritage Patron',
    location: dbOrder.shipping_address || 'India',
    totalAmount,
    paymentMethod: 'UPI / Escrow Guaranteed',
    orderTimeAgo: timeAgo,
    status: uiStatus,
    productId: item?.product_id || prod?.product_id || 'prod-custom',
    productTitle: title,
    productSku: prod?.product_id ? `KS-${prod.product_id.slice(0, 6).toUpperCase()}` : 'KS-ORD',
    productSpec: `Qty: ${quantity} • Standard Packaging`,
    productImage: img,
    quantity,
    items: rawItems,
    createdAt: dbOrder.created_at || new Date().toISOString(),
    created_at: dbOrder.created_at || new Date().toISOString(),
    customRequest: {
      tag: 'Verified Purchase',
      note: `Direct Order • Shipping to ${dbOrder.shipping_address || 'India'}`,
      currentStep: uiStatus === 'shipped' || uiStatus === 'delivered' ? 4 : uiStatus === 'in_progress' ? 3 : uiStatus === 'ready_for_dispatch' ? 2 : 1,
      proofApproved: true,
      craftingProgress: uiStatus === 'delivered' ? 100 : uiStatus === 'shipped' ? 90 : uiStatus === 'in_progress' ? 50 : 20,
    },
  };
}

function mapDbOrderToBuyerOrder(dbOrder: any): BuyerOrder {
  const items = Array.isArray(dbOrder.order_items) && dbOrder.order_items.length > 0
    ? dbOrder.order_items.map((it: any) => {
        const p = it.products;
        return {
          product: p ? mapDbProductToUiProduct(p) : INITIAL_PRODUCTS[0],
          quantity: it.quantity || 1,
          unitPrice: Number(it.price) || Number(p?.price) || 1000,
          customNote: 'Handcrafted authentic order',
        };
      })
    : [
        {
          product: INITIAL_PRODUCTS[0],
          quantity: 1,
          unitPrice: Number(dbOrder.total_amount) || 1000,
        },
      ];

  let statusStr: BuyerOrder['status'] = 'order_received';
  let currentStep = 1;
  switch (dbOrder.status) {
    case 'pending':
      statusStr = 'order_received';
      currentStep = 1;
      break;
    case 'confirmed':
      statusStr = 'in_crafting';
      currentStep = 2;
      break;
    case 'processing':
      statusStr = 'quality_check';
      currentStep = 3;
      break;
    case 'shipped':
      statusStr = 'dispatched';
      currentStep = 4;
      break;
    case 'delivered':
      statusStr = 'delivered';
      currentStep = 5;
      break;
  }

  const artisanName = dbOrder.artisan?.name || 'Molela Terracotta Guild';

  return {
    id: dbOrder.order_id,
    type: 'b2c',
    items,
    totalAmount: Number(dbOrder.total_amount) || 0,
    status: statusStr,
    currentStep,
    createdAt: dbOrder.created_at ? new Date(dbOrder.created_at).toLocaleDateString() : 'Just now',
    artisanName,
    artisanCluster: 'Jaipur Heritage GI Craft Cluster',
    deliveryEstimate: 'Est. Delivery in 5-7 business days',
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // Role & Buyer Persona
  const [userRole, setUserRole] = useState<UserRole>(() => {
    try {
      return (localStorage.getItem('kalasetu_user_role') as UserRole) || 'artisan';
    } catch {
      return 'artisan';
    }
  });
  const [buyerMode, setBuyerMode] = useState<BuyerMode>(() => {
    try {
      return (localStorage.getItem('kalasetu_buyer_mode') as BuyerMode) || 'personal';
    } catch {
      return 'personal';
    }
  });
  const [hasSelectedPersona, setHasSelectedPersona] = useState<boolean>(true);
  const [b2bProfile, setB2BProfile] = useState<B2BProfile>(EMPTY_B2B_PROFILE);
  const [buyerTab, setBuyerTab] = useState<BuyerTab>('market');

  // Onboarding State: session is the canonical identity source; false until authenticated
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('kalasetu_user_name') || '';
    } catch {
      return '';
    }
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('kalasetu_user_phone') || '';
    } catch {
      return '';
    }
  });

  // Monotonic sequence and timer ref for strict single-toast queue
  const toastSeqRef = useRef<number>(0);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useCallback((key: I18NKey): string => {
    return getTranslation(language, key);
  }, [language]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', eventId?: string) => {
    if (!message || message.trim().length === 0) return;

    // Suppress rapid duplicates within 3s
    if (NotificationService.shouldSuppressToast(message, 3000)) {
      return;
    }

    toastSeqRef.current = (toastSeqRef.current + 1) % 1000000;
    const id = `toast-${Date.now()}-${toastSeqRef.current}`;

    // STRICT LIMIT: Exactly 1 visible toast at a time
    setToasts([{ id, message, type, eventId }]);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToasts([]);
    }, 3200);
  }, []);

  const dismissToast = useCallback((id?: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToasts([]);
  }, []);

  // Supabase Auth & Session Management
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Identity tracking refs to prevent concurrent or duplicate profile fetches
  const currentAppliedUserIdRef = useRef<string | null>(null);
  const userProfileRef = useRef<UserProfile | null>(null);
  const inFlightProfileLoads = useRef<Map<string, Promise<UserProfile>>>(new Map());

  // Clear private user state (cart, wishlist, orders, RFQs, notifications)
  // Ensures switching accounts never bleeds private state
  const clearPrivateUserState = useCallback(() => {
    setOrders([]);
    setBuyerOrders([]);
    setArtisanProducts([]);
    setArtisanAnalytics(null);
    setCart([]);
    setWishlist([]);
    setRfqs([]);
    setActiveRFQ(null);
    setNotifications([]);
    setB2BProfile(EMPTY_B2B_PROFILE);
    setUserName('');
    setUserPhone('');
  }, []);

  const loadUserProfile = useCallback(async (user: User, token: string): Promise<UserProfile> => {
    // 1. Try fetching profile directly from Supabase public.users
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('user_id, name, email, phone, role, language, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbUser && dbUser.user_id) {
        return dbUser as UserProfile;
      }
    } catch (err) {
      console.warn('[Auth] Direct Supabase profile query notice:', err);
    }

    // 2. Try fetching profile via backend /api/auth/profile
    try {
      const res = await fetch('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          return json.user as UserProfile;
        }
      }
    } catch (err) {
      console.warn('[Auth] API profile endpoint notice:', err);
    }

    // 3. Ensure matching public.users row exists for this real auth user
    try {
      const meta = user.user_metadata || {};
      const fallbackRole: UserRole = meta.role === 'buyer' ? 'buyer' : 'artisan';
      const derivedName =
        meta.name ||
        meta.full_name ||
        user.email?.split('@')[0] ||
        (fallbackRole === 'artisan' ? 'Artisan' : 'Buyer');
      const derivedPhone = meta.phone || '';
      const derivedLang = meta.language || (fallbackRole === 'artisan' ? 'hi' : 'en');

      const { data: createdUser } = await supabase
        .from('users')
        .upsert({
          user_id: user.id,
          name: derivedName,
          email: user.email,
          phone: derivedPhone,
          role: fallbackRole,
          language: derivedLang,
        })
        .select('user_id, name, email, phone, role, language, created_at')
        .maybeSingle();

      if (createdUser && createdUser.user_id) {
        return createdUser as UserProfile;
      }
    } catch (upsertErr) {
      console.warn('[Auth] Direct upsert to public.users notice:', upsertErr);
    }

    // 4. Memory fallback if database write is temporarily inaccessible
    const meta = user.user_metadata || {};
    const fallbackRole: UserRole = meta.role === 'buyer' ? 'buyer' : 'artisan';
    return {
      user_id: user.id,
      name: meta.name || meta.full_name || user.email?.split('@')[0] || (fallbackRole === 'artisan' ? 'Artisan' : 'Buyer'),
      email: user.email || '',
      phone: meta.phone || '',
      role: fallbackRole,
      language: meta.language || (fallbackRole === 'artisan' ? 'hi' : 'en'),
      created_at: user.created_at,
    };
  }, []);

  const applyUserProfile = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setUserRole(profile.role);
    setUserName(profile.name);
    if (profile.phone) setUserPhone(profile.phone);
    if (profile.language) {
      setLanguage(profile.language as Language);
    }
    setIsOnboarded(true);
    try {
      localStorage.setItem('kalasetu_onboarded', 'true');
      localStorage.setItem('kalasetu_user_role', profile.role);
      localStorage.setItem('kalasetu_user_name', profile.name);
      if (profile.phone) localStorage.setItem('kalasetu_user_phone', profile.phone);
    } catch {}
  }, []);

  // Single authoritative pipeline for loading and applying an authenticated session
  const loadAndApplyUser = useCallback(
    async (user: User, token: string, newSession: Session): Promise<UserProfile> => {
      // Re-use already loaded profile if session belongs to currently active user
      if (currentAppliedUserIdRef.current === user.id && userProfileRef.current) {
        setSession(newSession);
        return userProfileRef.current;
      }

      // Deduplicate in-flight profile fetch for this user ID
      const existingInFlight = inFlightProfileLoads.current.get(user.id);
      if (existingInFlight) {
        const profile = await existingInFlight;
        setSession(newSession);
        return profile;
      }

      const loadPromise = (async () => {
        try {
          const profile = await loadUserProfile(user, token);
          console.log('[Auth] profile loaded:', { userId: profile.user_id, role: profile.role, name: profile.name });

          // Clear previous user's private state when switching accounts
          if (currentAppliedUserIdRef.current && currentAppliedUserIdRef.current !== profile.user_id) {
            console.log('[Auth] Switching user session - clearing old private state');
            clearPrivateUserState();
          }

          currentAppliedUserIdRef.current = profile.user_id;
          userProfileRef.current = profile;

          setSession(newSession);
          applyUserProfile(profile);
          return profile;
        } finally {
          inFlightProfileLoads.current.delete(user.id);
        }
      })();

      inFlightProfileLoads.current.set(user.id, loadPromise);
      return await loadPromise;
    },
    [loadUserProfile, applyUserProfile, clearPrivateUserState]
  );

  // Supabase Auth lifecycle: getSession on load & onAuthStateChange
  useEffect(() => {
    let isMounted = true;
    setAuthLoading(true);

    // Initial check: getSession()
    supabase.auth.getSession().then(async ({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('[Auth] Initial getSession error:', error.message);
      }
      if (initialSession?.user && initialSession.access_token) {
        try {
          await loadAndApplyUser(initialSession.user, initialSession.access_token, initialSession);
        } catch (profileErr) {
          console.warn('[Auth] Error loading profile for initial session:', profileErr);
        }
      } else {
        setSession(null);
        setUserProfile(null);
        setIsOnboarded(false);
        currentAppliedUserIdRef.current = null;
        userProfileRef.current = null;
        clearPrivateUserState();
      }
      if (isMounted) setAuthLoading(false);
    });

    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      if (currentSession?.user && currentSession.access_token) {
        try {
          await loadAndApplyUser(currentSession.user, currentSession.access_token, currentSession);
        } catch (profileErr) {
          console.warn('[Auth] Error on auth state change load:', profileErr);
        }
      } else if (!currentSession) {
        setSession(null);
        setUserProfile(null);
        setIsOnboarded(false);
        currentAppliedUserIdRef.current = null;
        userProfileRef.current = null;
        clearPrivateUserState();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadAndApplyUser, clearPrivateUserState]);

  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }> => {
      console.log('[Auth] signIn started');
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        console.log('[Auth] signIn Supabase result:', {
          hasSession: Boolean(data?.session),
          hasUser: Boolean(data?.user),
          error: error?.message || null,
        });

        if (error) {
          console.error('[Auth] signInWithPassword failed:', {
            message: error.message,
            status: error.status,
            code: (error as any).code,
          });

          const isEmailNotConfirmed =
            error.message?.toLowerCase().includes('email not confirmed') ||
            (error as any).code === 'email_not_confirmed';

          return {
            success: false,
            error: isEmailNotConfirmed
              ? 'Please verify your email before signing in.'
              : error.message || 'Invalid email or password.',
            isEmailNotConfirmed,
          };
        }

        if (data?.session && data?.user) {
          console.log('[Auth] authenticated user ID:', data.user.id);
          console.log('[Auth] session established');

          const profile = await loadAndApplyUser(data.user, data.session.access_token, data.session);
          console.log('[Auth] profile loaded:', { userId: profile.user_id, role: profile.role });
          console.log('[Auth] signIn completed');
          showToast(`Welcome back, ${profile.name}!`, 'success');
          return { success: true };
        }

        console.warn('[Auth] signIn completed without session');
        return { success: false, error: 'Could not establish session. Please try again.' };
      } catch (err: any) {
        console.error('[Auth] signIn exception:', err);
        return { success: false, error: err?.message || 'Login failed. Please try again.' };
      }
    },
    [loadAndApplyUser, showToast]
  );

  const resendVerificationEmail = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim().toLowerCase(),
        });
        if (error) {
          console.error('[Auth] resend verification email failed:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Failed to resend verification email.' };
      }
    },
    []
  );

  const signUp = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role: UserRole;
      language: string;
    }): Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }> => {
      try {
        const { name, email, password, phone, role, language: lang } = params;

        // 1. Direct Supabase signUp with user metadata
        const signUpRes = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              name: name.trim(),
              phone: phone?.trim() || '',
              role,
              language: lang,
            },
          },
        });

        // 2. Rate-limit fallback: If test environment rate limits client-side signup, use server-side admin creation
        if (signUpRes.error && (signUpRes.error.status === 429 || signUpRes.error.message.includes('rate limit'))) {
          const apiRes = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              phone: phone?.trim() || '',
              role,
              language: lang,
            }),
          });
          const apiJson = await apiRes.json();
          if (!apiJson.success) {
            return { success: false, error: apiJson.error || 'Signup failed' };
          }

          // Sign in to establish client session
          const loginRes = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (loginRes.data?.session && loginRes.data?.user) {
            const profile = await loadAndApplyUser(loginRes.data.user, loginRes.data.session.access_token, loginRes.data.session);
            showToast(`Account created! Welcome, ${profile.name}`, 'success');
            return { success: true };
          }
        } else if (signUpRes.error) {
          return { success: false, error: signUpRes.error.message };
        }

        // If session was returned directly on signup (when auto-confirm is enabled)
        if (signUpRes.data?.session && signUpRes.data?.user) {
          const profile = await loadAndApplyUser(signUpRes.data.user, signUpRes.data.session.access_token, signUpRes.data.session);
          showToast(`Account created! Welcome, ${profile.name}`, 'success');
          return { success: true };
        }

        // Try explicit sign in if session wasn't auto-established
        const loginRes = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (loginRes.data?.session && loginRes.data?.user) {
          const profile = await loadAndApplyUser(loginRes.data.user, loginRes.data.session.access_token, loginRes.data.session);
          showToast(`Account created! Welcome, ${profile.name}`, 'success');
          return { success: true };
        }

        if (loginRes.error?.message?.toLowerCase().includes('email not confirmed')) {
          showToast('Signup successful! Please check your email to verify your account.', 'info');
          return { success: true, isEmailNotConfirmed: true };
        }

        showToast('Signup successful! Please log in.', 'success');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Signup failed' };
      }
    },
    [loadAndApplyUser, showToast]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Sign out notice:', err);
    }
    setSession(null);
    setUserProfile(null);
    setIsOnboarded(false);
    currentAppliedUserIdRef.current = null;
    userProfileRef.current = null;
    clearPrivateUserState();
    try {
      localStorage.removeItem('kalasetu_onboarded');
      localStorage.removeItem('kalasetu_user_role');
      localStorage.removeItem('kalasetu_buyer_mode');
      localStorage.removeItem('kalasetu_user_name');
      localStorage.removeItem('kalasetu_user_phone');
      localStorage.removeItem('kalasetu_auth_token');
      localStorage.removeItem('kalasetu_user_id');
    } catch {}
    showToast('Logged out successfully', 'info');
  }, [clearPrivateUserState, showToast]);

  const getOrInitAuthSession = useCallback(async () => {
    if (session?.user?.id && session?.access_token) {
      return { userId: session.user.id, token: session.access_token };
    }
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user && data?.session?.access_token) {
      return { userId: data.session.user.id, token: data.session.access_token };
    }
    return null;
  }, [session]);

  // Products separation:
  // publicProducts: Main marketplace catalog (INITIAL_PRODUCTS + newly created community products)
  // artisanProducts: The authenticated artisan's catalog (strictly user-owned)
  const [publicProducts, setPublicProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [artisanProducts, setArtisanProducts] = useState<Product[]>([]);
  const products = useMemo(() => {
    return userRole === 'artisan' ? artisanProducts : publicProducts;
  }, [userRole, artisanProducts, publicProducts]);

  const setProducts = useCallback((updater: Product[] | ((prev: Product[]) => Product[])) => {
    setArtisanProducts((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    setPublicProducts((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<ProductViewMode>('1col');

  // In-flight request de-duplication and egress throttle refs
  const inFlightProductRequests = useRef<Map<string, Promise<any>>>(new Map());
  const lastProductsFetchedAt = useRef<Record<string, number>>({});
  const inFlightOrderRequests = useRef<Map<string, Promise<any>>>(new Map());
  const inFlightCartRequest = useRef<Promise<any> | null>(null);

  // Backend Products Synchronization (Supabase REST API)
  const fetchProducts = useCallback(
    async (roleOverride?: UserRole, forceRefresh: boolean = false) => {
      const activeRole = roleOverride || userRole;
      const activeUserId = session?.user?.id;
      const cacheKey = activeRole === 'artisan' ? `artisan_${activeUserId || 'anon'}` : 'buyer_public';

      // 15-second client-side TTL to eliminate render-loop and rapid-fire Supabase queries
      const now = Date.now();
      const lastFetched = lastProductsFetchedAt.current[cacheKey] || 0;
      if (!forceRefresh && now - lastFetched < 15000) {
        return;
      }

      // De-duplicate concurrent in-flight requests for the same cache key
      if (inFlightProductRequests.current.has(cacheKey)) {
        return inFlightProductRequests.current.get(cacheKey);
      }

      const fetchPromise = (async () => {
        try {
          // Artisan catalogue: fetch ONLY products owned by this artisan
          if (activeRole === 'artisan') {
            if (!activeUserId) {
              setArtisanProducts([]);
              return;
            }
            const headers: Record<string, string> = {};
            if (session?.access_token) {
              headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch(`/api/products?artisan_id=${encodeURIComponent(activeUserId)}`, { headers });
            if (res.ok) {
              const json = await res.json();
              if (json.success && Array.isArray(json.data)) {
                const fetchedUiProducts = json.data.map(mapDbProductToUiProduct);
                setArtisanProducts(fetchedUiProducts);
                lastProductsFetchedAt.current[cacheKey] = Date.now();
                return;
              }
            }
            setArtisanProducts([]);
            return;
          }

          // Buyer / Public marketplace feed:
          // Always maintains rich discovery feed (INITIAL_PRODUCTS + community creations)
          const res = await fetch('/api/products');
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              const fetchedUiProducts = json.data.map(mapDbProductToUiProduct);
              const fetchedIds = new Set(fetchedUiProducts.map((p) => p.id));
              const remainingFallback = INITIAL_PRODUCTS.filter((p) => !fetchedIds.has(p.id));
              setPublicProducts([...fetchedUiProducts, ...remainingFallback]);
              lastProductsFetchedAt.current[cacheKey] = Date.now();
              return;
            }
          }
        } catch (err) {
          console.warn('[Products] Failed to fetch products from backend:', err);
        } finally {
          inFlightProductRequests.current.delete(cacheKey);
        }
      })();

      inFlightProductRequests.current.set(cacheKey, fetchPromise);
      return fetchPromise;
    },
    [userRole, session?.user?.id, session?.access_token]
  );

  // Backend Orders Synchronization (Supabase REST API: orders, order_items)
  const fetchOrders = useCallback(
    async (roleOverride?: UserRole, forceRefresh: boolean = false) => {
      const activeRole = roleOverride || userRole;
      const cacheKey = `${activeRole}_${session?.user?.id || 'anon'}`;

      if (!session?.access_token) {
        setOrders([]);
        setBuyerOrders([]);
        return;
      }

      if (inFlightOrderRequests.current.has(cacheKey)) {
        return inFlightOrderRequests.current.get(cacheKey);
      }

      const fetchPromise = (async () => {
        try {
          const res = await fetch(`/api/orders?view=${activeRole}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              if (activeRole === 'artisan') {
                const mappedOrders = json.data.map(mapDbOrderToArtisanOrder);
                setOrders(mappedOrders);
              } else {
                const mappedBuyerOrders = json.data.map(mapDbOrderToBuyerOrder);
                setBuyerOrders(mappedBuyerOrders);
              }
              return;
            }
          }
        } catch (err) {
          console.warn('[Orders] Error fetching orders from backend:', err);
        } finally {
          inFlightOrderRequests.current.delete(cacheKey);
        }
      })();

      inFlightOrderRequests.current.set(cacheKey, fetchPromise);
      return fetchPromise;
    },
    [userRole, session?.user?.id, session?.access_token]
  );

  // Artisan Orders (clean state for authenticated user)
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  // Buyer State (clean state for authenticated user, isolated per user)
  const [selectedBuyerProduct, setSelectedBuyerProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const activeUserId = session?.user?.id;
      const key = activeUserId ? `kalasetu_wishlist_${activeUserId}` : 'kalasetu_wishlist_guest';
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [activeRFQ, setActiveRFQ] = useState<RFQ | null>(null);
  const [buyerOrders, setBuyerOrders] = useState<BuyerOrder[]>([]);
  const [lastConfirmedOrder, setLastConfirmedOrder] = useState<BuyerOrder | null>(null);

  // Load user-isolated wishlist whenever session?.user?.id changes (ensures user isolation & survives refresh)
  useEffect(() => {
    const activeUserId = session?.user?.id;
    const storageKey = activeUserId ? `kalasetu_wishlist_${activeUserId}` : 'kalasetu_wishlist_guest';
    try {
      const stored = localStorage.getItem(storageKey);
      let userLikes: string[] = [];
      if (stored) {
        userLikes = JSON.parse(stored);
      } else if (activeUserId) {
        const prof = getUserDiscoverProfile(activeUserId);
        if (Array.isArray(prof.wishlistedIds) && prof.wishlistedIds.length > 0) {
          userLikes = prof.wishlistedIds;
        }
      }
      if (Array.isArray(userLikes)) {
        setWishlist(userLikes);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.warn('[Wishlist] Error loading wishlist from storage:', err);
      setWishlist([]);
    }
  }, [session?.user?.id]);

  // Backend Cart Synchronization (Supabase REST API: cart_items)
  const fetchCart = useCallback(async () => {
    try {
      if (!session?.access_token) {
        setCart([]);
        return;
      }

      const res = await fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mappedCart: CartItem[] = json.data
            .map((dbItem: any) => {
              let uiProduct = dbItem.product ? mapDbProductToUiProduct(dbItem.product) : null;
              if (!uiProduct) {
                const seedProduct = INITIAL_PRODUCTS.find((p) => p.id === dbItem.product_id);
                if (seedProduct) {
                  uiProduct = { ...seedProduct };
                }
              }
              if (!uiProduct) return null;

              if (typeof dbItem.available_stock === 'number') {
                uiProduct.stockCount = dbItem.available_stock;
                uiProduct.stock = dbItem.available_stock;
                uiProduct.inStock = dbItem.available_stock > 0;
              }

              const currentPrice = typeof uiProduct.price === 'number' ? uiProduct.price : Number(dbItem.product?.price) || 0;
              return {
                product: uiProduct,
                quantity: dbItem.quantity,
                unitPrice: currentPrice,
                customNotes: '',
                bulkTierActive: false,
              };
            })
            .filter(Boolean) as CartItem[];

          setCart(mappedCart);
        }
      }
    } catch (err) {
      console.warn('[Cart] Error fetching cart from backend:', err);
    }
  }, [session?.access_token]);

  // Fetch products, orders, and cart when AppProvider mounts and whenever session or userRole changes
  useEffect(() => {
    if (session?.user?.id) {
      if (userRole === 'artisan') {
        fetchProducts('artisan');
        fetchOrders('artisan');
      } else {
        fetchProducts('buyer');
        fetchOrders('buyer');
        fetchCart();
      }
    } else {
      setOrders([]);
      setBuyerOrders([]);
      setArtisanProducts([]);
      setCart([]);
      fetchProducts('buyer');
    }
  }, [session?.user?.id, userRole, fetchProducts, fetchOrders, fetchCart]);

  // Negotiation State
  const [activeNegotiation, setActiveNegotiation] = useState<{
    rfq: RFQ;
    matchedArtisan: MatchedArtisan;
    currentStep: number;
    buyerOffer: number;
    artisanOffer: number;
    history: { sender: 'buyer' | 'artisan'; amount: number; message: string; timestamp: string }[];
  } | null>(null);

  // Analytics
  const [selectedAnalyticsProduct, setSelectedAnalyticsProduct] = useState<Product | null>(null);
  const [salesPeriod, setSalesPeriod] = useState<TimeRangeFilter>('30d');
  const [artisanAnalytics, setArtisanAnalytics] = useState<ArtisanAnalyticsState | null>(null);

  const fetchArtisanAnalytics = useCallback(
    async (periodOverride?: TimeRangeFilter, productId?: string) => {
      try {
        const artisanUserId = session?.user?.id;
        if (!session?.access_token && !artisanUserId) {
          setArtisanAnalytics(null);
          return;
        }

        const period = periodOverride || salesPeriod || '30d';
        let url = `/api/analytics?period=${encodeURIComponent(period)}`;
        if (productId) {
          url += `&product_id=${encodeURIComponent(productId)}`;
        }

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        if (artisanUserId) {
          headers['x-user-id'] = artisanUserId;
          headers['x-artisan-id'] = artisanUserId;
        }

        const res = await fetch(url, { headers });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setArtisanAnalytics(json.data);
          }
        }
      } catch (err) {
        console.warn('[Analytics] Error fetching artisan analytics from backend:', err);
      }
    },
    [session?.access_token, session?.user?.id, salesPeriod]
  );

  const trackAnalyticsEvent = useCallback(
    async (
      eventType: 'PRODUCT_VIEW' | 'PRODUCT_CLICK' | 'PRODUCT_SAVE' | 'PRODUCT_UNSAVE' | 'ADD_TO_CART',
      productId: string,
      metadata?: any
    ) => {
      if (!productId || !eventType) return;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        await fetch('/api/analytics', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            product_id: productId,
            event_type: eventType,
            metadata,
          }),
        });
      } catch (err) {
        console.warn('[Analytics] Track event failed:', err);
      }
    },
    [session?.access_token]
  );

  // Sync selectedAnalyticsProduct with available artisan products
  useEffect(() => {
    if (artisanProducts.length > 0) {
      if (!selectedAnalyticsProduct || !artisanProducts.some((p) => p.id === selectedAnalyticsProduct.id)) {
        setSelectedAnalyticsProduct(artisanProducts[0]);
      }
    } else {
      setSelectedAnalyticsProduct(null);
    }
  }, [artisanProducts, selectedAnalyticsProduct]);

  // Automatically load artisan analytics when session is established or period changes
  useEffect(() => {
    if (session?.user?.id && userRole === 'artisan') {
      fetchArtisanAnalytics(salesPeriod);
    }
  }, [session?.user?.id, userRole, salesPeriod, fetchArtisanAnalytics]);

  // Modals & Toasts
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile_frame'>('responsive');

  const dispatchBusinessEvent = useCallback((event: BusinessEvent) => {
    // 1. Idempotency guard: never emit duplicate notifications for the same event
    if (event.eventId && NotificationService.isEventProcessed(event.eventId)) {
      return;
    }
    if (event.eventId) {
      NotificationService.markEventProcessed(event.eventId);
    }

    // 2. Persistent notification
    if (event.isPersistent) {
      const newNotif = NotificationService.createPersistentNotification(event);
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
    }

    // 3. UI Toast feedback
    showToast(event.message, event.severity || 'success', event.eventId);
  }, [showToast]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(
      (n) => !n.isRead && (n.targetRole === userRole || n.targetRole === 'all')
    ).length;
  }, [notifications, userRole]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.targetRole === userRole || n.targetRole === 'all'
          ? { ...n, isRead: true }
          : n
      )
    );
  }, [userRole]);

  const clearNotifications = useCallback(() => {
    setNotifications((prev) =>
      prev.filter((n) => n.targetRole !== userRole && n.targetRole !== 'all')
    );
  }, [userRole]);

  // Buyer persona updater
  const updateB2BProfile = (updated: Partial<B2BProfile>) => {
    setB2BProfile((prev) => ({ ...prev, ...updated }));
  };

  // Onboarding Completion & Reset
  const completeOnboarding = (info: {
    fullName: string;
    phone: string;
    role: UserRole;
    buyerType: BuyerMode;
  }) => {
    const finalName = info.fullName.trim() || (info.role === 'artisan' ? 'Radhika Devi' : 'Aditi Deshmukh');
    const finalPhone = info.phone.trim() || '98765 43210';
    setUserName(finalName);
    setUserPhone(finalPhone);
    setUserRole(info.role);
    setBuyerMode(info.buyerType);
    if (info.buyerType === 'business') {
      setB2BProfile((prev) => ({
        ...prev,
        contactPerson: finalName,
      }));
    }
    setIsOnboarded(true);
    try {
      localStorage.setItem('kalasetu_onboarded', 'true');
      localStorage.setItem('kalasetu_user_role', info.role);
      localStorage.setItem('kalasetu_buyer_mode', info.buyerType);
      localStorage.setItem('kalasetu_user_name', finalName);
      localStorage.setItem('kalasetu_user_phone', finalPhone);
    } catch {
      // ignore
    }
  };

  const resetOnboarding = () => {
    signOut();
  };

  // Wishlist actions (silent UI toggle - per-user isolation, persists across refresh)
  const toggleWishlist = (productId: string) => {
    const activeUserId = session?.user?.id;
    const storageKey = activeUserId ? `kalasetu_wishlist_${activeUserId}` : 'kalasetu_wishlist_guest';

    setWishlist((prev) => {
      const exists = prev.includes(productId);
      let updated: string[];
      if (exists) {
        trackAnalyticsEvent('PRODUCT_UNSAVE', productId);
        updated = prev.filter((id) => id !== productId);
      } else {
        trackAnalyticsEvent('PRODUCT_SAVE', productId);
        updated = [...prev, productId];
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.warn('[Wishlist] Error saving wishlist to storage:', err);
      }

      if (activeUserId) {
        try {
          const prof = getUserDiscoverProfile(activeUserId);
          prof.wishlistedIds = updated;
          localStorage.setItem(`kalasetu_discover_profile_${activeUserId}`, JSON.stringify(prof));
        } catch {
          // ignore
        }
      }

      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Cart actions with strict inventory stock validation and persistent server synchronization
  const addToCart = async (
    product: Product,
    quantity: number = 1,
    customNotes?: string,
    bulkTierActive?: boolean,
    silent: boolean = true
  ): Promise<boolean> => {
    const availableStock =
      typeof product.stockCount === 'number'
        ? product.stockCount
        : typeof product.stock === 'number'
        ? product.stock
        : 99;

    if (availableStock <= 0) {
      showToast(
        `"${product.title[language] || product.title.en}" is currently out of stock`,
        'warning'
      );
      return false;
    }

    const unitPrice =
      bulkTierActive && product.bulkTier
        ? product.bulkTier.pricePerUnit
        : product.price;

    const existing = cart.find((item) => item.product.id === product.id);
    const existingQty = existing ? existing.quantity : 0;
    const requestedQty = existingQty + quantity;

    if (requestedQty > availableStock) {
      showToast(
        `Only ${availableStock} unit${availableStock !== 1 ? 's are' : ' is'} available for "${product.title[language] || product.title.en}".`,
        'warning'
      );
      return false;
    }

    // If authenticated, persist to backend first and wait for response
    if (session?.access_token) {
      try {
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            product_id: product.id,
            quantity,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          const errMsg = json.error || `Only ${availableStock} units are available.`;
          showToast(errMsg, 'warning');
          // If request fails, do NOT pretend it was added successfully
          return false;
        }

        if (json.success && json.data) {
          const dbItem = json.data;
          let uiProduct = dbItem.product ? mapDbProductToUiProduct(dbItem.product) : product;
          if (typeof dbItem.available_stock === 'number') {
            uiProduct.stockCount = dbItem.available_stock;
            uiProduct.stock = dbItem.available_stock;
            uiProduct.inStock = dbItem.available_stock > 0;
          }

          setCart((prev) => {
            const index = prev.findIndex((item) => item.product.id === product.id);
            const newItem: CartItem = {
              product: uiProduct,
              quantity: dbItem.quantity,
              unitPrice: typeof uiProduct.price === 'number' ? uiProduct.price : unitPrice,
              customNotes: customNotes || '',
              bulkTierActive: Boolean(bulkTierActive),
            };
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = newItem;
              return updated;
            }
            return [...prev, newItem];
          });

          if (!silent) {
            showToast(`Added to shopping bag`, 'success');
          }
          return true;
        }

        return false;
      } catch (err: any) {
        console.warn('[Cart] Server add to cart failed:', err);
        showToast('Unable to connect to server. Please try again.', 'error');
        return false;
      }
    }

    // Local state fallback for guest user
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, unitPrice, customNotes: customNotes || item.customNotes }
            : item
        );
      }
      return [...prev, { product, quantity, unitPrice, customNotes, bulkTierActive }];
    });

    if (!silent) {
      showToast(`Added to shopping bag`, 'success');
    }
    return true;
  };

  const removeFromCart = async (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

    if (session?.access_token) {
      try {
        await fetch(`/api/cart?product_id=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (err) {
        console.warn('[Cart] Server removeFromCart failed:', err);
      }
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((i) => i.product.id === productId);
    const availableStock =
      item && typeof item.product.stockCount === 'number'
        ? item.product.stockCount
        : item && typeof item.product.stock === 'number'
        ? item.product.stock
        : 99;

    if (quantity > availableStock) {
      showToast(
        `Only ${availableStock} unit${availableStock !== 1 ? 's are' : ' is'} available for "${item?.product?.title[language] || item?.product?.title.en || 'this item'}".`,
        'warning'
      );
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );

    if (session?.access_token) {
      try {
        const res = await fetch('/api/cart', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            product_id: productId,
            quantity,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error || `Only ${availableStock} units are available.`;
          showToast(errMsg, 'warning');
          fetchCart();
        }
      } catch (err) {
        console.warn('[Cart] Server updateCartQuantity failed:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (session?.access_token) {
      try {
        await fetch('/api/cart?clear_all=true', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (err) {
        console.warn('[Cart] Server clearCart failed:', err);
      }
    }
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // RFQ Creation with AI Matching
  const createRFQ = (rfqData: {
    category: ProductCategory;
    quantity: number;
    targetBudget: number;
    deliveryDate: string;
    notes?: string;
    organizationName?: string;
  }): RFQ => {
    const matchedArtisans = calculateArtisanMatches({
      category: rfqData.category,
      quantity: rfqData.quantity,
      targetBudget: rfqData.targetBudget,
    });

    const newRFQ: RFQ = {
      id: `RFQ-${Math.floor(100 + Math.random() * 900)}`,
      category: rfqData.category,
      quantity: rfqData.quantity,
      targetBudget: rfqData.targetBudget,
      deliveryDate: rfqData.deliveryDate,
      notes: rfqData.notes,
      organizationName: rfqData.organizationName || b2bProfile.organizationName,
      createdAt: 'Just now',
      matchedArtisans,
      status: 'submitted',
      selectedArtisan: matchedArtisans[0],
    };

    setRfqs((prev) => [newRFQ, ...prev]);
    setActiveRFQ(newRFQ);
    showToast(`✨ RFQ #${newRFQ.id} created! Matched with ${matchedArtisans.length} verified artisan guilds.`, 'success');
    return newRFQ;
  };

  // Negotiation Handlers
  const startNegotiation = (rfq: RFQ, matchedArtisan: MatchedArtisan) => {
    const buyerOffer = rfq.targetBudget;
    const artisanOffer = matchedArtisan.suggestedPrice;
    setActiveNegotiation({
      rfq,
      matchedArtisan,
      currentStep: 2,
      buyerOffer,
      artisanOffer,
      history: [
        {
          sender: 'buyer',
          amount: buyerOffer,
          message: `Target budget proposed: ₹${buyerOffer.toLocaleString()}/unit for ${rfq.quantity} units.`,
          timestamp: 'Just now',
        },
        {
          sender: 'artisan',
          amount: artisanOffer,
          message: `Namaste! We can fulfill this order with verified GI materials and master finish at ₹${artisanOffer.toLocaleString()}/unit.`,
          timestamp: 'Just now',
        },
      ],
    });
  };

  const closeNegotiation = () => {
    setActiveNegotiation(null);
  };

  const submitNegotiationCounter = (newPrice: number, message?: string) => {
    if (!activeNegotiation) return;
    const counterMsg =
      message ||
      `Counter proposal: ₹${newPrice.toLocaleString()}/unit for ${activeNegotiation.rfq.quantity} units.`;

    // Artisan responds intelligently (splits difference towards buyer)
    const nextArtisanPrice = Math.round(
      (newPrice + activeNegotiation.artisanOffer) / 2
    );

    setActiveNegotiation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        buyerOffer: newPrice,
        artisanOffer: nextArtisanPrice,
        currentStep: 2,
        history: [
          ...prev.history,
          {
            sender: 'buyer',
            amount: newPrice,
            message: counterMsg,
            timestamp: 'Just now',
          },
          {
            sender: 'artisan',
            amount: nextArtisanPrice,
            message: `Artisan Guild counter-offer: We can meet at ₹${nextArtisanPrice.toLocaleString()}/unit including branded packaging.`,
            timestamp: 'Just now',
          },
        ],
      };
    });
    showToast(`Counter offer of ₹${newPrice.toLocaleString()} sent to artisan!`, 'info');
  };

  const acceptNegotiationOffer = () => {
    if (!activeNegotiation) return;
    const agreed = activeNegotiation.artisanOffer;
    const { rfq, matchedArtisan } = activeNegotiation;
    placeOrderFromRFQ(rfq, matchedArtisan, agreed);
    closeNegotiation();
  };

  // Place Orders
  const placeOrderFromCart = async (
    deliveryAddress: string = '14, Bandra Kurla Complex, Mumbai, Maharashtra 400051'
  ): Promise<BuyerOrder | null> => {
    if (cart.length === 0) {
      showToast('Your shopping bag is empty', 'warning');
      return null;
    }

    // Pre-flight validation against local inventory stock
    for (const item of cart) {
      const availableStock =
        typeof item.product.stockCount === 'number'
          ? item.product.stockCount
          : typeof item.product.stock === 'number'
          ? item.product.stock
          : 99;

      if (availableStock <= 0) {
        showToast(
          `"${item.product.title[language] || item.product.title.en}" is out of stock. Please remove it from your bag.`,
          'warning'
        );
        return null;
      }

      if (item.quantity > availableStock) {
        showToast(
          `Insufficient stock for "${item.product.title[language] || item.product.title.en}". Requested: ${item.quantity}, available: ${availableStock}. Please adjust quantity.`,
          'warning'
        );
        // Automatically cap cart quantity to available stock so user can proceed cleanly
        setCart((prev) =>
          prev.map((c) =>
            c.product.id === item.product.id ? { ...c, quantity: availableStock } : c
          )
        );
        return null;
      }
    }

    // 1. Get authenticated buyer session
    const buyerSession = await getOrInitAuthSession({ role: 'buyer' });

    // Prepare items for /api/orders
    const orderItems = cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity || 1,
    }));

    let serverOrder: any = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerSession.token}`,
        },
        body: JSON.stringify({
          items: orderItems,
          shipping_address: deliveryAddress,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          serverOrder = json.data;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error || errJson.message || 'Failed to place order';
        console.warn('[Orders] Server order creation error:', errJson);

        // If server indicated insufficient stock with specific product info, sync cart
        if (errJson.product_id && typeof errJson.available_stock === 'number') {
          setCart((prev) =>
            prev
              .map((c) =>
                c.product.id === errJson.product_id
                  ? { ...c, quantity: errJson.available_stock }
                  : c
              )
              .filter((c) => c.quantity > 0)
          );
        }

        showToast(errMsg, 'error');
        // Refresh products so latest stock is fetched from DB
        fetchProducts();
        return null;
      }
    } catch (err: any) {
      console.warn('[Orders] Failed to create order via /api/orders:', err);
      showToast(err?.message || 'Network error while placing order. Please try again.', 'error');
      return null;
    }

    if (!serverOrder) {
      showToast('Could not complete order processing. Please try again.', 'error');
      return null;
    }

    const orderId = serverOrder.order_id || `BYR-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const primaryItem = cart[0]?.product;
    const newOrder: BuyerOrder = {
      id: orderId,
      type: 'b2c',
      items: [...cart],
      totalAmount: Number(serverOrder.total_amount) || cartTotal,
      status: 'order_received',
      currentStep: 1,
      createdAt: 'Just now',
      artisanName: serverOrder?.artisan?.name || primaryItem?.artisan?.name || 'Molela Terracotta Guild',
      artisanCluster: primaryItem?.artisan?.cluster || 'Molela GI Cluster, Rajasthan',
      deliveryEstimate: 'Est. Delivery in 5-7 business days',
    };

    setBuyerOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
    setLastConfirmedOrder(newOrder);
    clearCart();
    setBuyerTab('enquiries');

    // Idempotent Business Event: Order Placed
    dispatchBusinessEvent({
      eventId: NotificationService.createEventId('order', newOrder.id, 'placed'),
      type: 'buyer_order_placed',
      message: `${t('orderPlacedSuccessMsg')} (#${newOrder.id.slice(0, 8)})`,
      severity: 'success',
      isPersistent: true,
      targetRole: 'buyer',
      entityId: newOrder.id,
    });

    // Refresh products to show reduced stock
    fetchProducts();
    // Refresh cart from server
    fetchCart();
    // Refresh buyer & artisan orders
    fetchOrders('buyer');
    fetchOrders('artisan');

    return newOrder;
  };

  const placeOrderFromRFQ = (
    rfq: RFQ,
    matchedArtisan: MatchedArtisan,
    agreedPrice: number
  ): BuyerOrder => {
    const orderId = `BYR-BLK-${Math.floor(1000 + Math.random() * 9000)}`;
    // find related product if any
    const sampleProduct = products.find((p) => p.category === rfq.category) || products[0];

    const newOrder: BuyerOrder = {
      id: orderId,
      type: 'b2b',
      items: [
        {
          product: sampleProduct,
          quantity: rfq.quantity,
          unitPrice: agreedPrice,
          customNote: rfq.notes,
        },
      ],
      totalAmount: agreedPrice * rfq.quantity,
      status: 'order_received',
      currentStep: 1,
      createdAt: 'Just now',
      artisanName: matchedArtisan.name,
      artisanCluster: `${matchedArtisan.cluster}, ${matchedArtisan.location}`,
      deliveryEstimate: `Delivery required by ${rfq.deliveryDate}`,
      rfqId: rfq.id,
    };

    // Update RFQ status
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === rfq.id ? { ...r, status: 'order_locked', selectedArtisan: matchedArtisan } : r
      )
    );

    setBuyerOrders((prev) => [newOrder, ...prev]);
    setLastConfirmedOrder(newOrder);
    setBuyerTab('enquiries');

    // Idempotent Business Event: Bulk Order Locked
    dispatchBusinessEvent({
      eventId: NotificationService.createEventId('order', newOrder.id, 'locked'),
      type: 'buyer_order_placed',
      message: `${t('bulkOrderLockedMsg')} (#${newOrder.id})`,
      severity: 'success',
      isPersistent: true,
      targetRole: 'buyer',
      entityId: newOrder.id,
    });

    return newOrder;
  };

  // Artisan Actions
  const toggleProductAvailability = async (productId: string) => {
    const currentProd = products.find((p) => p.id === productId);
    const newStatus = !currentProd?.inStock;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return { ...p, inStock: newStatus };
        }
        return p;
      })
    );

    try {
      await updateProduct(productId, {
        status: newStatus ? 'published' : 'draft',
        inStock: newStatus,
      });
      showToast(
        newStatus ? 'Craft is now available in marketplace' : 'Craft marked as unlisted',
        'info'
      );
    } catch (err) {
      console.warn('[toggleProductAvailability] Failed to persist availability:', err);
    }
  };

  const refillProductStock = async (productId: string, amount: number = 10) => {
    const currentProd = products.find((p) => p.id === productId);
    const curStock = currentProd?.stockCount ?? currentProd?.stock ?? 0;
    const updatedStock = curStock + amount;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          return {
            ...p,
            stockCount: updatedStock,
            stock: updatedStock,
            inStock: true,
            isLowStock: updatedStock <= 3 && updatedStock > 0,
          };
        }
        return p;
      })
    );

    // Persist to backend database
    try {
      await updateProduct(productId, {
        stockCount: updatedStock,
        stock: updatedStock,
        inStock: true,
      });
      showToast(`Stock refilled: +${amount} units (Total: ${updatedStock})`, 'success');
    } catch (err) {
      console.warn('[Stock] Refill stock persistence notice:', err);
    }
  };

  const updateProductImage = async (productId: string, imageUrl: string) => {
    try {
      const session = await getOrInitAuthSession();
      const token = (session as any)?.token || (session as any)?.access_token;
      const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ image_url: imageUrl }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, imageUrl } : p))
        );
        setArtisanProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, imageUrl } : p))
        );
        fetchProducts('artisan', true).catch((e) => console.warn('[fetchProducts sync error]', e));
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[updateProductImage] Backend returned ${res.status}: ${errText}`);
      }
    } catch (e) {
      console.warn('[updateProductImage] Failed to persist image update:', e);
    }
  };

  const updateProduct = async (
    productId: string,
    updates: Partial<Product> & {
      pricing?: any;
      marketplace_listings?: any[];
      status?: 'draft' | 'published';
      image_url?: string;
      images?: any[];
    }
  ): Promise<Product | null> => {
    try {
      const session = await getOrInitAuthSession();
      const token = (session as any)?.token || (session as any)?.access_token;
      const payload: any = { product_id: productId };
      if (updates.title) {
        payload.title = typeof updates.title === 'string' ? updates.title : updates.title.en;
      }
      if (updates.category) payload.category = updates.category;
      if (updates.categoryLabel) {
        payload.category_label = typeof updates.categoryLabel === 'string' ? updates.categoryLabel : updates.categoryLabel.en;
      }
      if (updates.price !== undefined) payload.price = updates.price;
      if (updates.stockCount !== undefined) payload.stock = updates.stockCount;
      else if (updates.stock !== undefined) payload.stock = updates.stock;
      if (updates.materials) payload.materials = updates.materials;
      if (updates.dimensions) payload.dimensions = updates.dimensions;
      if (updates.tags) payload.tags = updates.tags;
      if (updates.imageUrl) payload.image_url = updates.imageUrl;
      if (updates.craftStory) {
        payload.description =
          typeof updates.craftStory === 'string'
            ? updates.craftStory
            : (updates.craftStory as any).en || '';
      }
      if (updates.pricing) payload.pricing = updates.pricing;
      if (updates.status) payload.status = updates.status;

      const res = await fetch(`/api/products?id=${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedDbProduct = json.data;
        const updatedUiProduct = updatedDbProduct ? mapDbProductToUiProduct(updatedDbProduct) : null;

        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              const newStock =
                updates.stockCount !== undefined
                  ? updates.stockCount
                  : updates.stock !== undefined
                  ? updates.stock
                  : p.stockCount;
              return {
                ...p,
                ...(updatedUiProduct || updates),
                stockCount: newStock,
                stock: newStock,
                inStock: newStock > 0,
                isLowStock: newStock <= 3 && newStock > 0,
              };
            }
            return p;
          })
        );

        setArtisanProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              const newStock =
                updates.stockCount !== undefined
                  ? updates.stockCount
                  : updates.stock !== undefined
                  ? updates.stock
                  : p.stockCount;
              return {
                ...p,
                ...(updatedUiProduct || updates),
                stockCount: newStock,
                stock: newStock,
                inStock: newStock > 0,
                isLowStock: newStock <= 3 && newStock > 0,
              };
            }
            return p;
          })
        );

        // Refresh products and analytics directly from Supabase to ensure fresh state
        await fetchProducts('artisan', true).catch((e) => console.warn('[fetchProducts sync error]', e));
        fetchArtisanAnalytics().catch((e) => console.warn('[fetchArtisanAnalytics sync error]', e));
        return updatedUiProduct || (products.find((p) => p.id === productId) as Product) || null;
      } else {
        const errJson = await res.json().catch(() => null);
        const errorText = errJson?.error || errJson?.message || `Failed to update product (HTTP ${res.status})`;
        console.error(`[updateProduct] Backend returned ${res.status}: ${errorText}`);
        showToast(errorText, 'error');
        return null;
      }
    } catch (err: any) {
      console.error('[updateProduct] Error updating product:', err);
      showToast(err?.message || 'Error updating craft', 'error');
      return null;
    }
  };

  const addNewProduct = async (
    newProd: Omit<Product, 'id'>,
    options?: {
      pricing?: any;
      marketplace_listings?: any[];
      status?: 'draft' | 'published';
      images?: Array<{
        image_url: string;
        image_type: 'original' | 'enhanced' | 'gallery' | 'thumbnail';
        is_primary?: boolean;
      }>;
    }
  ): Promise<Product> => {
    // 1. Obtain real authenticated Supabase Auth artisan session
    const session = await getOrInitAuthSession({ name: userName, phone: userPhone });

    const titleStr = typeof newProd.title === 'string' ? newProd.title : newProd.title?.en || 'Handcrafted Craft';
    const catStr = typeof newProd.category === 'string' ? newProd.category : 'pottery';
    const catLabelStr = typeof newProd.categoryLabel === 'string' ? newProd.categoryLabel : newProd.categoryLabel?.en || 'Handicrafts';
    const descStr = typeof newProd.craftStory === 'string' ? newProd.craftStory : newProd.craftStory?.en || '';
    const status = options?.status || 'published';

    // Pricing payload matching Supabase pricing table decomposition
    const pricingPayload = options?.pricing || {
      material_cost: Math.round(newProd.price * 0.3),
      labour_cost: Math.round(newProd.price * 0.4),
      packaging_cost: Math.round(newProd.price * 0.08),
      other_cost: Math.round(newProd.price * 0.05),
      market_estimate: newProd.mrp ? Math.round(newProd.mrp * 0.9) : newProd.price,
      minimum_viable_price: Math.round(newProd.price * 0.78),
      recommended_price: newProd.price,
      margin_percent: 22,
    };

    const listingsPayload = options?.marketplace_listings || [
      {
        marketplace: 'kalasetu',
        platform: 'kalasetu',
        title: titleStr,
        description: descStr,
        category: catStr,
        listing_status: status === 'published' ? 'published' : 'draft',
      },
    ];

    const imagesPayload =
      options?.images && options.images.length > 0
        ? options.images
        : [
            {
              image_url: newProd.imageUrl,
              image_type: 'original' as const,
              is_primary: true,
            },
          ];

    const payload = {
      title: titleStr,
      description: descStr,
      category: catStr,
      category_label: catLabelStr,
      sub_category: 'Artisan Goods',
      subcategory: 'Artisan Goods',
      materials: newProd.materials || [],
      specifications: (newProd.craftStory as any)?.techniques || [],
      dimensions: newProd.dimensions || '',
      tags: newProd.tags || [],
      price: newProd.price,
      stock: newProd.stockCount,
      status: status,
      image_url: newProd.imageUrl,
      images: imagesPayload,
      pricing: pricingPayload,
      marketplace_listings: listingsPayload,
    };

    let savedDbProduct: any = null;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error || `Failed to save product to Supabase (${res.status})`;
        showToast(errMsg, 'error');
        throw new Error(errMsg);
      }

      const json = await res.json();
      savedDbProduct = json.data;
    } catch (saveErr: any) {
      showToast(saveErr?.message || 'Error saving product to Supabase', 'error');
      throw saveErr;
    }

    const assignedId = savedDbProduct?.product_id || savedDbProduct?.id || `prod-${Date.now()}`;
    const product: Product = { ...newProd, id: assignedId };

    setProducts((prev) => [product, ...prev]);

    // Idempotent Business Event: Product Published
    dispatchBusinessEvent({
      eventId: NotificationService.createEventId('product', product.id, 'published'),
      type: 'artisan_product_published',
      message: t('productPublishedSuccessMsg'),
      severity: 'success',
      isPersistent: true,
      targetRole: 'artisan',
      entityId: product.id,
    });

    // Synchronize backend products with forceRefresh
    fetchProducts('artisan', true);

    return product;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus | string) => {
    let dbStatus = 'processing';
    if (status === 'pending_craft' || status === 'pending') dbStatus = 'pending';
    else if (status === 'ready_for_dispatch' || status === 'confirmed') dbStatus = 'confirmed';
    else if (status === 'in_progress' || status === 'processing') dbStatus = 'processing';
    else if (status === 'shipped') dbStatus = 'shipped';
    else if (status === 'delivered') dbStatus = 'delivered';
    else if (status === 'cancelled') dbStatus = 'cancelled';

    try {
      const session = await getOrInitAuthSession({ role: 'artisan' });
      if (session?.token) {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ status: dbStatus }),
        });
      }
    } catch (err) {
      console.warn('[Orders] Failed to update order status via API:', err);
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          dispatchBusinessEvent({
            eventId: NotificationService.createEventId('order', orderId, `status_${status}`),
            type: 'artisan_order_status_updated',
            message: `Order #${o.id.slice(0, 8)} status updated to ${status.replace('_', ' ')}`,
            severity: 'success',
            isPersistent: true,
            targetRole: 'artisan',
            entityId: orderId,
          });
          return { ...o, status: status as OrderStatus };
        }
        return o;
      })
    );
  };

  const advanceOrderStep = async (orderId: string) => {
    let targetDbStatus: string | null = null;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.customRequest) {
          const nextStep = Math.min(4, o.customRequest.currentStep + 1);
          let newStatus = o.status;
          if (nextStep === 3) newStatus = 'in_progress';
          if (nextStep === 4) newStatus = 'ready_for_dispatch';

          if (newStatus === 'in_progress') targetDbStatus = 'processing';
          else if (newStatus === 'ready_for_dispatch') targetDbStatus = 'confirmed';

          dispatchBusinessEvent({
            eventId: NotificationService.createEventId('order', orderId, `milestone_${nextStep}`),
            type: 'artisan_order_milestone_advanced',
            message: `Order #${o.id.slice(0, 8)} advanced to milestone ${nextStep}/4!`,
            severity: 'success',
            isPersistent: true,
            targetRole: 'artisan',
            entityId: orderId,
          });

          return {
            ...o,
            status: newStatus,
            customRequest: {
              ...o.customRequest,
              currentStep: nextStep,
              proofApproved: nextStep >= 3 ? true : o.customRequest.proofApproved,
              craftingProgress: nextStep === 3 ? 60 : nextStep === 4 ? 100 : o.customRequest.craftingProgress,
            },
          };
        }
        return o;
      })
    );

    if (targetDbStatus) {
      try {
        const session = await getOrInitAuthSession({ role: 'artisan' });
        if (session?.token) {
          await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.token}`,
            },
            body: JSON.stringify({ status: targetDbStatus }),
          });
        }
      } catch (err) {
        console.warn('[Orders] Failed to sync advance step status to API:', err);
      }
    }
  };

  const lockOrderPrice = async (orderId: string, price: number) => {
    try {
      const session = await getOrInitAuthSession({ role: 'artisan' });
      if (session?.token) {
        await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        });
      }
    } catch (err) {
      console.warn('[Orders] Failed to sync lock price status to API:', err);
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          dispatchBusinessEvent({
            eventId: NotificationService.createEventId('order', orderId, 'price_locked'),
            type: 'artisan_price_locked',
            message: `Price locked at ₹${price.toLocaleString()} for ${o.customerName}!`,
            severity: 'success',
            isPersistent: true,
            targetRole: 'artisan',
            entityId: orderId,
          });

          return {
            ...o,
            totalAmount: price,
            status: o.status === 'pending_craft' ? 'in_progress' : o.status,
            customRequest: o.customRequest
              ? { ...o.customRequest, proofApproved: true, currentStep: Math.max(o.customRequest.currentStep, 2) }
              : undefined,
          };
        }
        return o;
      })
    );
  };

  const negotiateOrderPrice = (orderId: string, counterPrice: number, message: string) => {
    dispatchBusinessEvent({
      eventId: NotificationService.createEventId('order', orderId, `counter_${counterPrice}`),
      type: 'artisan_buyer_request_received',
      message: `Counter proposal of ₹${counterPrice.toLocaleString()} sent to buyer via WhatsApp!`,
      severity: 'info',
      isPersistent: true,
      targetRole: 'artisan',
      entityId: orderId,
    });
  };

  const openModal = (modalName: string, data: any = null) => {
    if (modalName === 'add_product') {
      setActiveTab('upload');
      return;
    }
    setActiveModal(modalName);
    setModalData(data);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      activeTab,
      setActiveTab,
      userRole,
      setUserRole,
      buyerMode,
      setBuyerMode,
      hasSelectedPersona,
      setHasSelectedPersona,
      b2bProfile,
      updateB2BProfile,
      buyerTab,
      setBuyerTab,
      products,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      sortBy,
      setSortBy,
      viewMode,
      setViewMode,
      toggleProductAvailability,
      refillProductStock,
      updateProductImage,
      updateProduct,
      addNewProduct,
      fetchProducts,
      selectedBuyerProduct,
      setSelectedBuyerProduct,
      wishlist,
      toggleWishlist,
      isInWishlist,
      cart,
      fetchCart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotal,
      cartCount,
      rfqs,
      activeRFQ,
      setActiveRFQ,
      createRFQ,
      activeNegotiation,
      startNegotiation,
      closeNegotiation,
      submitNegotiationCounter,
      acceptNegotiationOffer,
      buyerOrders,
      placeOrderFromCart,
      placeOrderFromRFQ,
      lastConfirmedOrder,
      setLastConfirmedOrder,
      orders,
      fetchOrders,
      orderSearchQuery,
      setOrderSearchQuery,
      orderFilter,
      setOrderFilter,
      updateOrderStatus,
      advanceOrderStep,
      lockOrderPrice,
      negotiateOrderPrice,
      selectedAnalyticsProduct,
      setSelectedAnalyticsProduct,
      salesPeriod,
      setSalesPeriod,
      artisanAnalytics,
      fetchArtisanAnalytics,
      trackAnalyticsEvent,
      activeModal,
      modalData,
      openModal,
      closeModal,
      toasts,
      showToast,
      dismissToast,
      dispatchBusinessEvent,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
      deviceMode,
      setDeviceMode,
      isOnboarded,
      completeOnboarding,
      resetOnboarding,
      userName,
      userPhone,
      session,
      authLoading,
      userProfile,
      getOrInitAuthSession,
      signIn,
      signUp,
      resendVerificationEmail,
      signOut,
    }),
    [
      language,
      activeTab,
      userRole,
      buyerMode,
      hasSelectedPersona,
      b2bProfile,
      buyerTab,
      isOnboarded,
      userName,
      userPhone,
      session,
      authLoading,
      userProfile,
      getOrInitAuthSession,
      signIn,
      signUp,
      resendVerificationEmail,
      signOut,
      products,
      searchQuery,
      selectedCategory,
      sortBy,
      viewMode,
      selectedBuyerProduct,
      wishlist,
      cart,
      fetchCart,
      cartTotal,
      cartCount,
      rfqs,
      activeRFQ,
      activeNegotiation,
      buyerOrders,
      lastConfirmedOrder,
      orders,
      fetchOrders,
      orderSearchQuery,
      orderFilter,
      selectedAnalyticsProduct,
      fetchProducts,
      salesPeriod,
      artisanAnalytics,
      fetchArtisanAnalytics,
      trackAnalyticsEvent,
      activeModal,
      modalData,
      toasts,
      notifications,
      unreadNotificationsCount,
      deviceMode,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
