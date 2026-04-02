/**
 * Companies House API Integration
 * API Documentation: https://developer.company-information.service.gov.uk/
 */

import { getCompaniesHouseApiKey } from './api-keys'

interface CompaniesHouseSearchResponse {
  items: {
    company_type: string
    title: string
    company_number: string
    date_of_creation: string
    description: string
    description_identifier: string
    links: {
      self: string
    }
    address: {
      locality: string
      country: string
      region: string
      postal_code: string
    }
    kind: string
  }[]
}

interface CompaniesHouseProfileResponse {
  company_number: string
  company_name: string
  registered_office_address: {
    locality: string
    country: string
    region: string
    postal_code: string
  }
  sic_codes?: {
    sic_codes?: string[]
  }
  date_of_creation: string
  accounts?: {
    last_accounts?: {
      type: string
    }
  }
}

interface ScrapedCompany {
  name: string
  location: string | null
  email: string | null
  website: string | null
  business_type: string | null
  industry: string | null
  company_size: string | null
  contact_phone: string | null
  is_contract_packer: boolean
  is_growing: boolean
}

const COMPANIES_HOUSE_API_URL = 'https://api.company-information.service.gov.uk'

/**
 * Search for companies by keyword
 */
export async function searchCompanies(
  query: string,
  page = 1,
  items_per_page = 100
): Promise<ScrapedCompany[]> {
  const COMPANIES_HOUSE_API_KEY = await getCompaniesHouseApiKey()

  if (!COMPANIES_HOUSE_API_KEY) {
    throw new Error('Companies House API key not configured. Please configure it in Admin > API Keys.')
  }

  const url = new URL(`${COMPANIES_HOUSE_API_URL}/search/companies`)
  url.searchParams.append('q', query)
  url.searchParams.append('start_index', ((page - 1) * items_per_page).toString())
  url.searchParams.append('items_per_page', items_per_page.toString())

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ':').toString('base64')}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Companies House API error: ${response.status} ${response.statusText}`)
  }

  const data: CompaniesHouseSearchResponse = await response.json()

  // Transform to our schema
  const companies: ScrapedCompany[] = data.items
    .filter((item) => item.company_type !== 'ltd') // Skip limited companies
    .map((item) => ({
      name: item.title,
      location: item.address?.locality || item.address?.region || null,
      email: null, // Companies House doesn't provide email
      website: null, // Will be fetched from other sources
      business_type: item.description || null,
      industry: classifyIndustry(item.sic_codes?.sic_codes || []),
      company_size: estimateCompanySize({
        date_of_creation: item.date_of_creation,
        accounts: undefined,
      }),
      contact_phone: null,
      is_contract_packer: false, // Will be determined from description
      is_growing: false, // Will be determined from accounts
    }))

  return companies
}

/**
 * Get detailed company profile
 */
export async function getCompanyProfile(
  companyNumber: string
): Promise<ScrapedCompany | null> {
  const COMPANIES_HOUSE_API_KEY = await getCompaniesHouseApiKey()

  if (!COMPANIES_HOUSE_API_KEY) {
    throw new Error('Companies House API key not configured. Please configure it in Admin > API Keys.')
  }

  const response = await fetch(
    `${COMPANIES_HOUSE_API_URL}/company/${companyNumber}`,
    {
      headers: {
        'Authorization': `Basic ${Buffer.from(COMPANIES_HOUSE_API_KEY + ':').toString('base64')}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Companies House API error: ${response.status} ${response.statusText}`)
  }

  const data: CompaniesHouseProfileResponse = await response.json()

  return {
    name: data.company_name,
    location: data.registered_office_address?.locality || data.registered_office_address?.region || null,
    email: null,
    website: null,
    business_type: null,
    industry: classifyIndustry(data.sic_codes?.sic_codes || []),
    company_size: estimateCompanySize({
      date_of_creation: data.date_of_creation,
      accounts: data.accounts,
    }),
    contact_phone: null,
    is_contract_packer: false,
    is_growing: false,
  }
}

/**
 * Classify company by SIC codes
 */
function classifyIndustry(sicCodes: string[]): string {
  if (sicCodes.length === 0) return 'other'

  // SIC code mappings (simplified)
  const industryMappings: Record<string, string[]> = {
    'food & drink': ['107', '110', '463', '561', '562'],
    'pharma': ['211', '212', '213'],
    'chemicals': ['201', '202', '203', '204', '205'],
  }

  // Check each industry's SIC codes
  for (const [industry, codes] of Object.entries(industryMappings)) {
    if (sicCodes.some((code: string) => codes.some((prefix: string) => code.startsWith(prefix)))) {
      return industry
    })
  }

  return 'other'
}

/**
 * Estimate company size from Companies House data
 */
function estimateCompanySize(company: {
  date_of_creation: string
  accounts?: {
    last_accounts?: {
      type: string
    }
  }
}): string {
  // This is a simplified estimation based on available data
  // In production, this would use more sophisticated heuristics
  
  // If the company is new (< 1 year), it's likely micro
  const creationYear = new Date(company.date_of_creation).getFullYear()
  const currentYear = new Date().getFullYear()
  
  if (currentYear - creationYear < 1) return 'micro'
  if (currentYear - creationYear < 5) return 'small'
  if (currentYear - creationYear < 15) return 'medium'
  
  return 'large'
}

/**
 * Rate limiting: 600 requests per minute
 */
const rateLimiter = {
  requests: 0,
  resetTime: 0,
  
  async waitForSlot(): Promise<void> {
    const now = Date.now()
    
    if (now > this.resetTime) {
      this.requests = 0
      this.resetTime = now + 60000
    }
    
    if (this.requests >= 600) {
      const waitTime = this.resetTime - now
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      this.requests = 0
      this.resetTime = Date.now() + 60000
    }
    
    this.requests++
  },
}

export { rateLimiter }
