-- ====================================================================
-- KalaSetu Artisan Analytics & Product Views Migration
-- Adds 'views' column to products table and provides atomic increment RPC
-- ====================================================================

-- 1. Add views counter column to public.products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- 2. Create index on views for performance
CREATE INDEX IF NOT EXISTS idx_products_views ON public.products(views);

-- 3. Create secure atomic RPC for incrementing product views
CREATE OR REPLACE FUNCTION public.increment_product_views(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET views = COALESCE(views, 0) + 1
  WHERE product_id = p_product_id;
END;
$$;

-- Grant execution permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.increment_product_views(UUID) TO anon, authenticated, service_role;
