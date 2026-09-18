import fs from "fs";
import path from "path";
import os from "os";
import type { CartItemRecord } from "./supabase.js";

// In Vercel serverless functions, process.cwd() is read-only.
// os.tmpdir() is guaranteed writable for ephemeral storage.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless
  ? path.join(os.tmpdir(), "kalasetu-data")
  : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "cart_items_store.json");

let cartMemoryCache: Map<string, CartItemRecord> | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Non-fatal: in-memory fallback
  }
}

export function loadCartStore(): Map<string, CartItemRecord> {
  if (cartMemoryCache) {
    return cartMemoryCache;
  }
  cartMemoryCache = new Map();
  try {
    ensureDataDir();
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.cart_item_id && item.user_id) {
            cartMemoryCache.set(item.cart_item_id, item);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[CartStore] Failed to load cart store from disk:", err);
  }
  return cartMemoryCache;
}

export function flushCartStore(): void {
  if (!cartMemoryCache) return;
  try {
    ensureDataDir();
    const items = Array.from(cartMemoryCache.values());
    fs.writeFileSync(STORE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[CartStore] Failed to write cart store to disk:", err);
  }
}

export function getStoredCartForUser(userId: string): CartItemRecord[] {
  const store = loadCartStore();
  return Array.from(store.values()).filter((item) => item.user_id === userId);
}

export function saveStoredCartItem(item: CartItemRecord): void {
  const store = loadCartStore();
  store.set(item.cart_item_id, item);
  flushCartStore();
}

export function removeStoredCartItem(userId: string, productIdOrCartItemId: string): void {
  const store = loadCartStore();
  let modified = false;
  for (const [id, item] of store.entries()) {
    if (
      item.user_id === userId &&
      (item.product_id === productIdOrCartItemId || item.cart_item_id === productIdOrCartItemId)
    ) {
      store.delete(id);
      modified = true;
    }
  }
  if (modified) {
    flushCartStore();
  }
}

export function clearStoredCartForUser(userId: string): void {
  const store = loadCartStore();
  let modified = false;
  for (const [id, item] of store.entries()) {
    if (item.user_id === userId) {
      store.delete(id);
      modified = true;
    }
  }
  if (modified) {
    flushCartStore();
  }
}
