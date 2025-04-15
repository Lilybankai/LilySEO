-- Create AI usage logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT ai_usage_logs_feature_check CHECK (
    feature IN ('content_recommendations', 'seo_recommendations', 'keyword_suggestions', 'content_optimization')
  )
);

-- Add appropriate indexes
CREATE INDEX ai_usage_logs_user_id_idx ON ai_usage_logs (user_id);
CREATE INDEX ai_usage_logs_feature_idx ON ai_usage_logs (feature);
CREATE INDEX ai_usage_logs_created_at_idx ON ai_usage_logs (created_at);

-- Set up RLS (Row Level Security)
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own usage logs
CREATE POLICY "Users can view their own AI usage logs" 
  ON ai_usage_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Only allow the service role and admins to insert records
CREATE POLICY "Service can insert AI usage logs" 
  ON ai_usage_logs FOR INSERT 
  WITH CHECK (true); -- Restricted via service role

-- Enterprise users can view all usage logs (based on subscription tier)
CREATE POLICY "Enterprise users can view all AI usage logs" 
  ON ai_usage_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      JOIN subscriptions ON profiles.id = subscriptions.user_id
      WHERE profiles.id = auth.uid() 
      AND subscriptions.tier = 'enterprise'
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT ON ai_usage_logs TO authenticated;

-- Add comment to table
COMMENT ON TABLE ai_usage_logs IS 'Stores records of AI API usage for tracking and billing purposes'; 