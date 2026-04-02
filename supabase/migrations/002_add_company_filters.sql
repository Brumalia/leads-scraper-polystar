-- Migration: 002_add_company_filters
-- Description: Add industry, company_size, contact_phone, is_contract_packer, is_growing to companies table

-- Add new columns to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS company_size TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_contract_packer BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_growing BOOLEAN DEFAULT FALSE;

-- Create indexes for new filter columns
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_company_size ON companies(company_size);
CREATE INDEX IF NOT EXISTS idx_companies_is_contract_packer ON companies(is_contract_packer);
CREATE INDEX IF NOT EXISTS idx_companies_is_growing ON companies(is_growing);

-- Add comments for documentation
COMMENT ON COLUMN companies.industry IS 'Industry category: food & drink, pharma, chemicals, or other';
COMMENT ON COLUMN companies.company_size IS 'Company size: micro, small, medium, or large';
COMMENT ON COLUMN companies.contact_phone IS 'Contact phone number';
COMMENT ON COLUMN companies.is_contract_packer IS 'Flag for contract packing/bottling companies';
COMMENT ON COLUMN companies.is_growing IS 'Flag for companies actively growing/expanding';
