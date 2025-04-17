-- Create a function to get column names for debugging
CREATE OR REPLACE FUNCTION debug_get_column_names(table_name text)
RETURNS text[] AS $$
DECLARE
    result text[];
BEGIN
    WITH cols AS (
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
    )
    SELECT array_agg(column_name) INTO result
    FROM cols;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to use this function
GRANT EXECUTE ON FUNCTION debug_get_column_names(text) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_get_column_names(text) TO anon;
GRANT EXECUTE ON FUNCTION debug_get_column_names(text) TO service_role; 