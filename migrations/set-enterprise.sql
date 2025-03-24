-- This is a direct SQL script to update a user's subscription tier
-- Run this in the Supabase SQL Editor to upgrade a specific user

-- Replace the UUID below with your actual user ID
UPDATE public.profiles 
SET subscription_tier = 'enterprise' 
WHERE id = '3de6eb1f-93c1-498e-938f-a0c6d43f6ec3';

-- Alternatively, you can update a user by email:
-- UPDATE public.profiles 
-- SET subscription_tier = 'enterprise' 
-- WHERE email = 'carl@thelilybankagency.co.uk';

-- Verify the change
SELECT id, email, subscription_tier 
FROM public.profiles 
WHERE id = '3de6eb1f-93c1-498e-938f-a0c6d43f6ec3'; 