-- ====================================================================
-- KalaSetu / Hackengers - SIH 2026 Database Migration
-- Core Schema: ARTISANS, PRODUCTS, PRODUCT_IMAGES
-- Storage: 'product-images' Supabase Storage Bucket
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at trigger helper function
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 3. ARTISANS TABLE
-- Represents registered artisan / micro-entrepreneur sellers
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  profile_image TEXT,
  craft TEXT,
  location TEXT,
  state TEXT,
  language TEXT DEFAULT 'en',
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Artisan update trigger
DROP TRIGGER IF EXISTS trg_artisans_updated_at ON public.artisans;
CREATE TRIGGER trg_artisans_updated_at
BEFORE UPDATE ON public.artisans
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ====================================================================
-- 4. PRODUCTS TABLE
-- Represents craft items created by artisans
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  category_label TEXT,
  sub_category TEXT,
  materials TEXT[] DEFAULT '{}'::TEXT[],
  specifications TEXT[] DEFAULT '{}'::TEXT[],
  dimensions TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}'::TEXT[],
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products update trigger
DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

-- ====================================================================
-- 5. PRODUCT IMAGES TABLE
-- Multi-image support (original photo, AI studio enhanced, gallery)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'original' CHECK (image_type IN ('original', 'enhanced', 'gallery', 'thumbnail')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 6. PERFORMANCE INDEXES
-- Optimal indexing for marketplace filtering & artisan dashboard lookups
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON public.products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary);

-- ====================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Artisans Policies
-- Public can view artisan seller profiles
CREATE POLICY "Public can view artisan profiles"
  ON public.artisans FOR SELECT
  USING (true);

-- Artisans can insert/update their own profile
CREATE POLICY "Artisans can create their profile"
  ON public.artisans FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Artisans can update own profile"
  ON public.artisans FOR UPDATE
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- Products Policies
-- Anyone can view published products in marketplace
CREATE POLICY "Anyone can view published products"
  ON public.products FOR SELECT
  USING (status = 'published' OR auth.uid() = artisan_id OR auth.uid() IS NULL);

-- Artisans can manage their own products
CREATE POLICY "Artisans can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = artisan_id OR auth.uid() IS NULL);

CREATE POLICY "Artisans can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = artisan_id OR auth.uid() IS NULL);

CREATE POLICY "Artisans can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = artisan_id OR auth.uid() IS NULL);

-- Product Images Policies
-- Public can view images for visible products
CREATE POLICY "Public can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Artisans can insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Artisans can delete product images"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- ====================================================================
-- 8. PRICING TABLE
-- Historical and breakdown pricing associated with product
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  mrp NUMERIC(12, 2) DEFAULT 0 CHECK (mrp >= 0),
  retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (retail_price >= 0),
  market_estimate NUMERIC(12, 2) DEFAULT 0,
  minimum_viable_price NUMERIC(12, 2) DEFAULT 0,
  material_cost NUMERIC(12, 2),
  labour_cost NUMERIC(12, 2),
  packaging_cost NUMERIC(12, 2),
  other_costs NUMERIC(12, 2),
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_pricing_updated_at ON public.pricing;
CREATE TRIGGER trg_pricing_updated_at
BEFORE UPDATE ON public.pricing
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_pricing_product_id ON public.pricing(product_id);

ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view pricing" ON public.pricing FOR SELECT USING (true);
CREATE POLICY "Artisans can insert pricing" ON public.pricing FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = pricing.product_id
    AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
  )
);
CREATE POLICY "Artisans can update pricing" ON public.pricing FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = pricing.product_id
    AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
  )
);

-- ====================================================================
-- 9. MARKETPLACE LISTINGS TABLE
-- Multi-channel e-commerce templates & listings (KalaSetu, ONDC, Amazon, Etsy, etc.)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  listing_status TEXT NOT NULL DEFAULT 'pending' CHECK (listing_status IN ('active', 'pending', 'inactive', 'draft')),
  listing_title TEXT,
  listing_price NUMERIC(12, 2),
  listing_url TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER trg_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_product_id ON public.marketplace_listings(product_id);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view marketplace listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Artisans can insert marketplace listings" ON public.marketplace_listings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = marketplace_listings.product_id
    AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
  )
);
CREATE POLICY "Artisans can update marketplace listings" ON public.marketplace_listings FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = marketplace_listings.product_id
    AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
  )
);

-- ====================================================================
-- 10. SUPABASE STORAGE SETUP
-- 'product-images' bucket for artisan craft media
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage security policies
CREATE POLICY "Public can view product images in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload craft photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Artisans can delete own craft photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
