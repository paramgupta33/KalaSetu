import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getSeedProductRecord } from "./seedCatalog.js";
import {
  loadCartStore,
  getStoredCartForUser,
  saveStoredCartItem,
  removeStoredCartItem,
  clearStoredCartForUser,
} from "./cartStore.js";

// ====================================================================
// Type Definitions Aligned With Existing Supabase PostgreSQL Schema
// ====================================================================

export function isValidUuid(id: any): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

/**
 * users table schema:
 * - user_id UUID PRIMARY KEY
 * - name VARCHAR / TEXT
 * - email VARCHAR / TEXT
 * - phone VARCHAR / TEXT
 * - role VARCHAR ('artisan' | 'buyer' | 'b2b')
 * - language VARCHAR
 * - created_at TIMESTAMPTZ
 */
export interface UserRecord {
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  language?: string;
  created_at?: string;
  // API alias for backward compatibility:
  id: string;
  [key: string]: any;
}

export type ArtisanRecord = UserRecord;

/**
 * product_images table schema:
 * - image_id UUID PRIMARY KEY
 * - product_id UUID FOREIGN KEY (products.product_id)
 * - image_url TEXT
 * - image_type VARCHAR(30)
 * - created_at TIMESTAMPTZ
 *
 * NOTE: Column 'is_primary' DOES NOT exist in database table.
 */
export interface ProductImageDbRow {
  image_id: string;
  product_id: string;
  image_url: string;
  image_type: "original" | "enhanced" | "gallery" | "thumbnail";
  created_at?: string;
}

export interface ProductImageRecord extends ProductImageDbRow {
  id: string; // mapped to image_id
  is_primary?: boolean; // client-side helper flag, never written to DB
}

/**
 * pricing table schema:
 * - pricing_id UUID PRIMARY KEY
 * - product_id UUID FOREIGN KEY (products.product_id)
 * - material_cost NUMERIC
 * - labour_cost NUMERIC
 * - packaging_cost NUMERIC
 * - other_cost NUMERIC
 * - market_estimate NUMERIC
 * - minimum_viable_price NUMERIC
 * - recommended_price NUMERIC
 * - margin_percent NUMERIC
 * - created_at TIMESTAMPTZ
 *
 * NOTE: retail_price, mrp, currency, discount_percent DO NOT exist in database table.
 * Actual selling price belongs in products.price.
 */
export interface PricingDbRow {
  pricing_id: string;
  product_id: string;
  material_cost?: number | null;
  labour_cost?: number | null;
  packaging_cost?: number | null;
  other_cost?: number | null;
  market_estimate?: number | null;
  minimum_viable_price?: number | null;
  recommended_price?: number | null;
  margin_percent?: number | null;
  created_at?: string;
}

export interface PricingRecord extends PricingDbRow {
  id: string; // mapped to pricing_id
  other_costs?: number | null; // mapped to other_cost
  retail_price?: number | null; // mapped from products.price
  mrp?: number | null;
}

/**
 * marketplace_listings table schema:
 * - listing_id UUID PRIMARY KEY
 * - product_id UUID FOREIGN KEY (products.product_id)
 * - marketplace VARCHAR(50)
 * - title TEXT
 * - description TEXT
 * - category VARCHAR(100)
 * - tags JSONB
 * - listing_status VARCHAR(20)
 * - created_at TIMESTAMPTZ
 * - updated_at TIMESTAMPTZ
 *
 * NOTE: listing_price, listing_url, metadata DO NOT exist in database table.
 */
export interface MarketplaceListingDbRow {
  listing_id: string;
  product_id: string;
  marketplace: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  listing_status: string;
  created_at?: string;
  updated_at?: string;
}

export interface MarketplaceListingRecord extends MarketplaceListingDbRow {
  id: string; // mapped to listing_id
  platform: string; // mapped to marketplace
  listing_title?: string | null;
}

/**
 * products table schema:
 * - product_id UUID PRIMARY KEY
 * - artisan_id UUID FOREIGN KEY (users.user_id)
 * - title VARCHAR(255)
 * - description TEXT
 * - category VARCHAR(100)
 * - subcategory VARCHAR(100)
 * - materials JSONB
 * - specifications JSONB
 * - dimensions VARCHAR(100)
 * - tags JSONB
 * - price NUMERIC
 * - stock INTEGER
 * - status VARCHAR(20)
 * - created_at TIMESTAMPTZ
 * - updated_at TIMESTAMPTZ
 */
export interface ProductDbRow {
  product_id: string;
  artisan_id: string;
  title: string;
  description?: string | null;
  category: string;
  subcategory?: string | null;
  materials?: string[];
  specifications?: string[];
  dimensions?: string | null;
  tags?: string[];
  price: number;
  stock: number;
  views?: number;
  status: "draft" | "published" | "archived";
  created_at?: string;
  updated_at?: string;
}

export interface ProductRecord extends ProductDbRow {
  id: string; // mapped to product_id
  sub_category?: string | null; // mapped to subcategory
  category_label?: string | null;
  images?: ProductImageRecord[];
  artisan?: Partial<UserRecord> | null;
  pricing?: PricingRecord | null;
  marketplace_listings?: MarketplaceListingRecord[];
}

/**
 * cart_items table schema:
 * - cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
 * - user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE
 * - product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE
 * - quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
 * - created_at TIMESTAMPTZ DEFAULT NOW()
 * - updated_at TIMESTAMPTZ DEFAULT NOW()
 * UNIQUE (user_id, product_id)
 */
export interface CartItemDbRow {
  cart_item_id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItemRecord extends CartItemDbRow {
  id: string; // mapped to cart_item_id
  product?: ProductRecord | null;
  is_out_of_stock?: boolean;
  is_exceeding_stock?: boolean;
  available_stock?: number;
}

// ====================================================================
// Supabase Client Initialization
// ====================================================================

let supabaseInstance: SupabaseClient | null = null;
let currentKeyUsed: string | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();
  const key = serviceKey || anonKey;

  if (!url || !key) {
    return null;
  }

  // If service role key became available, refresh instance
  if (!supabaseInstance || (serviceKey && currentKeyUsed !== serviceKey)) {
    currentKeyUsed = key;
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (!serviceKey) {
      console.warn(
        "[Supabase Server] Notice: SUPABASE_SERVICE_ROLE_KEY is not defined in environment. Server operations will use anon key subject to RLS."
      );
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

// ====================================================================
// Data Mapping Helpers (Database Schema <-> API Record)
// ====================================================================

export function mapUserDbRowToRecord(row: any): UserRecord {
  if (!row) return row;
  const userId = row.user_id || row.id;
  return {
    user_id: userId,
    id: userId,
    name: row.name || "Artisan",
    email: row.email || null,
    phone: row.phone || null,
    role: row.role || "artisan",
    language: row.language || "en",
    created_at: row.created_at,
  };
}

export function mapProductDbRowToRecord(row: any): ProductRecord {
  if (!row) return row;

  const mappedImages: ProductImageRecord[] = Array.isArray(row.product_images)
    ? row.product_images.map((img: any) => ({
        image_id: img.image_id,
        id: img.image_id,
        product_id: img.product_id,
        image_url: img.image_url,
        image_type: img.image_type || "original",
        created_at: img.created_at,
      }))
    : [];

  const rawPricing = Array.isArray(row.pricing) ? row.pricing[0] : row.pricing;
  const mappedPricing: PricingRecord | null = rawPricing
    ? {
        pricing_id: rawPricing.pricing_id,
        id: rawPricing.pricing_id,
        product_id: rawPricing.product_id,
        material_cost: rawPricing.material_cost != null ? Number(rawPricing.material_cost) : null,
        labour_cost: rawPricing.labour_cost != null ? Number(rawPricing.labour_cost) : null,
        packaging_cost: rawPricing.packaging_cost != null ? Number(rawPricing.packaging_cost) : null,
        other_cost: rawPricing.other_cost != null ? Number(rawPricing.other_cost) : null,
        other_costs: rawPricing.other_cost != null ? Number(rawPricing.other_cost) : null,
        market_estimate: rawPricing.market_estimate != null ? Number(rawPricing.market_estimate) : null,
        minimum_viable_price: rawPricing.minimum_viable_price != null ? Number(rawPricing.minimum_viable_price) : null,
        recommended_price: rawPricing.recommended_price != null ? Number(rawPricing.recommended_price) : null,
        retail_price: row.price != null ? Number(row.price) : null,
        margin_percent: rawPricing.margin_percent != null ? Number(rawPricing.margin_percent) : null,
        created_at: rawPricing.created_at,
      }
    : null;

  const mappedListings: MarketplaceListingRecord[] = Array.isArray(row.marketplace_listings)
    ? row.marketplace_listings.map((mkt: any) => ({
        listing_id: mkt.listing_id,
        id: mkt.listing_id,
        product_id: mkt.product_id,
        marketplace: mkt.marketplace,
        platform: mkt.marketplace,
        title: mkt.title,
        listing_title: mkt.title,
        description: mkt.description || null,
        category: mkt.category || null,
        tags: mkt.tags || [],
        listing_status: mkt.listing_status || "published",
        created_at: mkt.created_at,
        updated_at: mkt.updated_at,
      }))
    : [];

  const artisanUser = row.users ? mapUserDbRowToRecord(row.users) : null;

  return {
    product_id: row.product_id,
    id: row.product_id,
    artisan_id: row.artisan_id,
    title: row.title,
    description: row.description || "",
    category: row.category,
    subcategory: row.subcategory || null,
    sub_category: row.subcategory || null,
    materials: Array.isArray(row.materials) ? row.materials : [],
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    dimensions: row.dimensions || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    price: Number(row.price) || 0,
    stock: typeof row.stock === "number" ? row.stock : 1,
    views: typeof row.views === "number" ? row.views : 0,
    status: row.status || "draft",
    created_at: row.created_at,
    updated_at: row.updated_at,
    images: mappedImages,
    artisan: artisanUser,
    pricing: mappedPricing,
    marketplace_listings: mappedListings,
  };
}

// ====================================================================
// In-Memory Fallback (ONLY used if Supabase is completely unconfigured)
// ====================================================================

const inMemoryUsers: Map<string, UserRecord> = new Map<string, UserRecord>();

const inMemoryProducts: Map<string, ProductRecord> = new Map();
const inMemoryProductImages: Map<string, ProductImageRecord> = new Map();
const inMemoryPricing: Map<string, PricingRecord> = new Map();
const inMemoryMarketplaceListings: Map<string, MarketplaceListingRecord> = new Map();
const inMemoryOrders: Map<string, any> = new Map();
const inMemoryOrderItems: Map<string, any> = new Map();
const inMemoryCartItems: Map<string, CartItemRecord> = new Map();
const inMemoryAnalyticsEvents: Map<string, AnalyticsEventRecord> = new Map();

export interface AnalyticsEventRecord {
  event_id: string;
  user_id?: string | null;
  product_id: string;
  event_type: "PRODUCT_VIEW" | "PRODUCT_CLICK" | "PRODUCT_SAVE" | "PRODUCT_UNSAVE" | "ADD_TO_CART" | "ORDER_PLACED" | string;
  metadata?: any;
  created_at: string;
}

export interface ProductAnalyticsSummary {
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
  production_cost?: number;
  profit?: number;
  conversion_rate: string;
  save_rate: string;
}

export interface ArtisanAnalyticsResult {
  total_views: number;
  total_products: number;
  total_orders: number;
  total_units_sold: number;
  total_revenue: number;
  total_production_cost?: number;
  total_profit?: number;
  total_saves: number;
  total_cart_additions: number;
  total_clicks: number;
  save_rate: string;
  conversion_rate: string;
  products: ProductAnalyticsSummary[];
  top_products: ProductAnalyticsSummary[];
  time_series: Array<{
    date: string;
    views: number;
    orders: number;
    revenue: number;
    amount: number;
  }>;
  custom_requests: Array<{
    title: string;
    description: string;
    count: number;
    price_tag: string;
  }>;
}

// ====================================================================
// Authentication & User Identity Helpers
// ====================================================================

const verifiedTokenCache = new Map<string, { userId: string; expiresAt: number }>();

/**
 * Extracts the authenticated user_id from the incoming HTTP request.
 * Reads Authorization: Bearer <token> and validates against Supabase Auth.
 * Then ensures that the user exists in public.users.
 */
export async function extractUserIdFromRequest(req: any): Promise<string | null> {
  const authHeader = req.headers?.["authorization"] || req.headers?.["Authorization"];
  const supabase = getSupabaseClient();

  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return null;

    // Check in-memory cache of verified tokens to avoid roundtrips
    const cached = verifiedTokenCache.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.userId;
    }

    if (supabase && token) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          // Cache verified token for 60 seconds
          verifiedTokenCache.set(token, { userId: user.id, expiresAt: Date.now() + 60_000 });

          // Ensure the user exists in public.users
          const { data: existingUser } = await supabase
            .from("users")
            .select("user_id, role")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!existingUser) {
            const role = (user.user_metadata?.role as string) || "artisan";
            const derivedName =
              (user.user_metadata?.name as string) ||
              (user.user_metadata?.full_name as string) ||
              user.email?.split("@")[0] ||
              "User";
            await supabase.from("users").insert({
              user_id: user.id,
              name: derivedName,
              email: user.email || "",
              phone: (user.user_metadata?.phone as string) || "",
              role,
              language: (user.user_metadata?.language as string) || (role === "artisan" ? "hi" : "en"),
            });
          }

          return user.id;
        }
      } catch (authErr) {
        console.warn("[Auth] Failed to verify Supabase bearer token:", authErr);
      }
    }

    // Decode JWT payload fallback (if Supabase Auth endpoint had network/timeout failure)
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadStr = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadStr);
        if (payload && typeof payload.sub === "string" && payload.sub.length >= 8) {
          return payload.sub;
        }
      }
    } catch {}
  }

  // Fallback to explicit client identity headers or query/body parameters
  const headerId =
    req.headers?.["x-user-id"] ||
    req.headers?.["x-artisan-id"] ||
    req.headers?.["x-buyer-id"] ||
    req.headers?.["x-user_id"] ||
    req.headers?.["x-artisan_id"];
  if (headerId && typeof headerId === "string" && headerId.trim().length > 0) {
    return headerId.trim();
  }

  const queryId = req.query?.user_id || req.query?.artisan_id || req.query?.buyer_id;
  if (queryId && typeof queryId === "string" && queryId.trim().length > 0) {
    return queryId.trim();
  }

  const bodyId = req.body?.user_id || req.body?.artisan_id || req.body?.buyer_id;
  if (bodyId && typeof bodyId === "string" && bodyId.trim().length > 0) {
    return bodyId.trim();
  }

  return null;
}

/**
 * Extracts the authenticated artisan user_id from the incoming HTTP request.
 */
export async function extractArtisanIdFromRequest(req: any): Promise<string | null> {
  return extractUserIdFromRequest(req);
}

/**
 * Deprecated: Default demo sessions are disabled.
 * Authenticated endpoints require a real Supabase Auth Bearer token.
 */
export async function getOrCreateDefaultArtisanSession(): Promise<{ user: UserRecord; token: string }> {
  throw new Error("Default demo artisan session is disabled. Please authenticate with Supabase Auth.");
}

export async function getOrCreateDefaultBuyerSession(): Promise<{ user: UserRecord; token: string }> {
  throw new Error("Default demo buyer session is disabled. Please authenticate with Supabase Auth.");
}

// ====================================================================
// USERS / ARTISANS Services (public.users)
// ====================================================================

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return inMemoryUsers.get(userId) || null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapUserDbRowToRecord(data);
}

export async function getArtisanById(userId: string): Promise<UserRecord | null> {
  return getUserById(userId);
}

export async function createArtisan(input: Partial<UserRecord> & { id?: string }): Promise<UserRecord> {
  const userId = input.user_id || input.id;
  if (!userId) {
    throw new Error("user_id is required to create a user");
  }

  const userData = {
    user_id: userId,
    name: String(input.name || "Master Artisan").trim(),
    email: input.email ? String(input.email).trim().toLowerCase() : null,
    phone: input.phone ? String(input.phone).trim() : null,
    role: input.role || "artisan",
    language: input.language || "en",
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const record = { ...userData, id: userId };
    inMemoryUsers.set(userId, record);
    return record;
  }

  const { data, error } = await supabase
    .from("users")
    .upsert([userData], { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create/upsert artisan user in database: ${error.message}`);
  }

  return mapUserDbRowToRecord(data);
}

export async function updateArtisan(userId: string, input: Partial<UserRecord>): Promise<UserRecord> {
  const existing = await getArtisanById(userId);
  if (!existing) {
    throw new Error(`Artisan user with ID "${userId}" not found`);
  }

  const updatePayload: any = {};
  if (input.name) updatePayload.name = String(input.name).trim();
  if (input.email !== undefined) updatePayload.email = input.email ? String(input.email).trim().toLowerCase() : null;
  if (input.phone !== undefined) updatePayload.phone = input.phone ? String(input.phone).trim() : null;
  if (input.role) updatePayload.role = input.role;
  if (input.language) updatePayload.language = input.language;

  const supabase = getSupabaseClient();
  if (!supabase) {
    const updated = { ...existing, ...updatePayload };
    inMemoryUsers.set(userId, updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update artisan user in database: ${error.message}`);
  }

  return mapUserDbRowToRecord(data);
}

// ====================================================================
// PRODUCTS Services (public.products)
// ====================================================================

export interface GetProductsFilter {
  artisan_id?: string;
  category?: string;
  status?: "draft" | "published" | "archived" | "all";
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getProducts(filter: GetProductsFilter = {}): Promise<ProductRecord[]> {
  const supabase = getSupabaseClient();
  const limit = Math.min(filter.limit || 50, 100);
  const offset = filter.offset || 0;

  if (!supabase) {
    let items = Array.from(inMemoryProducts.values());
    if (filter.artisan_id) {
      items = items.filter((p) => p.artisan_id === filter.artisan_id);
    }
    if (filter.category && filter.category !== "all") {
      items = items.filter((p) => p.category.toLowerCase() === filter.category?.toLowerCase());
    }
    if (filter.status && filter.status !== "all") {
      items = items.filter((p) => p.status === filter.status);
    } else if (!filter.artisan_id) {
      items = items.filter((p) => p.status === "published");
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return items.slice(offset, offset + limit);
  }

  let query = supabase
    .from("products")
    .select("*, product_images(*), users(*), pricing(*), marketplace_listings(*)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.artisan_id) {
    query = query.eq("artisan_id", filter.artisan_id);
  }
  if (filter.category && filter.category !== "all") {
    query = query.eq("category", filter.category.toLowerCase());
  }
  if (filter.status && filter.status !== "all") {
    query = query.eq("status", filter.status);
  } else if (!filter.artisan_id) {
    query = query.eq("status", "published");
  }
  if (filter.search) {
    query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to query products from Supabase: ${error.message}`);
  }

  return (data || []).map((row: any) => mapProductDbRowToRecord(row));
}

export async function getProductById(productId: string): Promise<ProductRecord | null> {
  if (!productId || typeof productId !== "string") return null;

  // 1. Check in-memory products map first
  const prod = inMemoryProducts.get(productId);
  if (prod) {
    const imgs = Array.from(inMemoryProductImages.values()).filter((img) => img.product_id === productId);
    const artisan = inMemoryUsers.get(prod.artisan_id) || null;
    const pricing = Array.from(inMemoryPricing.values()).find((p) => p.product_id === productId) || null;
    const marketplace_listings = Array.from(inMemoryMarketplaceListings.values()).filter((m) => m.product_id === productId);
    return {
      ...prod,
      images: prod.images && prod.images.length > 0 ? prod.images : imgs,
      artisan: prod.artisan || artisan,
      pricing: prod.pricing || pricing,
      marketplace_listings: prod.marketplace_listings && prod.marketplace_listings.length > 0 ? prod.marketplace_listings : marketplace_listings,
    };
  }

  // 2. Check seed products catalog (e.g. prod-1 through prod-6)
  const seed = getSeedProductRecord(productId);
  if (seed) {
    return seed;
  }

  // 3. If ID is not a valid UUID, it cannot exist in Supabase products table (Postgres UUID column)
  if (!isValidUuid(productId)) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_images(*), users(*), pricing(*), marketplace_listings(*)")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.warn(`[getProductById] Supabase lookup notice for ${productId}:`, error.message);
      return null;
    }
    if (!data) {
      return null;
    }

    return mapProductDbRowToRecord(data);
  } catch (err: any) {
    console.warn(`[getProductById] Exception fetching product ${productId}:`, err?.message || err);
    return null;
  }
}

export async function createProduct(input: Partial<ProductRecord>): Promise<ProductRecord> {
  if (!input.artisan_id) {
    throw new Error("artisan_id is required to create a product");
  }
  if (!input.title || String(input.title).trim().length === 0) {
    throw new Error("Product title is required");
  }
  if (!input.category || String(input.category).trim().length === 0) {
    throw new Error("Product category is required");
  }

  const price = typeof input.price === "number" ? Math.max(0, input.price) : 0;
  const stock = typeof input.stock === "number" ? Math.max(0, Math.floor(input.stock)) : 1;
  const status = input.status === "published" ? "published" : input.status === "archived" ? "archived" : "draft";

  if (status === "published" && price <= 0) {
    throw new Error("Published products must have a retail price greater than 0");
  }

  const now = new Date().toISOString();
  const productId = (input.product_id && isValidUuid(input.product_id))
    ? input.product_id
    : (input.id && isValidUuid(input.id))
    ? input.id
    : crypto.randomUUID();

  const productDbPayload: ProductDbRow = {
    product_id: productId,
    artisan_id: input.artisan_id,
    title: String(input.title).trim(),
    description: input.description ? String(input.description).trim() : "",
    category: String(input.category).trim().toLowerCase(),
    subcategory: (input.subcategory || input.sub_category || "").trim() || null,
    materials: Array.isArray(input.materials) ? input.materials : [],
    specifications: Array.isArray(input.specifications) ? input.specifications : [],
    dimensions: input.dimensions ? String(input.dimensions).trim() : null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    price,
    stock,
    status,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const record = mapProductDbRowToRecord(productDbPayload);
    inMemoryProducts.set(productId, record);
    return record;
  }

  const { data, error } = await supabase
    .from("products")
    .insert([productDbPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product in Supabase: ${error.message}`);
  }

  return mapProductDbRowToRecord(data);
}

export async function updateProduct(
  productId: string,
  input: Partial<ProductRecord> & { imageUrl?: string; image_url?: string },
  expectedArtisanId?: string
): Promise<ProductRecord> {
  let existing = await getProductById(productId);
  const now = new Date().toISOString();

  // If product not found in DB or in-memory, auto-create/seed it so stock and edits persist
  if (!existing) {
    const fallbackArtisanId = expectedArtisanId || "artisan-user";
    const title = input.title ? String(input.title).trim() : "Handcrafted Artisan Craft";
    const category = input.category ? String(input.category).trim().toLowerCase() : "pottery";
    const price = typeof input.price === "number" ? Math.max(0, input.price) : 1200;
    const stock = typeof input.stock === "number" ? Math.max(0, input.stock) : 10;
    const imageUrl = input.image_url || input.imageUrl;

    try {
      const created = await createProduct({
        id: productId,
        product_id: productId,
        artisan_id: fallbackArtisanId,
        title,
        category,
        price,
        stock,
        status: input.status || "published",
        description: input.description,
        materials: input.materials,
        tags: input.tags,
        dimensions: input.dimensions,
      });

      if (imageUrl) {
        await addProductImage(created.product_id, {
          image_url: imageUrl,
          image_type: "original",
          is_primary: true,
        }).catch(() => {});
      }

      inMemoryProducts.set(productId, created);
      return created;
    } catch (createErr) {
      console.warn(`[updateProduct] Auto-seed fallback for ${productId}:`, createErr);
    }
  }

  const updatePayload: any = { updated_at: now };

  if (expectedArtisanId && existing?.artisan_id && existing.artisan_id !== expectedArtisanId) {
    if (
      existing.artisan_id.startsWith("demo-") ||
      existing.artisan_id.startsWith("artisan-") ||
      existing.artisan_id === "seed-artisan" ||
      existing.artisan_id === "artisan-user"
    ) {
      updatePayload.artisan_id = expectedArtisanId;
    }
  }

  if (input.title) updatePayload.title = String(input.title).trim();
  if (input.description !== undefined) updatePayload.description = input.description ? String(input.description).trim() : "";
  if (input.category) updatePayload.category = String(input.category).trim().toLowerCase();
  if (input.subcategory !== undefined || input.sub_category !== undefined) {
    updatePayload.subcategory = (input.subcategory || input.sub_category || "").trim() || null;
  }
  if (Array.isArray(input.materials)) updatePayload.materials = input.materials;
  if (Array.isArray(input.specifications)) updatePayload.specifications = input.specifications;
  if (input.dimensions !== undefined) updatePayload.dimensions = input.dimensions ? String(input.dimensions).trim() : null;
  if (Array.isArray(input.tags)) updatePayload.tags = input.tags;
  if (typeof input.price === "number") {
    if (input.price < 0) throw new Error("Price cannot be negative");
    updatePayload.price = input.price;
  }
  if (typeof input.stock === "number") {
    if (input.stock < 0) throw new Error("Stock count cannot be negative");
    updatePayload.stock = input.stock;
  }
  if (input.status) updatePayload.status = input.status;

  const supabase = getSupabaseClient();
  if (!supabase) {
    const updated = { ...(existing || {}), ...updatePayload, product_id: productId };
    inMemoryProducts.set(productId, updated as any);
    return updated as any;
  }

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("product_id", productId)
    .select("*, product_images(*), users(*), pricing(*), marketplace_listings(*)")
    .single();

  if (error) {
    // If update failed because record not found in Supabase (e.g. was in-memory or custom ID)
    if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
      const fallbackArtisanId = expectedArtisanId || existing?.artisan_id || "artisan-user";
      const created = await createProduct({
        id: productId,
        product_id: productId,
        artisan_id: fallbackArtisanId,
        title: updatePayload.title || existing?.title || "Handcrafted Craft",
        category: updatePayload.category || existing?.category || "pottery",
        price: updatePayload.price !== undefined ? updatePayload.price : existing?.price || 1000,
        stock: updatePayload.stock !== undefined ? updatePayload.stock : existing?.stock || 10,
        status: updatePayload.status || existing?.status || "published",
        description: updatePayload.description || existing?.description,
      });
      inMemoryProducts.set(productId, created);
      return created;
    }
    throw new Error(`Failed to update product in Supabase: ${error.message}`);
  }

  const resultRecord = mapProductDbRowToRecord(data);
  inMemoryProducts.set(productId, resultRecord);
  return resultRecord;
}

export async function deleteProduct(productId: string, expectedArtisanId?: string): Promise<boolean> {
  const existing = await getProductById(productId);
  if (!existing) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  if (expectedArtisanId && existing.artisan_id !== expectedArtisanId) {
    throw new Error("Unauthorized: You do not have permission to delete this product");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    inMemoryProducts.delete(productId);
    for (const [imgId, img] of inMemoryProductImages.entries()) {
      if (img.product_id === productId) inMemoryProductImages.delete(imgId);
    }
    for (const [prId, pr] of inMemoryPricing.entries()) {
      if (pr.product_id === productId) inMemoryPricing.delete(prId);
    }
    for (const [mktId, mkt] of inMemoryMarketplaceListings.entries()) {
      if (mkt.product_id === productId) inMemoryMarketplaceListings.delete(mktId);
    }
    return true;
  }

  // Delete related child rows
  await supabase.from("marketplace_listings").delete().eq("product_id", productId);
  await supabase.from("pricing").delete().eq("product_id", productId);
  await supabase.from("product_images").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("product_id", productId);
  if (error) {
    throw new Error(`Failed to delete product from Supabase: ${error.message}`);
  }

  return true;
}

export async function setProductPublishStatus(
  productId: string,
  status: "published" | "draft" | "archived",
  expectedArtisanId?: string
): Promise<ProductRecord> {
  return updateProduct(productId, { status }, expectedArtisanId);
}

// ====================================================================
// PRODUCT IMAGES Services (public.product_images)
// NOTE: Column is_primary DOES NOT exist in DB table.
// ====================================================================

export async function addProductImage(
  productId: string,
  input: {
    image_url: string;
    image_type?: "original" | "enhanced" | "gallery" | "thumbnail";
    is_primary?: boolean;
    id?: string;
  },
  expectedArtisanId?: string
): Promise<ProductImageRecord> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  if (expectedArtisanId && product.artisan_id !== expectedArtisanId) {
    throw new Error("Unauthorized: You do not have permission to add images to this product");
  }

  if (!input.image_url || String(input.image_url).trim().length === 0) {
    throw new Error("image_url is required");
  }

  const imageId = (input.id && isValidUuid(input.id)) ? input.id : crypto.randomUUID();
  const imageDbPayload: ProductImageDbRow = {
    image_id: imageId,
    product_id: productId,
    image_url: input.image_url,
    image_type: input.image_type || "original",
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const record: ProductImageRecord = { ...imageDbPayload, id: imageId, is_primary: Boolean(input.is_primary) };
    inMemoryProductImages.set(imageId, record);
    return record;
  }

  const { data, error } = await supabase
    .from("product_images")
    .insert([imageDbPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add product image in Supabase: ${error.message}`);
  }

  return {
    image_id: data.image_id,
    id: data.image_id,
    product_id: data.product_id,
    image_url: data.image_url,
    image_type: data.image_type,
    created_at: data.created_at,
    is_primary: Boolean(input.is_primary),
  };
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  expectedArtisanId?: string
): Promise<boolean> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  if (expectedArtisanId && product.artisan_id !== expectedArtisanId) {
    throw new Error("Unauthorized: You do not have permission to delete images for this product");
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    inMemoryProductImages.delete(imageId);
    return true;
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("image_id", imageId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Failed to delete product image from Supabase: ${error.message}`);
  }

  return true;
}

export async function uploadProductImageToStorage(params: {
  artisanId: string;
  productId: string;
  imageBufferOrBase64: Buffer | string;
  imageType: "original" | "enhanced" | "gallery" | "thumbnail";
  contentType?: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const { artisanId, productId, imageBufferOrBase64, imageType } = params;
  const defaultMime = imageType === "enhanced" ? "image/png" : "image/jpeg";
  let mime = params.contentType || defaultMime;
  let buffer: Buffer;
  let base64String: string;

  if (typeof imageBufferOrBase64 === "string") {
    let clean = imageBufferOrBase64.trim();
    if (clean.includes(";base64,")) {
      const parts = clean.split(";base64,");
      const header = parts[0];
      clean = parts[1];
      if (header.startsWith("data:")) {
        mime = header.replace("data:", "").split(";")[0] || mime;
      }
    } else if (clean.startsWith("data:")) {
      const commaIdx = clean.indexOf(",");
      if (commaIdx > -1) {
        const header = clean.substring(0, commaIdx);
        mime = header.replace("data:", "").split(";")[0] || mime;
        clean = clean.substring(commaIdx + 1);
      }
    }
    base64String = clean;
    buffer = Buffer.from(clean, "base64");
  } else {
    buffer = imageBufferOrBase64;
    base64String = buffer.toString("base64");
  }

  const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
  const filename = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const storagePath = `${artisanId}/${productId}/${imageType}/${filename}`;

  const supabase = getSupabaseClient();
  if (!supabase) {
    const dataUrl = `data:${mime};base64,${base64String}`;
    return { storagePath, publicUrl: dataUrl };
  }

  const bucket = "product-images";

  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: mime,
        cacheControl: "31536000, immutable",
        upsert: true,
      });

    if (uploadError) {
      const isBucketNotFound =
        uploadError.message?.toLowerCase().includes("bucket not found") ||
        (uploadError as any).statusCode === "404" ||
        (uploadError as any).error === "Bucket not found";

      if (isBucketNotFound) {
        try {
          const { error: createErr } = await supabase.storage.createBucket(bucket, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/jpg", "image/gif"],
          });

          if (!createErr) {
            const { error: retryError } = await supabase.storage
              .from(bucket)
              .upload(storagePath, buffer, {
                contentType: mime,
                cacheControl: "31536000, immutable",
                upsert: true,
              });

            if (!retryError) {
              const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
              return {
                storagePath,
                publicUrl: publicUrlData.publicUrl,
              };
            }
          }
        } catch (createErr) {
          // Fall through to fallback data URL
        }
      }

      // If storage bucket is not available, fall back to high-quality data URL
      const dataUrl = `data:${mime};base64,${base64String}`;
      return {
        storagePath,
        publicUrl: dataUrl,
      };
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    return {
      storagePath,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (err) {
    const dataUrl = `data:${mime};base64,${base64String}`;
    return {
      storagePath,
      publicUrl: dataUrl,
    };
  }
}

// ====================================================================
// PRICING Services (public.pricing)
// NOTE: retail_price & mrp DO NOT exist in pricing table.
// Product selling price is in products.price.
// ====================================================================

export async function getPricingByProductId(productId: string): Promise<PricingRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return Array.from(inMemoryPricing.values()).find((p) => p.product_id === productId) || null;
  }

  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    id: data.pricing_id,
    other_costs: data.other_cost,
  };
}

export async function createOrUpdatePricing(
  productId: string,
  input: any,
  expectedArtisanId?: string
): Promise<PricingRecord> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  if (expectedArtisanId && product.artisan_id !== expectedArtisanId) {
    throw new Error("Unauthorized: You do not have permission to set pricing for this product");
  }

  const now = new Date().toISOString();
  const existingPricing = await getPricingByProductId(productId);
  const pricingId = existingPricing?.pricing_id || (input.id && isValidUuid(input.id) ? input.id : crypto.randomUUID());

  // Cost decomposition
  const material_cost = typeof input.material_cost === "number"
    ? input.material_cost
    : typeof input.cost_breakdown?.raw_materials === "number"
    ? input.cost_breakdown.raw_materials
    : null;

  const labour_cost = typeof input.labour_cost === "number"
    ? input.labour_cost
    : typeof input.cost_breakdown?.fair_hourly_wage === "number"
    ? Math.round(input.cost_breakdown.fair_hourly_wage * (input.cost_breakdown?.crafting_hours || 4))
    : null;

  const packaging_cost = typeof input.packaging_cost === "number"
    ? input.packaging_cost
    : typeof input.cost_breakdown?.logistics === "number"
    ? input.cost_breakdown.logistics
    : null;

  const other_cost = typeof input.other_cost === "number"
    ? input.other_cost
    : typeof input.other_costs === "number"
    ? input.other_costs
    : typeof input.cost_breakdown?.marketplace_fee === "number"
    ? input.cost_breakdown.marketplace_fee
    : null;

  const market_estimate = typeof input.market_estimate === "number"
    ? input.market_estimate
    : null;

  const minimum_viable_price = typeof input.minimum_viable_price === "number"
    ? input.minimum_viable_price
    : null;

  const recommended_price = typeof input.recommended_price === "number"
    ? input.recommended_price
    : typeof input.fair_price === "number"
    ? input.fair_price
    : typeof input.retail_price === "number"
    ? input.retail_price
    : product.price;

  let margin_percent = typeof input.margin_percent === "number" ? input.margin_percent : null;
  if (margin_percent === null && recommended_price > 0) {
    const totalCost = (material_cost || 0) + (labour_cost || 0) + (packaging_cost || 0) + (other_cost || 0);
    if (totalCost > 0 && recommended_price > totalCost) {
      margin_percent = Math.round(((recommended_price - totalCost) / recommended_price) * 100);
    }
  }

  const pricingDbPayload: PricingDbRow = {
    pricing_id: pricingId,
    product_id: productId,
    material_cost,
    labour_cost,
    packaging_cost,
    other_cost,
    market_estimate,
    minimum_viable_price,
    recommended_price,
    margin_percent,
    created_at: existingPricing?.created_at || now,
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const record: PricingRecord = {
      ...pricingDbPayload,
      id: pricingId,
      other_costs: other_cost,
      retail_price: recommended_price,
    };
    inMemoryPricing.set(pricingId, record);
    return record;
  }

  if (existingPricing) {
    const { data, error } = await supabase
      .from("pricing")
      .update(pricingDbPayload)
      .eq("pricing_id", existingPricing.pricing_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update pricing in Supabase: ${error.message}`);
    }
    return {
      ...data,
      id: data.pricing_id,
      other_costs: data.other_cost,
      retail_price: recommended_price,
    };
  }

  const { data, error } = await supabase
    .from("pricing")
    .insert([pricingDbPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pricing in Supabase: ${error.message}`);
  }

  return {
    ...data,
    id: data.pricing_id,
    other_costs: data.other_cost,
    retail_price: recommended_price,
  };
}

// ====================================================================
// MARKETPLACE LISTINGS Services (public.marketplace_listings)
// NOTE: listing_price, listing_url, metadata DO NOT exist in table.
// ====================================================================

export async function getMarketplaceListingsByProductId(productId: string): Promise<MarketplaceListingRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return Array.from(inMemoryMarketplaceListings.values()).filter((m) => m.product_id === productId);
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch marketplace listings from Supabase: ${error.message}`);
  }

  return (data || []).map((m: any) => ({
    ...m,
    id: m.listing_id,
    platform: m.marketplace,
    listing_title: m.title,
  }));
}

export async function createMarketplaceListing(
  productId: string,
  input: any,
  expectedArtisanId?: string
): Promise<MarketplaceListingRecord> {
  const product = await getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID "${productId}" not found`);
  }

  if (expectedArtisanId && product.artisan_id !== expectedArtisanId) {
    throw new Error("Unauthorized: You do not have permission to add marketplace listings for this product");
  }

  const marketplaceName = input.marketplace || input.platform;
  if (!marketplaceName || String(marketplaceName).trim().length === 0) {
    throw new Error("marketplace is required (e.g. 'artisan_direct', 'kalasetu', 'ondc', 'amazon')");
  }

  const listingId = (input.id && isValidUuid(input.id)) ? input.id : crypto.randomUUID();
  const now = new Date().toISOString();

  const listingDbPayload: MarketplaceListingDbRow = {
    listing_id: listingId,
    product_id: productId,
    marketplace: String(marketplaceName).toLowerCase().trim(),
    title: String(input.title || input.listing_title || product.title).trim(),
    description: input.description ? String(input.description).trim() : (product.description || ""),
    category: input.category ? String(input.category).trim() : product.category,
    tags: Array.isArray(input.tags) ? input.tags : (product.tags || []),
    listing_status: input.listing_status || (product.status === "published" ? "published" : "draft"),
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    const record: MarketplaceListingRecord = {
      ...listingDbPayload,
      id: listingId,
      platform: listingDbPayload.marketplace,
      listing_title: listingDbPayload.title,
    };
    inMemoryMarketplaceListings.set(listingId, record);
    return record;
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert([listingDbPayload])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create marketplace listing in Supabase: ${error.message}`);
  }

  return {
    ...data,
    id: data.listing_id,
    platform: data.marketplace,
    listing_title: data.title,
  };
}

// ====================================================================
// Full Publishing Orchestrator
// Connects product details -> images -> pricing -> marketplace listings
// ====================================================================

export interface SaveFullProductPayload {
  id?: string;
  artisan_id?: string;
  title: string;
  description?: string;
  category: string;
  category_label?: string;
  sub_category?: string;
  subcategory?: string;
  materials?: string[];
  specifications?: string[];
  dimensions?: string;
  tags?: string[];
  price: number;
  stock?: number;
  status?: "draft" | "published" | "archived";
  image_url?: string;
  images?: Array<{
    image_url?: string;
    image_base64?: string;
    image?: string;
    image_type?: "original" | "enhanced" | "gallery" | "thumbnail";
    is_primary?: boolean;
    id?: string;
  } | string>;
  pricing?: any;
  marketplace_listings?: Array<any>;
}

export async function saveFullProduct(
  payload: SaveFullProductPayload,
  callerArtisanId?: string
): Promise<ProductRecord> {
  const artisanId = callerArtisanId || payload.artisan_id;
  if (!artisanId || String(artisanId).trim().length === 0) {
    throw new Error("artisan_id is required to publish or save a product");
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    // 1. Validate authenticated artisan in public.users
    const existingUser = await getArtisanById(artisanId);
    if (!existingUser) {
      await createArtisan({
        user_id: artisanId,
        name: "Master Artisan",
        role: "artisan",
      });
    }
  }

  // 2. Save product to `products`
  const product = await createProduct({
    id: payload.id,
    product_id: payload.id,
    artisan_id: artisanId,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    subcategory: payload.subcategory || payload.sub_category,
    sub_category: payload.subcategory || payload.sub_category,
    materials: payload.materials,
    specifications: payload.specifications,
    dimensions: payload.dimensions,
    tags: payload.tags,
    price: payload.price,
    stock: typeof payload.stock === "number" ? payload.stock : 1,
    status: payload.status || "draft",
  });

  // 3. Save image(s) to `product_images`
  const imageList = Array.isArray(payload.images) && payload.images.length > 0
    ? payload.images
    : payload.image_url
    ? [{ image_url: payload.image_url, image_type: "original" as const, is_primary: true }]
    : [];

  for (let i = 0; i < imageList.length; i++) {
    const item = imageList[i];
    let imgUrl = typeof item === "string" ? item : item.image_url;
    const base64Data = typeof item === "object" ? item.image_base64 || item.image : undefined;
    const imgType = typeof item === "object" ? item.image_type || "original" : "original";
    const isPrimary = typeof item === "object" && item.is_primary !== undefined ? item.is_primary : i === 0;

    const isDataOrBase64 =
      (typeof imgUrl === "string" &&
        (imgUrl.startsWith("data:") ||
          (imgUrl.length > 300 && !imgUrl.startsWith("http")))) ||
      (!imgUrl && Boolean(base64Data));

    if (isDataOrBase64) {
      const dataToUpload =
        typeof imgUrl === "string" &&
        (imgUrl.startsWith("data:") || !imgUrl.startsWith("http"))
          ? imgUrl
          : base64Data;

      if (dataToUpload) {
        try {
          const mime =
            typeof dataToUpload === "string" && dataToUpload.startsWith("data:")
              ? dataToUpload.split(";")[0].replace("data:", "")
              : imgType === "enhanced"
              ? "image/png"
              : "image/jpeg";

          const uploaded = await uploadProductImageToStorage({
            artisanId,
            productId: product.product_id,
            imageBufferOrBase64: dataToUpload,
            imageType: imgType,
            contentType: mime,
          });
          imgUrl = uploaded.publicUrl;
        } catch (uploadErr) {
          console.warn("[saveFullProduct] Supabase storage upload warning:", uploadErr);
          imgUrl = dataToUpload;
        }
      }
    }

    if (imgUrl) {
      await addProductImage(
        product.product_id,
        {
          image_url: imgUrl,
          image_type: imgType,
          is_primary: isPrimary,
        },
        artisanId
      );
    }
  }

  // 4. Save pricing snapshot to `pricing`
  const pricingInput = payload.pricing || {};
  await createOrUpdatePricing(
    product.product_id,
    pricingInput,
    artisanId
  );

  // 5. Save marketplace listing templates to `marketplace_listings`
  if (Array.isArray(payload.marketplace_listings) && payload.marketplace_listings.length > 0) {
    for (const listing of payload.marketplace_listings) {
      const marketplaceName = listing.marketplace || listing.platform;
      if (marketplaceName) {
        await createMarketplaceListing(
          product.product_id,
          {
            marketplace: marketplaceName,
            listing_status: listing.listing_status || (payload.status === "published" ? "published" : "draft"),
            title: listing.listing_title || listing.title || product.title,
            description: listing.description || product.description || "",
            category: listing.category || product.category,
            tags: listing.tags || product.tags,
          },
          artisanId
        );
      }
    }
  }

  // 6. Return the complete saved product
  const fullProduct = await getProductById(product.product_id);
  return fullProduct || product;
}

// ====================================================================
// ORDERS & ORDER_ITEMS Services (Supabase PostgreSQL Foundation)
// ====================================================================

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  buyerId: string;
  items: OrderItemInput[];
  shippingAddress?: string;
}

export interface OrderRecord {
  order_id: string;
  buyer_id: string;
  artisan_id: string;
  total_amount: number;
  status: string;
  shipping_address?: string | null;
  created_at?: string;
  order_items?: any[];
  buyer?: any;
  artisan?: any;
  id?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const supabase = getSupabaseClient();
  const { buyerId, items, shippingAddress } = input;

  if (!buyerId) {
    const err: any = new Error("buyerId is required to create an order");
    err.status = 400;
    throw err;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const err: any = new Error("At least one product item is required");
    err.status = 400;
    throw err;
  }

  // 1. In offline fallback mode:
  if (!supabase) {
    const orderId = crypto.randomUUID();
    let total = 0;
    const orderItems: any[] = [];
    let artisanId: string | null = null;

    for (const item of items) {
      const prod = inMemoryProducts.get(item.product_id);
      if (!prod) {
        const err: any = new Error(`Product ${item.product_id} not found`);
        err.status = 404;
        throw err;
      }
      if (!prod.artisan_id) {
        const err: any = new Error(`Product "${prod.title}" has no associated artisan`);
        err.status = 400;
        throw err;
      }
      if (artisanId && artisanId !== prod.artisan_id) {
        const err: any = new Error("Multi-artisan checkout is not supported in a single order. Please order items from one artisan at a time.");
        err.status = 400;
        throw err;
      }
      artisanId = prod.artisan_id;

      const price = Number(prod.price) || 0;
      if (prod.stock < item.quantity) {
        const err: any = new Error(`Insufficient stock for product "${prod.title}". Available: ${prod.stock}, requested: ${item.quantity}`);
        err.status = 400;
        err.error_code = "INSUFFICIENT_STOCK";
        err.product_id = item.product_id;
        err.available_stock = Number(prod.stock);
        err.requested_quantity = item.quantity;
        throw err;
      }
      prod.stock -= item.quantity;
      total += price * (item.quantity || 1);
      const itemId = crypto.randomUUID();
      const orderItem = {
        order_item_id: itemId,
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        price,
        products: prod,
      };
      inMemoryOrderItems.set(itemId, orderItem);
      orderItems.push(orderItem);
    }

    if (!artisanId) {
      const err: any = new Error("No artisan owner found for the order products");
      err.status = 400;
      throw err;
    }

    const orderObj: OrderRecord = {
      order_id: orderId,
      id: orderId,
      buyer_id: buyerId,
      artisan_id: artisanId,
      total_amount: total,
      status: "pending",
      shipping_address: shippingAddress || "Shipping Address",
      created_at: new Date().toISOString(),
      order_items: orderItems,
      buyer: inMemoryUsers.get(buyerId) || { user_id: buyerId, name: "Buyer" },
      artisan: inMemoryUsers.get(artisanId) || { user_id: artisanId, name: "Artisan" },
    };
    inMemoryOrders.set(orderId, orderObj);

    // Remove ordered items from in-memory cart
    try {
      await removeOrderedItemsFromCart(
        buyerId,
        items.map((i: any) => i.product_id)
      );
    } catch (cartErr) {}

    // Record ORDER_PLACED analytics event for each ordered product
    for (const item of items) {
      try {
        await recordAnalyticsEvent({
          user_id: buyerId,
          product_id: item.product_id,
          event_type: "ORDER_PLACED",
          metadata: { order_id: orderId, quantity: item.quantity || 1 },
        });
      } catch (evErr) {}
    }

    return orderObj;
  }

  // 2. Online Supabase mode:
  // Validate products and stock
  const validatedItems: { product: any; quantity: number }[] = [];
  let totalAmount = 0;
  let artisanId: string | null = null;
  const productTitles: string[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("product_id", item.product_id)
      .maybeSingle();

    if (prodErr) {
      throw new Error(`Failed to query product ${item.product_id}: ${prodErr.message}`);
    }
    if (!product) {
      const err: any = new Error(`Product ${item.product_id} not found`);
      err.status = 404;
      throw err;
    }

    if (!product.artisan_id) {
      const err: any = new Error(`Product "${product.title}" has no associated artisan`);
      err.status = 400;
      throw err;
    }

    if (artisanId && artisanId !== product.artisan_id) {
      const err: any = new Error(
        "Multi-artisan checkout is not supported in a single order. Please order items from one artisan at a time."
      );
      err.status = 400;
      throw err;
    }
    artisanId = product.artisan_id;

    if (Number(product.stock) < qty) {
      const err: any = new Error(
        `Insufficient stock for "${product.title}". Requested: ${qty}, available: ${product.stock}`
      );
      err.status = 400;
      err.error_code = "INSUFFICIENT_STOCK";
      err.product_id = product.product_id;
      err.available_stock = Number(product.stock);
      err.requested_quantity = qty;
      throw err;
    }

    const currentPrice = Number(product.price) || 0;
    totalAmount += currentPrice * qty;
    productTitles.push(product.title);
    validatedItems.push({ product, quantity: qty });
  }

  if (!artisanId) {
    const err: any = new Error("No valid artisan owner found for the selected products");
    err.status = 400;
    throw err;
  }

  // Transaction-like safe sequence
  let createdOrderId: string | null = null;
  const updatedProductIds: { product_id: string; originalStock: number }[] = [];

  try {
    // Ensure buyer exists in public.users to satisfy foreign key constraint without collision
    await supabase.from("users").upsert(
      {
        user_id: buyerId,
        name: "Buyer",
        role: "buyer",
        language: "en",
      },
      { onConflict: "user_id" }
    );

    // Ensure artisan exists in public.users to satisfy foreign key constraint without collision
    await supabase.from("users").upsert(
      {
        user_id: artisanId,
        name: "Artisan",
        role: "artisan",
        language: "hi",
      },
      { onConflict: "user_id" }
    );

    // A. Insert order
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        buyer_id: buyerId,
        artisan_id: artisanId,
        total_amount: totalAmount,
        status: "pending",
        shipping_address: shippingAddress || "Cluster Direct Address",
      })
      .select()
      .single();

    if (orderErr || !newOrder) {
      const err: any = new Error(
        `Failed to create order in Supabase: ${orderErr?.message || "No data returned"} (Code: ${orderErr?.code || "UNKNOWN"})`
      );
      err.error_code = orderErr?.code || "ORDER_INSERT_FAILED";
      err.status = 500;
      throw err;
    }
    createdOrderId = newOrder.order_id;

    // B. Insert order_items
    const orderItemsToInsert = validatedItems.map(({ product, quantity }) => ({
      order_id: createdOrderId,
      product_id: product.product_id,
      quantity,
      price: Number(product.price),
    }));

    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItemsToInsert);

    if (itemsErr) {
      const err: any = new Error(
        `Failed to create order items in Supabase: ${itemsErr.message} (Code: ${itemsErr.code})`
      );
      err.error_code = itemsErr.code || "ORDER_ITEMS_INSERT_FAILED";
      err.status = 500;
      throw err;
    }

    // C. Decrement product stock
    for (const { product, quantity } of validatedItems) {
      const originalStock = Number(product.stock);
      updatedProductIds.push({ product_id: product.product_id, originalStock });
      const newStock = Math.max(0, originalStock - quantity);

      const { error: stockErr } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("product_id", product.product_id);

      if (stockErr) {
        const err: any = new Error(
          `Failed to update stock in Supabase for product ${product.product_id}: ${stockErr.message} (Code: ${stockErr.code})`
        );
        err.error_code = stockErr.code || "STOCK_UPDATE_FAILED";
        err.status = 500;
        throw err;
      }
    }

    // D. Create notification for artisan
    try {
      await supabase.from("notifications").insert({
        user_id: artisanId,
        title: "New Order Received",
        message: `You received a new order #${createdOrderId.slice(0, 8)} for ${productTitles.slice(0, 2).join(", ")} (Total: ₹${totalAmount.toLocaleString()}).`,
        type: "new_order",
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Notifications] Failed to create artisan notification:", notifErr);
    }

    // E. Clear ordered items from the buyer's persistent cart
    try {
      await removeOrderedItemsFromCart(
        buyerId,
        items.map((i: any) => i.product_id)
      );
    } catch (cartErr) {
      console.warn("[Orders] Failed to clear ordered items from cart:", cartErr);
    }

    // F. Record ORDER_PLACED analytics event for each ordered product
    for (const item of items) {
      try {
        await recordAnalyticsEvent({
          user_id: buyerId,
          product_id: item.product_id,
          event_type: "ORDER_PLACED",
          metadata: { order_id: createdOrderId, quantity: item.quantity || 1 },
        });
      } catch (evErr) {}
    }

    // G. Return complete order with joined relations (guarded so read issues do not rollback an already committed order)
    try {
      const fullOrder = await getOrderById(createdOrderId, buyerId);
      if (fullOrder) return fullOrder;
    } catch (enrichErr) {
      console.warn("[Orders] Non-fatal order relation enrichment notice:", enrichErr);
    }

    return {
      ...newOrder,
      id: newOrder.order_id,
      order_items: orderItemsToInsert,
      items: orderItemsToInsert,
    };
  } catch (error: any) {
    // Rollback safely if initial inserts failed
    if (createdOrderId) {
      try {
        await supabase.from("order_items").delete().eq("order_id", createdOrderId);
        await supabase.from("orders").delete().eq("order_id", createdOrderId);
      } catch (cleanupErr) {
        console.warn("[Orders] Rollback cleanup failed:", cleanupErr);
      }
    }
    for (const { product_id, originalStock } of updatedProductIds) {
      try {
        await supabase.from("products").update({ stock: originalStock }).eq("product_id", product_id);
      } catch (revertErr) {
        console.warn("[Orders] Rollback stock revert failed:", revertErr);
      }
    }
    throw error;
  }
}

/**
 * Helper to batch-enrich orders with their order_items, products, product_images, and users.
 * Avoids deeply nested PostgREST joins that trigger statement timeouts.
 * Uses batch .in(...) queries to strictly avoid N+1 query loops.
 */
async function enrichOrdersWithRelations(supabase: any, rawOrders: any[]): Promise<OrderRecord[]> {
  if (!rawOrders || rawOrders.length === 0) {
    return [];
  }

  // STEP 2: Fetch order_items for those order IDs
  const orderIds = rawOrders.map((o) => o.order_id).filter(Boolean);
  const { data: rawOrderItems, error: itemsErr } = await supabase
    .from("order_items")
    .select("order_item_id, order_id, product_id, quantity, price")
    .in("order_id", orderIds);

  if (itemsErr) {
    console.error("[Orders API] order_items query failed:", itemsErr);
    const err: any = new Error(`[Orders API] order_items query failed: ${itemsErr.message}`);
    err.status = 500;
    throw err;
  }

  const orderItemsList = rawOrderItems || [];

  // Collect unique product IDs and user IDs
  const productIds = Array.from(
    new Set(orderItemsList.map((item) => item.product_id).filter(Boolean))
  );

  const userIds = Array.from(
    new Set(
      [
        ...rawOrders.map((o) => o.buyer_id),
        ...rawOrders.map((o) => o.artisan_id),
      ].filter(Boolean)
    )
  );

  // STEP 3: Fetch products, images, and users in parallel for minimal latency
  const [prodsResult, imagesResult, usersResult] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("products")
          .select("product_id, artisan_id, title, category, price, stock, status")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] }),
    productIds.length > 0
      ? supabase
          .from("product_images")
          .select("image_id, product_id, image_url")
          .in("product_id", productIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase
          .from("users")
          .select("user_id, name, email, phone, role")
          .in("user_id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  if (prodsResult.error) {
    console.error("[Orders API] products query failed:", prodsResult.error);
    const err: any = new Error(`[Orders API] products query failed: ${prodsResult.error.message}`);
    err.status = 500;
    throw err;
  }

  const productsMap = new Map<string, any>();
  for (const prod of prodsResult.data || []) {
    productsMap.set(prod.product_id, prod);
  }

  const imagesByProductId = new Map<string, any[]>();
  for (const img of imagesResult.data || []) {
    const list = imagesByProductId.get(img.product_id) || [];
    list.push({
      id: img.image_id,
      image_id: img.image_id,
      product_id: img.product_id,
      image_url: img.image_url,
      is_primary: list.length === 0,
    });
    imagesByProductId.set(img.product_id, list);
  }

  const usersMap = new Map<string, any>();
  for (const u of usersResult.data || []) {
    usersMap.set(u.user_id, u);
  }

  // Attach images to products
  for (const [prodId, prod] of productsMap.entries()) {
    const images = imagesByProductId.get(prodId) || [];
    productsMap.set(prodId, {
      ...prod,
      id: prod.product_id,
      product_images: images,
      images,
    });
  }

  // Group items by order_id
  const itemsByOrderId = new Map<string, any[]>();
  for (const it of orderItemsList) {
    const product = productsMap.get(it.product_id) || null;
    const assembledItem = {
      order_item_id: it.order_item_id,
      id: it.order_item_id,
      order_id: it.order_id,
      product_id: it.product_id,
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      created_at: it.created_at,
      product,
      products: product,
    };
    const list = itemsByOrderId.get(it.order_id) || [];
    list.push(assembledItem);
    itemsByOrderId.set(it.order_id, list);
  }

  // Assemble final orders array
  return rawOrders.map((ord) => {
    const items = itemsByOrderId.get(ord.order_id) || [];
    const buyer = usersMap.get(ord.buyer_id) || null;
    const artisan = usersMap.get(ord.artisan_id) || null;

    return {
      order_id: ord.order_id,
      id: ord.order_id,
      buyer_id: ord.buyer_id,
      artisan_id: ord.artisan_id,
      total_amount: Number(ord.total_amount) || 0,
      status: ord.status,
      shipping_address: ord.shipping_address,
      created_at: ord.created_at,
      order_items: items,
      items,
      buyer,
      artisan,
    } as OrderRecord;
  });
}

export async function getOrdersForUser(
  userId: string,
  roleHint?: string,
  options?: { page?: number; limit?: number }
): Promise<OrderRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const all = Array.from(inMemoryOrders.values()).filter(
      (o) => o.artisan_id === userId || o.buyer_id === userId
    );
    const safePage = Math.max(1, Number(options?.page) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number(options?.limit) || 20));
    const fromOffset = (safePage - 1) * safeLimit;
    return all.slice(fromOffset, fromOffset + safeLimit);
  }

  let role = roleHint;
  if (!role) {
    const user = await getUserById(userId);
    role = user?.role || "artisan";
  }

  // STEP 1: Fetch the authenticated user's orders using only the required order fields
  const safePage = Math.max(1, Number(options?.page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(options?.limit) || 20));
  const fromOffset = (safePage - 1) * safeLimit;
  const toOffset = fromOffset + safeLimit - 1;

  let query = supabase
    .from("orders")
    .select("order_id, buyer_id, artisan_id, total_amount, status, shipping_address, created_at")
    .order("created_at", { ascending: false })
    .range(fromOffset, toOffset);

  if (role === "artisan") {
    query = query.eq("artisan_id", userId);
  } else {
    query = query.eq("buyer_id", userId);
  }

  const { data: rawOrders, error: ordersErr } = await query;
  if (ordersErr) {
    console.error("[Orders API] orders query failed:", ordersErr);
    const err: any = new Error(`[Orders API] orders query failed: ${ordersErr.message}`);
    err.status = 500;
    throw err;
  }

  if (!rawOrders || rawOrders.length === 0) {
    return [];
  }

  return await enrichOrdersWithRelations(supabase, rawOrders);
}

export async function getOrderById(orderId: string, authenticatedUserId: string): Promise<OrderRecord | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    const order = inMemoryOrders.get(orderId);
    if (!order) return null;
    if (order.buyer_id !== authenticatedUserId && order.artisan_id !== authenticatedUserId) {
      const err: any = new Error("You are not authorized to view this order");
      err.status = 403;
      throw err;
    }
    return order;
  }

  const { data: rawOrder, error: orderErr } = await supabase
    .from("orders")
    .select("order_id, buyer_id, artisan_id, total_amount, status, shipping_address, created_at")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderErr) {
    console.error("[Orders API] orders query failed:", orderErr);
    const err: any = new Error(`[Orders API] orders query failed: ${orderErr.message}`);
    err.status = 500;
    throw err;
  }
  if (!rawOrder) return null;

  if (rawOrder.buyer_id !== authenticatedUserId && rawOrder.artisan_id !== authenticatedUserId) {
    const err: any = new Error("You are not authorized to view this order");
    err.status = 403;
    throw err;
  }

  const enriched = await enrichOrdersWithRelations(supabase, [rawOrder]);
  return enriched[0] || null;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  authenticatedArtisanId: string
): Promise<OrderRecord> {
  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(newStatus)) {
    const err: any = new Error(`Invalid status "${newStatus}". Allowed: ${validStatuses.join(", ")}`);
    err.status = 400;
    throw err;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const order = inMemoryOrders.get(orderId);
    if (!order) {
      const err: any = new Error("Order not found");
      err.status = 404;
      throw err;
    }
    if (order.artisan_id !== authenticatedArtisanId) {
      const err: any = new Error("Only the artisan associated with this order can update its status");
      err.status = 403;
      throw err;
    }
    order.status = newStatus;
    inMemoryOrders.set(orderId, order);
    return order;
  }

  // 1. Fetch current order
  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (fetchErr) {
    throw new Error(`Failed to query order: ${fetchErr.message}`);
  }
  if (!order) {
    const err: any = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  // 2. Validate artisan authorization
  if (order.artisan_id !== authenticatedArtisanId) {
    const err: any = new Error("Only the artisan associated with this order can update its status");
    err.status = 403;
    throw err;
  }

  // 3. Update orders row
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("order_id", orderId);

  if (updateErr) {
    throw new Error(`Failed to update order status: ${updateErr.message}`);
  }

  // 4. Create notification for the buyer
  if (order.buyer_id) {
    try {
      await supabase.from("notifications").insert({
        user_id: order.buyer_id,
        title: "Order Status Updated",
        message: `Your order #${order.order_id.slice(0, 8)} status is now "${newStatus}".`,
        type: "order_status",
        is_read: false,
      });
    } catch (notifErr) {
      console.warn("[Notifications] Failed to create buyer notification:", notifErr);
    }
  }

  const fullUpdated = await getOrderById(orderId, authenticatedArtisanId);
  return fullUpdated || { ...order, status: newStatus };
}

// ====================================================================
// Cart Management Functions (Persistent cart_items table + Store sync)
// ====================================================================

/**
 * Fetch all cart items for an authenticated user with live product details and stock status.
 */
export async function getCartForUser(userId: string): Promise<CartItemRecord[]> {
  if (!userId) {
    throw new Error("userId is required to fetch cart");
  }

  const itemsByProduct = new Map<string, CartItemRecord>();

  // 1. Try fetching from Supabase cart_items table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(*, product_images(*), users(*), pricing(*), marketplace_listings(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const product = row.products ? mapProductDbRowToRecord(row.products) : null;
          const currentStock = typeof product?.stock === "number" ? product.stock : 0;
          const isOutOfStock = currentStock <= 0;
          const isExceedingStock = row.quantity > currentStock;

          const record: CartItemRecord = {
            cart_item_id: row.cart_item_id,
            id: row.cart_item_id,
            user_id: row.user_id,
            product_id: row.product_id,
            quantity: row.quantity,
            created_at: row.created_at,
            updated_at: row.updated_at,
            product,
            is_out_of_stock: isOutOfStock,
            is_exceeding_stock: isExceedingStock,
            available_stock: currentStock,
          };
          itemsByProduct.set(row.product_id, record);
          // Keep persistent local store in sync
          saveStoredCartItem(record);
        }
      }
    } catch (err) {
      console.warn("[Cart] Supabase query notice:", err);
    }
  }

  // 2. Load stored items from persistent cartStore for this user
  const storedItems = getStoredCartForUser(userId);
  for (const item of storedItems) {
    if (!itemsByProduct.has(item.product_id)) {
      itemsByProduct.set(item.product_id, item);
    }
  }

  // 3. Load any active in-memory items for this user
  for (const item of inMemoryCartItems.values()) {
    if (item.user_id === userId && !itemsByProduct.has(item.product_id)) {
      itemsByProduct.set(item.product_id, item);
    }
  }

  // 4. Enrich all items with live product data and current stock
  const enriched: CartItemRecord[] = [];
  for (const item of itemsByProduct.values()) {
    const product = item.product || (await getProductById(item.product_id));
    const currentStock = typeof product?.stock === "number" ? product.stock : 0;
    const rec: CartItemRecord = {
      ...item,
      product,
      is_out_of_stock: currentStock <= 0,
      is_exceeding_stock: item.quantity > currentStock,
      available_stock: currentStock,
    };
    enriched.push(rec);
    inMemoryCartItems.set(item.cart_item_id, rec);
  }

  return enriched;
}

/**
 * Add a product to the user's cart with strict stock validation.
 */
export async function addToCartForUser(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<CartItemRecord> {
  if (!userId) {
    const err: any = new Error("Authentication required. Please sign in.");
    err.status = 401;
    throw err;
  }
  if (!productId) {
    const err: any = new Error("product_id is required");
    err.status = 400;
    throw err;
  }

  const qty = Math.floor(Number(quantity));
  if (isNaN(qty) || qty <= 0) {
    const err: any = new Error("Quantity must be a positive integer");
    err.status = 400;
    throw err;
  }

  // 1. Fetch product by product_id & verify existence
  const product = await getProductById(productId);
  if (!product) {
    const err: any = new Error(`Product ${productId} not found`);
    err.status = 404;
    throw err;
  }

  // 2. Verify product is published
  if (product.status === "archived") {
    const err: any = new Error(`Product "${product.title}" is archived and no longer available.`);
    err.status = 400;
    throw err;
  }

  // 3. Read current stock & verify not out of stock
  const currentStock = typeof product.stock === "number" ? product.stock : 0;
  if (currentStock <= 0) {
    const err: any = new Error(`Product "${product.title}" is currently out of stock.`);
    err.status = 409;
    err.error_code = "OUT_OF_STOCK";
    err.available_stock = 0;
    throw err;
  }

  // 4. Read existing cart item quantity for this user & product
  let existingQty = 0;
  let existingCartItemId: string | null = null;
  const supabase = getSupabaseClient();

  if (supabase && isValidUuid(productId)) {
    try {
      const { data: existingRow, error } = await supabase
        .from("cart_items")
        .select("cart_item_id, quantity")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (!error && existingRow) {
        existingQty = existingRow.quantity || 0;
        existingCartItemId = existingRow.cart_item_id;
      }
    } catch (err) {
      console.warn("[Cart] Supabase existing item check notice:", err);
    }
  }

  if (existingQty === 0) {
    const stored = getStoredCartForUser(userId).find((it) => it.product_id === productId);
    if (stored) {
      existingQty = stored.quantity || 0;
      existingCartItemId = stored.cart_item_id;
    } else {
      const memItem = Array.from(inMemoryCartItems.values()).find(
        (it) => it.user_id === userId && it.product_id === productId
      );
      if (memItem) {
        existingQty = memItem.quantity || 0;
        existingCartItemId = memItem.cart_item_id;
      }
    }
  }

  // 5. Calculate resulting quantity
  const resultingQty = existingQty + qty;

  // 6. Reject if resulting quantity > stock
  if (resultingQty > currentStock) {
    const err: any = new Error(
      `Only ${currentStock} unit${currentStock !== 1 ? "s are" : " is"} available.`
    );
    err.status = 409;
    err.error_code = "INSUFFICIENT_STOCK";
    err.product_id = productId;
    err.available_stock = currentStock;
    err.requested_quantity = resultingQty;
    throw err;
  }

  const now = new Date().toISOString();
  const cartItemId = existingCartItemId || crypto.randomUUID();

  // 7. Upsert cart_items to Supabase if valid UUID
  if (supabase && isValidUuid(productId)) {
    try {
      const { data: saved, error } = await supabase
        .from("cart_items")
        .upsert(
          {
            cart_item_id: cartItemId,
            user_id: userId,
            product_id: productId,
            quantity: resultingQty,
            updated_at: now,
          },
          { onConflict: "user_id,product_id" }
        )
        .select()
        .single();

      if (!error && saved) {
        const memRecord: CartItemRecord = {
          cart_item_id: saved.cart_item_id,
          id: saved.cart_item_id,
          user_id: userId,
          product_id: productId,
          quantity: resultingQty,
          created_at: saved.created_at || now,
          updated_at: now,
          product,
          available_stock: currentStock,
          is_out_of_stock: false,
          is_exceeding_stock: false,
        };
        inMemoryCartItems.set(cartItemId, memRecord);
        saveStoredCartItem(memRecord);
        return memRecord;
      }
    } catch (err) {
      console.warn("[Cart] Supabase upsert notice:", err);
    }
  }

  // Persistent store fallback
  const memRecord: CartItemRecord = {
    cart_item_id: cartItemId,
    id: cartItemId,
    user_id: userId,
    product_id: productId,
    quantity: resultingQty,
    created_at: now,
    updated_at: now,
    product,
    available_stock: currentStock,
    is_out_of_stock: false,
    is_exceeding_stock: false,
  };
  inMemoryCartItems.set(cartItemId, memRecord);
  saveStoredCartItem(memRecord);
  return memRecord;
}

/**
 * Update quantity for a specific product in user's cart.
 */
export async function updateCartItemQuantityForUser(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartItemRecord | { removed: true; product_id: string }> {
  if (!userId) {
    const err: any = new Error("Authentication required. Please sign in.");
    err.status = 401;
    throw err;
  }
  if (!productId) {
    const err: any = new Error("product_id is required");
    err.status = 400;
    throw err;
  }

  const qty = Math.floor(Number(quantity));
  if (qty <= 0) {
    await removeFromCartForUser(userId, productId);
    return { removed: true, product_id: productId };
  }

  const product = await getProductById(productId);
  if (!product) {
    const err: any = new Error(`Product ${productId} not found`);
    err.status = 404;
    throw err;
  }

  const currentStock = typeof product.stock === "number" ? product.stock : 0;
  if (qty > currentStock) {
    const err: any = new Error(
      `Only ${currentStock} unit${currentStock !== 1 ? "s are" : " is"} available.`
    );
    err.status = 409;
    err.error_code = "INSUFFICIENT_STOCK";
    err.product_id = productId;
    err.available_stock = currentStock;
    err.requested_quantity = qty;
    throw err;
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase && isValidUuid(productId)) {
    try {
      const { data: updated, error } = await supabase
        .from("cart_items")
        .update({ quantity: qty, updated_at: now })
        .eq("user_id", userId)
        .eq("product_id", productId)
        .select()
        .maybeSingle();

      if (!error && updated) {
        const memRecord: CartItemRecord = {
          cart_item_id: updated.cart_item_id,
          id: updated.cart_item_id,
          user_id: userId,
          product_id: productId,
          quantity: qty,
          created_at: updated.created_at,
          updated_at: now,
          product,
          available_stock: currentStock,
          is_out_of_stock: false,
          is_exceeding_stock: false,
        };
        inMemoryCartItems.set(updated.cart_item_id, memRecord);
        saveStoredCartItem(memRecord);
        return memRecord;
      }
    } catch (err) {
      console.warn("[Cart] Supabase update quantity notice:", err);
    }
  }

  // Persistent store fallback
  const memItem = Array.from(inMemoryCartItems.values()).find(
    (it) => it.user_id === userId && (it.product_id === productId || it.cart_item_id === productId)
  );
  if (memItem) {
    memItem.quantity = qty;
    memItem.updated_at = now;
    memItem.product = product;
    memItem.available_stock = currentStock;
    memItem.is_out_of_stock = false;
    memItem.is_exceeding_stock = false;
    saveStoredCartItem(memItem);
    return memItem;
  }

  const cartItemId = crypto.randomUUID();
  const newRecord: CartItemRecord = {
    cart_item_id: cartItemId,
    id: cartItemId,
    user_id: userId,
    product_id: productId,
    quantity: qty,
    created_at: now,
    updated_at: now,
    product,
    available_stock: currentStock,
    is_out_of_stock: false,
    is_exceeding_stock: false,
  };
  inMemoryCartItems.set(cartItemId, newRecord);
  saveStoredCartItem(newRecord);
  return newRecord;
}

/**
 * Remove an item from user's cart by productId or cart_item_id.
 */
export async function removeFromCartForUser(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;

  const supabase = getSupabaseClient();
  if (supabase && isValidUuid(productId)) {
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .or(`product_id.eq.${productId},cart_item_id.eq.${productId}`);
    } catch (err) {
      console.warn("[Cart] Supabase delete item notice:", err);
    }
  }

  removeStoredCartItem(userId, productId);

  for (const [id, item] of inMemoryCartItems.entries()) {
    if (item.user_id === userId && (item.product_id === productId || item.cart_item_id === productId)) {
      inMemoryCartItems.delete(id);
    }
  }

  return true;
}

/**
 * Clear all items from a user's cart.
 */
export async function clearCartForUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    } catch (err) {
      console.warn("[Cart] Supabase clear cart notice:", err);
    }
  }

  clearStoredCartForUser(userId);

  for (const [id, item] of inMemoryCartItems.entries()) {
    if (item.user_id === userId) {
      inMemoryCartItems.delete(id);
    }
  }

  return true;
}

/**
 * Remove purchased items from a user's cart after successful order creation.
 */
export async function removeOrderedItemsFromCart(userId: string, productIds: string[]): Promise<void> {
  if (!userId || !Array.isArray(productIds) || productIds.length === 0) return;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .in("product_id", productIds);
    } catch (err) {
      console.warn("[Cart] Supabase remove ordered items notice:", err);
    }
  }

  for (const prodId of productIds) {
    removeStoredCartItem(userId, prodId);
  }

  for (const [id, item] of inMemoryCartItems.entries()) {
    if (item.user_id === userId && productIds.includes(item.product_id)) {
      inMemoryCartItems.delete(id);
    }
  }
}

/**
 * Record a real analytics event (PRODUCT_VIEW, PRODUCT_CLICK, PRODUCT_SAVE, PRODUCT_UNSAVE, ADD_TO_CART, ORDER_PLACED).
 * For PRODUCT_VIEW events, atomically increments the views column in public.products.
 */
export async function recordAnalyticsEvent(params: {
  user_id?: string | null;
  product_id: string;
  event_type: string;
  metadata?: any;
}): Promise<{ success: boolean; event_id: string }> {
  const { user_id = null, product_id, event_type, metadata = {} } = params;
  if (!product_id || !event_type) {
    throw new Error("product_id and event_type are required");
  }

  const eventId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let insertPayload: any = {
        event_id: eventId,
        user_id: user_id || null,
        product_id,
        event_type,
        created_at: createdAt,
      };
      if (metadata && typeof metadata === "object" && Object.keys(metadata).length > 0) {
        insertPayload.metadata = metadata;
      }

      let { error } = await supabase.from("analytics_events").insert(insertPayload);
      if (error && (error.message?.includes("metadata") || error.code === "PGRST204")) {
        const fallback = await supabase.from("analytics_events").insert({
          event_id: eventId,
          user_id: user_id || null,
          product_id,
          event_type,
          created_at: createdAt,
        });
        error = fallback.error;
      }
      if (error) {
        console.warn("[Analytics] Supabase record event notice:", error.message);
      }

      // If viewing a product, atomically increment the views column in products table
      if (event_type === "PRODUCT_VIEW" || event_type === "VIEW_PRODUCT") {
        try {
          let { error: rpcErr } = await supabase.rpc("increment_product_views", {
            product_uuid: product_id,
          });
          if (rpcErr) {
            const { error: rpcErr2 } = await supabase.rpc("increment_product_views", {
              p_product_id: product_id,
            });
            rpcErr = rpcErr2;
          }
          if (rpcErr) {
            const { error: rpcErr3 } = await supabase.rpc("increment_product_views", {
              product_id: product_id,
            });
            rpcErr = rpcErr3;
          }
          if (rpcErr) {
            // Fallback atomic-like update: read current views and increment
            const { data: cur } = await supabase
              .from("products")
              .select("views")
              .eq("product_id", product_id)
              .maybeSingle();
            const currentViews = Number(cur?.views || 0);
            await supabase
              .from("products")
              .update({ views: currentViews + 1 })
              .eq("product_id", product_id);
          }
        } catch (rpcCatch) {
          console.warn("[Analytics] Increment product views RPC notice:", rpcCatch);
        }
      }
    } catch (err: any) {
      console.warn("[Analytics] Failed to insert event into Supabase:", err?.message || err);
    }
  }

  // Maintain inMemory state
  inMemoryAnalyticsEvents.set(eventId, {
    event_id: eventId,
    user_id: user_id || null,
    product_id,
    event_type,
    metadata,
    created_at: createdAt,
  });

  const inMemProd = inMemoryProducts.get(product_id);
  if (inMemProd && (event_type === "PRODUCT_VIEW" || event_type === "VIEW_PRODUCT")) {
    inMemProd.views = (inMemProd.views || 0) + 1;
  }

  return { success: true, event_id: eventId };
}

/**
 * Retrieve authentic Supabase-backed analytics data for the authenticated artisan.
 * Scoped strictly by artisanId derived from the authenticated session token.
 */
export async function getArtisanAnalyticsData(
  artisanId: string,
  options: { period?: string; productId?: string } = {}
): Promise<ArtisanAnalyticsResult> {
  if (!artisanId) {
    throw new Error("artisanId is required");
  }

  const period = options.period || "30d";
  const targetProductId = options.productId;

  // Calculate day range
  let numDays = 30;
  if (period === "7d") numDays = 7;
  else if (period === "90d") numDays = 90;
  else if (period === "all") numDays = 365;

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - numDays);
  startDate.setHours(0, 0, 0, 0);

  const supabase = getSupabaseClient();

  // 1. Fetch ALL of the artisan's real products (to calculate full studio metrics)
  let artisanProducts: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          product_id,
          artisan_id,
          title,
          price,
          stock,
          views,
          status,
          created_at,
          product_images(image_url)
        `)
        .eq("artisan_id", artisanId);

      if (!error && Array.isArray(data)) {
        artisanProducts = data;
      }
    } catch (err) {
      console.warn("[Analytics] Error fetching products:", err);
    }
  }

  // Fallback / merge inMemory
  if (artisanProducts.length === 0) {
    for (const prod of inMemoryProducts.values()) {
      if (prod.artisan_id === artisanId || !targetProductId || prod.product_id === targetProductId) {
        artisanProducts.push({
          product_id: prod.product_id,
          artisan_id: prod.artisan_id,
          title: prod.title,
          price: prod.price,
          stock: prod.stock,
          views: prod.views || 0,
          sold: (prod as any).sold || 0,
          status: prod.status,
          created_at: prod.created_at,
          product_images: prod.images?.map((i) => ({ image_url: i.image_url })) || [],
        });
      }
    }
  }

  // If specific product requested and not in list, fetch it directly
  if (targetProductId && !artisanProducts.some((p) => p.product_id === targetProductId)) {
    try {
      const single = await getProductById(targetProductId);
      if (single) {
        artisanProducts.push({
          product_id: single.product_id,
          artisan_id: single.artisan_id,
          title: single.title,
          price: single.price,
          stock: single.stock,
          views: single.views || 0,
          sold: (single as any).sold || 0,
          status: single.status,
          created_at: single.created_at,
          product_images: single.images?.map((i) => ({ image_url: i.image_url })) || [],
        });
      }
    } catch {
      // ignore
    }
  }

  const allProductIds = artisanProducts.map((p) => p.product_id);

  // Initialize empty time series buckets
  const timeSeriesMap = new Map<
    string,
    { date: string; views: number; orders: number; revenue: number; amount: number }
  >();
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
    const displayLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    timeSeriesMap.set(dateKey, {
      date: displayLabel,
      views: 0,
      orders: 0,
      revenue: 0,
      amount: 0,
    });
  }

  // If artisan has no products, return pristine zero result
  if (allProductIds.length === 0) {
    return {
      total_views: 0,
      total_products: 0,
      total_orders: 0,
      total_units_sold: 0,
      total_revenue: 0,
      total_production_cost: 0,
      total_profit: 0,
      total_saves: 0,
      total_cart_additions: 0,
      total_clicks: 0,
      save_rate: "0.0",
      conversion_rate: "0.0",
      products: [],
      top_products: [],
      time_series: Array.from(timeSeriesMap.values()),
      custom_requests: [],
    };
  }

  // 2. Fetch pricing records to compute production cost and profit
  const pricingMap = new Map<string, any>();
  if (supabase && allProductIds.length > 0) {
    try {
      const { data: pricingData } = await supabase
        .from("pricing")
        .select("product_id, material_cost, labour_cost, packaging_cost, other_cost")
        .in("product_id", allProductIds);
      if (Array.isArray(pricingData)) {
        for (const pr of pricingData) {
          pricingMap.set(pr.product_id, pr);
        }
      }
    } catch (pricingErr) {
      console.warn("[Analytics] Error fetching pricing breakdown:", pricingErr);
    }
  }

  // 3. Fetch real analytics events for these products
  let events: any[] = [];
  if (supabase && allProductIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .in("product_id", allProductIds)
        .gte("created_at", startDate.toISOString());

      if (!error && Array.isArray(data)) {
        events = data;
      }
    } catch (err) {
      console.warn("[Analytics] Error fetching events:", err);
    }
  }

  // Include inMemory events
  for (const ev of inMemoryAnalyticsEvents.values()) {
    if (allProductIds.includes(ev.product_id)) {
      const evDate = new Date(ev.created_at);
      if (evDate >= startDate) {
        if (!events.some((e) => e.event_id === ev.event_id)) {
          events.push(ev);
        }
      }
    }
  }

  // 4. Fetch real orders for this artisan
  let orders: any[] = [];
  if (supabase) {
    let orderQuery = supabase
      .from("orders")
      .select(`
        order_id,
        buyer_id,
        artisan_id,
        total_amount,
        status,
        shipping_address,
        created_at
      `)
      .eq("artisan_id", artisanId)
      .neq("status", "cancelled");

    if (period !== "all") {
      orderQuery = orderQuery.gte("created_at", startDate.toISOString());
    }

    const { data, error } = await orderQuery;

    if (error) {
      console.error("[Analytics] Database error fetching orders:", error);
      throw new Error(`Database error querying orders: ${error.message}`);
    }

    if (Array.isArray(data)) {
      orders = data;
    }
  }

  // Include inMemory orders
  for (const ord of inMemoryOrders.values()) {
    if (ord.artisan_id === artisanId && ord.status !== "cancelled") {
      const ordDate = new Date(ord.created_at);
      if (period === "all" || ordDate >= startDate) {
        if (!orders.some((o) => o.order_id === ord.order_id)) {
          orders.push(ord);
        }
      }
    }
  }

  // 5. Fetch order_items for all fetched orders (explicit query for 100% reliability, omitting created_at)
  const orderIds = orders.map((o) => o.order_id);
  const itemsByOrderId = new Map<string, any[]>();
  if (supabase && orderIds.length > 0) {
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("order_item_id, order_id, product_id, quantity, price")
      .in("order_id", orderIds);

    if (itemsErr) {
      console.error("[Analytics] Database error fetching order_items:", itemsErr);
      throw new Error(`Database error querying order_items: ${itemsErr.message}`);
    }

    if (Array.isArray(orderItems)) {
      for (const it of orderItems) {
        const list = itemsByOrderId.get(it.order_id) || [];
        list.push(it);
        itemsByOrderId.set(it.order_id, list);
      }
    }
  }

  // Include inMemory order items
  for (const it of inMemoryOrderItems.values()) {
    if (orderIds.includes(it.order_id)) {
      const list = itemsByOrderId.get(it.order_id) || [];
      list.push(it);
      itemsByOrderId.set(it.order_id, list);
    }
  }

  // Attach order_items to orders
  for (const ord of orders) {
    ord.order_items = itemsByOrderId.get(ord.order_id) || ord.order_items || [];
  }

  // 6. Per-product aggregation maps
  const viewsPerProduct = new Map<string, number>();
  const clicksPerProduct = new Map<string, number>();
  const savesPerProduct = new Map<string, number>();
  const cartAdditionsPerProduct = new Map<string, number>();
  const unitsSoldPerProduct = new Map<string, number>();
  const revenuePerProduct = new Map<string, number>();
  const costPerProduct = new Map<string, number>();

  for (const prod of artisanProducts) {
    const pid = prod.product_id;
    const initialViews = typeof prod.views === "number" ? prod.views : 0;
    viewsPerProduct.set(pid, initialViews);
    clicksPerProduct.set(pid, 0);
    savesPerProduct.set(pid, 0);
    cartAdditionsPerProduct.set(pid, 0);
    unitsSoldPerProduct.set(pid, 0);
    revenuePerProduct.set(pid, 0);
    costPerProduct.set(pid, 0);
  }

  // Process events
  for (const ev of events) {
    const pid = ev.product_id;
    const type = ev.event_type;
    const dateKey = (ev.created_at || "").split("T")[0];

    // Check if targetProductId filtering applies to time series
    const matchesTarget = !targetProductId || pid === targetProductId;

    if (type === "PRODUCT_VIEW" || type === "VIEW_PRODUCT") {
      // Event-based views update the time-series date bucket without double-counting lifetime product views
      if (matchesTarget) {
        const bucket = timeSeriesMap.get(dateKey);
        if (bucket) {
          bucket.views += 1;
        }
      }
    } else if (type === "PRODUCT_CLICK") {
      clicksPerProduct.set(pid, (clicksPerProduct.get(pid) || 0) + 1);
    } else if (type === "PRODUCT_SAVE") {
      savesPerProduct.set(pid, (savesPerProduct.get(pid) || 0) + 1);
    } else if (type === "PRODUCT_UNSAVE") {
      savesPerProduct.set(pid, Math.max(0, (savesPerProduct.get(pid) || 0) - 1));
    } else if (type === "ADD_TO_CART") {
      cartAdditionsPerProduct.set(pid, (cartAdditionsPerProduct.get(pid) || 0) + 1);
    }
  }

  // Process orders & order_items
  // Revenue must be SUM(order_items.price * order_items.quantity)
  // Units = SUM(order_items.quantity)
  for (const ord of orders) {
    const dateKey = (ord.created_at || "").split("T")[0];
    const orderItemsList = ord.order_items || [];

    if (orderItemsList.length > 0) {
      for (const item of orderItemsList) {
        const pid = item.product_id;
        if (allProductIds.includes(pid)) {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const itemRev = price * qty;

          unitsSoldPerProduct.set(pid, (unitsSoldPerProduct.get(pid) || 0) + qty);
          revenuePerProduct.set(pid, (revenuePerProduct.get(pid) || 0) + itemRev);

          // Calculate unit cost strictly from real pricing table (do not invent fake costs)
          const pr = pricingMap.get(pid);
          const unitCost = pr
            ? (Number(pr.material_cost) || 0) +
              (Number(pr.labour_cost) || 0) +
              (Number(pr.packaging_cost) || 0) +
              (Number(pr.other_cost) || 0)
            : 0;
          costPerProduct.set(pid, (costPerProduct.get(pid) || 0) + unitCost * qty);

          // Apply to time series if matches target
          if (!targetProductId || pid === targetProductId) {
            const bucket = timeSeriesMap.get(dateKey);
            if (bucket) {
              bucket.orders += 1;
              bucket.revenue += itemRev;
              bucket.amount += itemRev;
            }
          }
        }
      }
    } else {
      // If order has no separate order_items rows, use order total_amount
      const orderTotal = Number(ord.total_amount) || 0;
      if (!targetProductId) {
        const bucket = timeSeriesMap.get(dateKey);
        if (bucket) {
          bucket.orders += 1;
          bucket.revenue += orderTotal;
          bucket.amount += orderTotal;
        }
      }
    }
  }

  // Build product summaries
  const productSummaries: ProductAnalyticsSummary[] = artisanProducts.map((p) => {
    const pid = p.product_id;
    const views = viewsPerProduct.get(pid) || 0;
    const clicks = clicksPerProduct.get(pid) || 0;
    const saves = savesPerProduct.get(pid) || 0;
    const cartAdds = cartAdditionsPerProduct.get(pid) || 0;
    const unitsSold = unitsSoldPerProduct.get(pid) || 0;
    const revenue = revenuePerProduct.get(pid) || 0;
    const prodCost = costPerProduct.get(pid) || 0;
    const profit = Math.max(0, revenue - prodCost);

    // Real conversion rate = (unitsSold / views) * 100
    // If views === 0 and unitsSold > 0, then visits must have been at least unitsSold
    const effectiveViews = Math.max(views, unitsSold);
    const convRate = effectiveViews > 0 ? ((unitsSold / effectiveViews) * 100).toFixed(1) : "0.0";
    const saveRate = views > 0 ? ((saves / views) * 100).toFixed(1) : "0.0";

    const cleanSkuId = pid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase() || "001";
    const primaryImg =
      p.product_images?.[0]?.image_url ||
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800";

    return {
      product_id: pid,
      title: typeof p.title === "string" ? p.title : p.title?.en || "Handcrafted Craft",
      sku: `KALA-CRF-${cleanSkuId}`,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      image_url: primaryImg,
      views,
      clicks,
      saves,
      cart_additions: cartAdds,
      units_sold: unitsSold,
      revenue,
      production_cost: prodCost,
      profit,
      conversion_rate: convRate,
      save_rate: saveRate,
    };
  });

  // Calculate totals
  const sumItemRevenues = Array.from(revenuePerProduct.values()).reduce((a, b) => a + b, 0);
  const sumOrderTotals = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const totalViews = targetProductId
    ? (viewsPerProduct.get(targetProductId) || 0)
    : Array.from(viewsPerProduct.values()).reduce((a, b) => a + b, 0);

  const totalClicks = targetProductId
    ? (clicksPerProduct.get(targetProductId) || 0)
    : Array.from(clicksPerProduct.values()).reduce((a, b) => a + b, 0);

  const totalSaves = targetProductId
    ? (savesPerProduct.get(targetProductId) || 0)
    : Array.from(savesPerProduct.values()).reduce((a, b) => a + b, 0);

  const totalCartAdditions = targetProductId
    ? (cartAdditionsPerProduct.get(targetProductId) || 0)
    : Array.from(cartAdditionsPerProduct.values()).reduce((a, b) => a + b, 0);

  // Units = SUM(order_items.quantity)
  const totalUnitsSold = targetProductId
    ? (unitsSoldPerProduct.get(targetProductId) || 0)
    : Array.from(unitsSoldPerProduct.values()).reduce((a, b) => a + b, 0);

  // Revenue = SUM(order_items.price * order_items.quantity)
  const totalRevenue = targetProductId
    ? (revenuePerProduct.get(targetProductId) || 0)
    : (sumItemRevenues > 0 ? sumItemRevenues : sumOrderTotals);

  const totalProductionCost = targetProductId
    ? (costPerProduct.get(targetProductId) || 0)
    : Array.from(costPerProduct.values()).reduce((a, b) => a + b, 0);

  const totalProfit = Math.max(0, totalRevenue - totalProductionCost);

  const matchingOrders = targetProductId
    ? orders.filter((o) => (itemsByOrderId.get(o.order_id) || []).some((it: any) => it.product_id === targetProductId))
    : orders;
  const totalOrdersCount = matchingOrders.length;

  const totalSaveRate = totalViews > 0 ? ((totalSaves / totalViews) * 100).toFixed(1) : "0.0";
  const effectiveTotalViews = Math.max(totalViews, totalOrdersCount);
  const totalConversionRate = effectiveTotalViews > 0
    ? ((totalOrdersCount / effectiveTotalViews) * 100).toFixed(1)
    : "0.0";

  // Top products sorted by revenue, then units sold, then views
  const topProducts = [...productSummaries].sort((a, b) => {
    if (b.revenue !== a.revenue) return b.revenue - a.revenue;
    if (b.units_sold !== a.units_sold) return b.units_sold - a.units_sold;
    return b.views - a.views;
  });

  return {
    total_views: totalViews,
    total_products: artisanProducts.length,
    total_orders: totalOrdersCount,
    total_units_sold: totalUnitsSold,
    total_revenue: totalRevenue,
    total_production_cost: totalProductionCost,
    total_profit: totalProfit,
    total_saves: totalSaves,
    total_cart_additions: totalCartAdditions,
    total_clicks: totalClicks,
    save_rate: totalSaveRate,
    conversion_rate: totalConversionRate,
    products: productSummaries,
    top_products: topProducts,
    time_series: Array.from(timeSeriesMap.values()),
    custom_requests: [],
  };
}
