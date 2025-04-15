-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription_items table
CREATE TABLE IF NOT EXISTS public.subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_item_id TEXT,
  stripe_price_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month',
  features JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription_id ON public.subscription_items(subscription_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Create policies for subscription_items
CREATE POLICY "Users can view their own subscription items" ON public.subscription_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND s.user_id = auth.uid()
    )
  );

-- Create policies for plans
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = TRUE);

-- Insert default plans
INSERT INTO public.plans (id, name, description, price, currency, interval, features)
VALUES
  ('free', 'Free', 'Basic SEO analysis for small websites', 0, 'usd', 'month', '{"maxProjects": 1, "maxPagesPerCrawl": 50, "maxCrawlsPerMonth": 5, "competitorAnalysis": false, "whiteLabel": false, "prioritySupport": false}'::jsonb),
  ('pro', 'Pro', 'Advanced SEO analysis for growing businesses', 4900, 'usd', 'month', '{"maxProjects": 10, "maxPagesPerCrawl": 500, "maxCrawlsPerMonth": 50, "competitorAnalysis": true, "whiteLabel": true, "prioritySupport": true}'::jsonb),
  ('enterprise', 'Enterprise', 'Comprehensive SEO analysis for large organizations', 9900, 'usd', 'month', '{"maxProjects": 50, "maxPagesPerCrawl": 5000, "maxCrawlsPerMonth": 500, "competitorAnalysis": true, "whiteLabel": true, "prioritySupport": true}'::jsonb)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  interval = EXCLUDED.interval,
  features = EXCLUDED.features,
  updated_at = NOW(); 