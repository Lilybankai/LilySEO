-- Sample data for testing Lead Finder feature
-- This is optional and should only be run in development environments

-- Insert sample search packages if they don't exist
INSERT INTO public.lead_search_packages (name, description, searches_count, price, active)
VALUES 
  ('Small Package', '50 additional lead searches', 50, 19.99, TRUE),
  ('Medium Package', '100 additional lead searches', 100, 34.99, TRUE),
  ('Large Package', '250 additional lead searches', 250, 79.99, TRUE)
ON CONFLICT DO NOTHING;

-- Get a sample user ID (change this to a specific user ID in your system for testing)
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Get first enterprise user (if any)
  SELECT id INTO sample_user_id FROM public.profiles 
  WHERE subscription_tier = 'enterprise'
  LIMIT 1;
  
  -- If no enterprise user found, get any user
  IF sample_user_id IS NULL THEN
    SELECT id INTO sample_user_id FROM public.profiles
    LIMIT 1;
    
    -- Update the user to enterprise tier for testing
    IF sample_user_id IS NOT NULL THEN
      UPDATE public.profiles
      SET subscription_tier = 'enterprise'
      WHERE id = sample_user_id;
    END IF;
  END IF;
  
  -- Exit if no users found
  IF sample_user_id IS NULL THEN
    RAISE NOTICE 'No users found for sample data';
    RETURN;
  END IF;
  
  -- Insert sample purchased package
  INSERT INTO public.user_search_packages 
    (user_id, package_id, remaining_searches, purchase_date)
  SELECT 
    sample_user_id, 
    id, 
    25, 
    NOW() - INTERVAL '5 days'
  FROM public.lead_search_packages
  WHERE name = 'Small Package'
  LIMIT 1;
  
  -- Insert sample searches
  INSERT INTO public.lead_searches
    (user_id, search_query, location, min_rating, max_results, results_count, search_date)
  VALUES
    (sample_user_id, 'Coffee Shops', 'New York, NY', 4.0, 10, 8, NOW() - INTERVAL '5 days'),
    (sample_user_id, 'Restaurants', 'Los Angeles, CA', 3.5, 15, 12, NOW() - INTERVAL '3 days'),
    (sample_user_id, 'Plumbers', 'Chicago, IL', 4.0, 10, 6, NOW() - INTERVAL '1 day');
  
  -- Insert sample leads
  INSERT INTO public.leads
    (user_id, business_name, address, phone, website, rating, place_id, latitude, longitude, 
     categories, notes, status, contacted, contacted_date, search_id)
  SELECT
    sample_user_id,
    'ABC Coffee',
    '123 Main St, New York, NY',
    '(555) 123-4567',
    'https://example.com/abc-coffee',
    4.5,
    'sample_place_id_1',
    40.7128,
    -74.0060,
    ARRAY['Coffee Shop', 'Cafe'],
    'Great local coffee shop with friendly staff',
    'New',
    FALSE,
    NULL,
    id
  FROM public.lead_searches
  WHERE user_id = sample_user_id AND search_query = 'Coffee Shops'
  LIMIT 1;
  
  INSERT INTO public.leads
    (user_id, business_name, address, phone, website, rating, place_id, latitude, longitude, 
     categories, notes, status, contacted, contacted_date)
  VALUES
    (sample_user_id, 'XYZ Plumbing', '456 Oak St, Chicago, IL', '(555) 987-6543', 
     'https://example.com/xyz-plumbing', 4.8, 'sample_place_id_2', 41.8781, -87.6298, 
     ARRAY['Plumbing', 'Home Services'], 'Experienced plumbing company with 24/7 service',
     'Contacted', TRUE, NOW() - INTERVAL '1 day');
END
$$; 