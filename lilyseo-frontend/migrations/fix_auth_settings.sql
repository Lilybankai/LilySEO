-- Migration to document Auth settings changes needed
-- These changes must be made in the Supabase dashboard, not via SQL

/*
This migration serves as documentation for changes that need to be made manually in the Supabase dashboard.

1. WARNING: Auth OTP long expiry
   - Issue: OTP expiry exceeds recommended threshold (more than an hour)
   - Solution: Go to Auth -> Provider Settings -> Email -> OTP expiry time
   - Change the OTP expiry time to 3600 seconds (1 hour) or less
   - Recommended value: 1800 seconds (30 minutes)

2. WARNING: Leaked Password Protection Disabled
   - Issue: Leaked password protection is currently disabled
   - Solution: Go to Auth -> Provider Settings -> Email -> Password security
   - Enable "Check user passwords against data breaches" 
   - This enhances security by checking passwords against HaveIBeenPwned.org
  
These settings cannot be changed through SQL migrations and must be updated
through the Supabase Dashboard interface.
*/

-- Make a dummy change to ensure the migration is valid
DO $$
BEGIN
  RAISE NOTICE 'Auth settings must be updated manually in the Supabase dashboard.';
END
$$; 