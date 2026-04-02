-- Migration: 001_companies_schema
-- Description: Create companies and scrapes tables for UK Food & Drink Leads Scraper

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (main lead data)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  email TEXT,
  website TEXT,
  business_type TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scrapes table (tracking daily runs)
CREATE TABLE IF NOT EXISTS scrapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date DATE NOT NULL UNIQUE,
  companies_found INTEGER DEFAULT 0,
  companies_added INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies(location);
CREATE INDEX IF NOT EXISTS idx_companies_scraped_at ON companies(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrapes_run_date ON scrapes(run_date DESC);

-- Updated_at trigger for companies
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrapes ENABLE ROW LEVEL SECURITY;

-- Companies RLS policies
-- Users can read companies
CREATE POLICY "Users can read companies" ON companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- No write access from client side (scraping is server-side only)
CREATE POLICY "No insert from client" ON companies
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No update from client" ON companies
  FOR UPDATE USING (false);

CREATE POLICY "No delete from client" ON companies
  FOR DELETE USING (false);

-- Scrapes RLS policies
-- Users can read scrapes
CREATE POLICY "Users can read scrapes" ON scrapes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- No write access from client side (scraping is server-side only)
CREATE POLICY "No insert from client" ON scrapes
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No update from client" ON scrapes
  FOR UPDATE USING (false);

CREATE POLICY "No delete from client" ON scrapes
  FOR DELETE USING (false);

-- Service role bypasses RLS for server-side operations
