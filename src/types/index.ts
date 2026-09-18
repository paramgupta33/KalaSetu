export type Language =
  | 'en' // English
  | 'hi' // Hindi (हिन्दी)
  | 'mr' // Marathi (मराठी)
  | 'bn' // Bengali (বাংলা)
  | 'ta' // Tamil (தமிழ்)
  | 'te' // Telugu (తెలుగు)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ml' // Malayalam (മലയാളം)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'as' // Assamese (অসমীয়া)
  | 'ur' // Urdu (اردو)
  | 'sa' // Sanskrit (संस्कृतम्)
  | 'bho'; // Bhojpuri (भोजपुरी)

export type UserRole = 'artisan' | 'buyer';

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  language: string;
  created_at?: string;
}

export type BuyerMode = 'personal' | 'business';

export type NavigationTab = 'dashboard' | 'catalogue' | 'orders' | 'analytics' | 'upload';

export type BuyerTab = 'market' | 'discover' | 'b2b' | 'b2b_rfq' | 'wishlist' | 'enquiries';

export type ProductViewMode = '1col' | '2col';

export type ProductCategory =
  | 'all'
  | 'pottery'
  | 'textiles'
  | 'brass'
  | 'wood'
  | 'jute'
  | 'painting'
  | 'metal'
  | 'jewelry';

export interface ArtisanProfile {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  location: string;
  state: string;
  cluster: string;
  experienceYears: number;
  speciality: string;
  giTag: string;
  verifiedBadge?: boolean;
  heritageStory: {
    en: string;
    [key: string]: string | undefined;
  };
  capacityPerMonth: number;
  rating: number;
  reviewsCount: number;
  responseRate: string;
}

export interface CraftStoryDetails {
  historicalOrigin?: string;
  techniques?: string[];
  giRegistrationNumber?: string;
  generationalLineage?: string;
  fairWageShare?: number;
  en?: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  sku: string;
  title: {
    en: string;
    [key: string]: string | undefined;
  };
  category: ProductCategory;
  categoryLabel: {
    en: string;
    [key: string]: string | undefined;
  };
  price: number;
  mrp: number;
  discountPercent: number;
  inStock: boolean;
  stockCount: number;
  stock?: number;
  views: number;
  sold: number;
  isLowStock?: boolean;
  imageUrl: string;
  altText: string;
  tags: string[];
  giCertified?: boolean;
  isGiCertified?: boolean;
  artisan?: ArtisanProfile;
  craftStory?: CraftStoryDetails | {
    en: string;
    hi: string;
    mr: string;
  };
  bulkTier?: {
    minUnits?: number;
    minQty?: number;
    pricePerUnit: number;
    leadTimeDays: number;
    maxCapacityPerMonth?: number;
  };
  materials?: string[];
  dimensions?: string;
}

export type OrderStatus =
  | 'pending_craft'
  | 'in_progress'
  | 'ready_for_dispatch'
  | 'shipped'
  | 'delivered';

export interface BespokeCustomRequest {
  tag: string;
  note: string;
  referenceImage?: string;
  referenceFilename?: string;
  specialFee?: number;
  giftWrap?: boolean;
  engravingText?: string;
  currentStep: number; // 1: Received, 2: Proof Sent, 3: Crafting, 4: Dispatch
  proofApproved?: boolean;
  craftingProgress?: number; // 0 - 100%
  shippingCarrier?: string;
  shippingTrackingNumber?: string;
}

export interface Order {
  id: string;
  customerName: string;
  location: string;
  totalAmount: number;
  paymentMethod: string;
  orderTimeAgo: {
    en: string;
    hi: string;
    mr: string;
  };
  status: OrderStatus;
  productId: string;
  productTitle: string;
  productSku: string;
  productSpec: string;
  productImage: string;
  quantity?: number;
  items?: any[];
  createdAt?: string;
  created_at?: string;
  customRequest?: BespokeCustomRequest;
}

export type TimeRangeFilter = '7d' | '30d' | '90d' | 'all';

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

export interface B2BProfile {
  organizationName: string;
  buyerIndustry: string;
  sourcingVolume: string;
  contactPerson: string;
  industry?: string;
  targetVolume?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
}

export interface MatchedArtisan {
  id: string;
  name: string;
  cluster: string;
  location: string;
  speciality: string;
  rating: number;
  completedOrders: number;
  capacityPerMonth: number;
  matchScore: number; // calculated percentage
  breakdown: {
    categoryScore: number;
    budgetScore: number;
    capacityScore: number;
    locationScore: number;
  };
  suggestedPrice: number;
  imageUrl: string;
  giCertified: boolean;
}

export interface RFQ {
  id: string;
  category: ProductCategory;
  quantity: number;
  targetBudget: number; // per unit in INR
  deliveryDate: string;
  notes?: string;
  organizationName?: string;
  createdAt: string;
  matchedArtisans: MatchedArtisan[];
  status: 'submitted' | 'matching' | 'in_negotiation' | 'order_locked' | 'confirmed';
  selectedArtisan?: MatchedArtisan;
  negotiationData?: {
    buyerAskPrice: number;
    artisanCounterPrice: number;
    currentStep: number; // 1: Ask Submitted, 2: Counter Received, 3: Final Agreement, 4: Confirmed
    history: { sender: 'buyer' | 'artisan'; amount: number; message: string; timestamp: string }[];
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  customNotes?: string;
  customNote?: string;
  bulkTierActive?: boolean;
}

export interface BuyerOrder {
  id: string;
  type: 'b2c' | 'b2b';
  items: {
    product: Product;
    quantity: number;
    unitPrice: number;
    customNote?: string;
  }[];
  totalAmount: number;
  status: 'order_received' | 'in_crafting' | 'quality_check' | 'dispatched' | 'delivered';
  currentStep: number;
  createdAt: string;
  artisanName: string;
  artisanCluster: string;
  deliveryEstimate: string;
  rfqId?: string;
}

// Dashboard-Specific Business Types
export interface DashboardMetrics {
  totalSales: number;
  salesGrowthPercent: number;
  activeCraftsCount: number;
  newCraftsThisMonth: number;
  ordersCount: number;
  activeOrdersCount: number;
  buyerViews: number;
  viewsGrowthPercent: number;
  buyerInquiriesCount: number;
}

export type AttentionSeverity = 'urgent' | 'warning' | 'info';

export interface DashboardAttentionItem {
  id: string;
  type: 'order' | 'custom_request' | 'stock';
  title: string;
  description: string;
  count?: number;
  severity: AttentionSeverity;
  actionTab: NavigationTab;
  actionLabel?: string;
}

// Business Notification & Event System
export type BusinessEventType =
  | 'buyer_order_placed'
  | 'buyer_payment_completed'
  | 'buyer_order_status_updated'
  | 'buyer_order_cancelled'
  | 'buyer_delivery_dispatched'
  | 'buyer_rfq_created'
  | 'buyer_negotiation_counter'
  | 'artisan_product_published'
  | 'artisan_order_received'
  | 'artisan_order_status_updated'
  | 'artisan_order_milestone_advanced'
  | 'artisan_buyer_request_received'
  | 'artisan_price_locked'
  | 'artisan_subsidy_claimed'
  | 'artisan_listing_generated';

export interface BusinessEvent {
  eventId: string;
  type: BusinessEventType;
  message: string;
  severity?: 'success' | 'info' | 'warning';
  timestamp?: number;
  isPersistent?: boolean;
  targetRole?: UserRole | 'all';
  entityId?: string;
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  eventId: string;
  type: BusinessEventType;
  message: string;
  severity: 'success' | 'info' | 'warning';
  timestamp: number;
  isRead: boolean;
  targetRole: UserRole | 'all';
  entityId?: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  eventId?: string;
}

export interface AnalyticsTimeSeriesPoint {
  date: string;
  views: number;
  orders: number;
  revenue: number;
  amount: number;
}

export interface ProductAnalyticsItem {
  product_id: string;
  title: string;
  sku: string;
  price: number;
  stock: number;
  image_url: string;
  views: number;
  clicks: number;
  saves: number;
  cart_additions: number;
  units_sold: number;
  revenue: number;
  conversion_rate: string;
  save_rate: string;
}

export interface BespokeDemandItem {
  title: string;
  description: string;
  count: number;
  price_tag: string;
}

export interface ArtisanAnalyticsState {
  total_views: number;
  total_products: number;
  total_orders: number;
  total_units_sold: number;
  total_revenue: number;
  total_saves: number;
  total_cart_additions: number;
  total_clicks: number;
  save_rate: string;
  conversion_rate: string;
  products: ProductAnalyticsItem[];
  top_products: ProductAnalyticsItem[];
  time_series: AnalyticsTimeSeriesPoint[];
  custom_requests: BespokeDemandItem[];
  loading?: boolean;
}

