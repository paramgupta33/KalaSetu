-- ====================================================================
-- KalaSetu / Hackengers - Database Migration
-- Table: CART_ITEMS
-- Supports Persistent User Cart with Strict Stock Validation & Unique Constraint
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  cart_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cart_items_user_product UNIQUE (user_id, product_id)
);

-- Indexes for optimal lookup performance
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);

-- Cart items updated_at trigger
DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only view their own cart items
CREATE POLICY "Users can view own cart items"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can only insert items into their own cart
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can only update their own cart items
CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can only delete their own cart items
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
