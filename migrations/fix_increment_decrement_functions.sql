-- Functions to safely increment and decrement counters

-- Function to increment a counter
CREATE OR REPLACE FUNCTION increment(row_id UUID) 
RETURNS INT AS $$
DECLARE
  current_count INT;
BEGIN
  -- Get current count
  SELECT upvotes INTO current_count
  FROM feature_requests
  WHERE id = row_id;
  
  -- Return incremented value
  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- Function to decrement a counter
CREATE OR REPLACE FUNCTION decrement(row_id UUID) 
RETURNS INT AS $$
DECLARE
  current_count INT;
BEGIN
  -- Get current count
  SELECT upvotes INTO current_count
  FROM feature_requests
  WHERE id = row_id;
  
  -- Return decremented value, but never below 0
  RETURN GREATEST(0, current_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog; 