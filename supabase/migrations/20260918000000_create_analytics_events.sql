-- ====================================================================
-- KalaSetu / Hackengers - Database Migration
-- Analytics Events Table & Security Policies
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(product_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated clients to insert tracking events (views, clicks, saves, cart additions)
DROP POLICY IF EXISTS "Allow insert analytics events" ON public.analytics_events;
CREATE POLICY "Allow insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

-- Allow artisans to view analytics events for their own products, and users to view their own recorded events
DROP POLICY IF EXISTS "Artisans can view their own product analytics" ON public.analytics_events;
CREATE POLICY "Artisans can view their own product analytics"
  ON public.analytics_events FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.product_id = analytics_events.product_id
      AND (products.artisan_id = auth.uid() OR auth.uid() IS NULL)
    )
  );
