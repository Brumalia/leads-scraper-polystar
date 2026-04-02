-- Migration: 003_api_keys
-- Description: Create API keys table for secure storage

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL UNIQUE, -- 'companies_house', 'google_places', etc.
  encrypted_key TEXT NOT NULL, -- Encrypted API key
  salt TEXT NOT NULL, -- Encryption salt
  iv TEXT NOT NULL, -- Initialization vector
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service);

-- Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write
CREATE POLICY "No insert from client" ON api_keys
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No update from client" ON api_keys
  FOR UPDATE USING (false);

CREATE POLICY "No delete from client" ON api_keys
  FOR DELETE USING (false);

CREATE POLICY "No select from client" ON api_keys
  FOR SELECT USING (false);

-- Service role can do everything
CREATE POLICY "Service role full access" ON api_keys
  FOR ALL USING (true) WITH CHECK (true);
