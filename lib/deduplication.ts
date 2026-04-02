/**
 * Data Deduplication and Processing
 * Merges data from multiple sources, removes duplicates, resolves conflicts
 */

interface Company {
  id?: string
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
  scraped_at?: string
  created_at?: string
  updated_at?: string
}

interface MergeResult {
  companies: Company[]
  duplicatesRemoved: number
  conflictsResolved: number
}

/**
 * Generate a unique key for a company
 */
function generateCompanyKey(company: Company): string {
  const normalizedName = company.name.toLowerCase().trim()
  const normalizedLocation = (company.location || '').toLowerCase().trim()
  
  return `${normalizedName}|${normalizedLocation}`
}

/**
 * Merge companies from multiple sources
 */
export function mergeCompanies(companiesBySource: Record<string, unknown[]>): MergeResult {
  const mergedMap = new Map<string, Company>()
  let duplicatesRemoved = 0
  let conflictsResolved = 0
  
  // Process each source's companies
  for (const [, companies] of Object.entries(companiesBySource)) {
    for (const company of companies as Company[]) {
      const key = generateCompanyKey(company)
      
      if (mergedMap.has(key)) {
        // Duplicate found - merge data
        const existing = mergedMap.get(key)!
        const merged = resolveConflict(existing, company)
        
        if (merged !== existing) {
          conflictsResolved++
        }
        
        mergedMap.set(key, merged)
        duplicatesRemoved++
      } else {
        // New company
        mergedMap.set(key, company)
      }
    }
  }
  
  return {
    companies: Array.from(mergedMap.values()),
    duplicatesRemoved,
    conflictsResolved,
  }
}

/**
 * Resolve conflicts between two company records
 * Prefer more recent and more complete data
 */
function resolveConflict(existing: Company, newRecord: Company): Company {
  const merged = { ...existing }
  
  // Prefer non-null values
  if (newRecord.email && !merged.email) merged.email = newRecord.email
  if (newRecord.website && !merged.website) merged.website = newRecord.website
  if (newRecord.contact_phone && !merged.contact_phone) merged.contact_phone = newRecord.contact_phone
  
  // Prefer more specific business type
  if (newRecord.business_type && (!merged.business_type || merged.business_type === 'Other')) {
    merged.business_type = newRecord.business_type
  }
  
  // Prefer more specific industry
  if (newRecord.industry && (!merged.industry || merged.industry === 'other')) {
    merged.industry = newRecord.industry
  }
  
  // Update timestamp
  const existingDate = new Date(existing.scraped_at || existing.created_at || 0)
  const newDate = new Date(newRecord.scraped_at || newRecord.created_at || 0)
  
  if (newDate > existingDate) {
    merged.scraped_at = newRecord.scraped_at || newRecord.created_at
    merged.updated_at = new Date().toISOString()
  }
  
  return merged
}

/**
 * Remove exact duplicates
 */
export function removeDuplicates(companies: Company[]): Company[] {
  const seen = new Set<string>()
  const unique: Company[] = []
  
  for (const company of companies) {
    const key = generateCompanyKey(company)
    
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(company)
    }
  }
  
  return unique
}

/**
 * Filter companies by geographic location
 * Only include companies in North England (north of Leicester)
 */
export function filterByLocation(companies: Company[]): Company[] {
  const northEnglandCounties = [
    'Northumberland', 'Tyne and Wear', 'County Durham', 'North Yorkshire',
    'East Riding of Yorkshire', 'South Yorkshire', 'West Yorkshire',
    'Lancashire', 'Cumbria', 'Cheshire', 'Greater Manchester', 'Merseyside'
  ]
  
  return companies.filter(company => {
    if (!company.location) return false
    
    const locationLower = company.location.toLowerCase()
    
    // Check if location contains a North England county
    return northEnglandCounties.some(county => 
      locationLower.includes(county.toLowerCase())
    )
  })
}

/**
 * Classify company industry from business description
 */
export function classifyIndustry(businessType?: string, description?: string): string {
  if (!businessType && !description) return 'other'
  
  const text = ((businessType || '') + ' ' + (description || '')).toLowerCase()
  
  // Industry keywords
  const industryKeywords: Record<string, string[]> = {
    'food & drink': [
      'food', 'drink', 'beverage', 'brewery', 'distillery', 'winery',
      'restaurant', 'cafe', 'bakery', 'catering', 'pub', 'bar',
      'ice cream', 'confectionery', 'snacks'
    ],
    'pharma': [
      'pharmaceutical', 'medicine', 'drug', 'medical', 'pharmacy',
      'biotech', 'biotechnology', 'healthcare'
    ],
    'chemicals': [
      'chemical', 'plastic', 'polymer', 'cosmetics', 'paint',
      'coatings', 'industrial', 'manufacturing'
    ],
  }
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return industry
    }
  }
  
  return 'other'
}

/**
 * Determine if company is a contract packer
 */
export function isContractPacker(businessType?: string, description?: string): boolean {
  if (!businessType && !description) return false
  
  const text = ((businessType || '') + ' ' + (description || '')).toLowerCase()
  
  const contractPackerKeywords = [
    'contract packer', 'contract packing', 'co-packer', 'copacker',
    'contract filler', 'contract filling', 'bottling contract', 'canning contract'
  ]
  
  return contractPackerKeywords.some(keyword => text.includes(keyword))
}

/**
 * Determine if company is growing
 */
export function isGrowingCompany(description?: string): boolean {
  if (!description) return false
  
  const text = description.toLowerCase()
  
  const growingKeywords = [
    'expanding', 'growth', 'growing', 'newly opened', 'opened',
    'hiring', 'recruiting', 'vacancy', 'jobs available'
  ]
  
  return growingKeywords.some(keyword => text.includes(keyword))
}

/**
 * Validate company data
 */
export function validateCompany(company: Company): boolean {
  // Name is required
  if (!company.name || company.name.trim().length === 0) {
    return false
  }
  
  // Email format validation if present
  if (company.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(company.email)) {
      return false
    }
  }
  
  // Website format validation if present
  if (company.website) {
    try {
      new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`)
    } catch {
      return false
    }
  }
  
  // Phone format validation if present
  if (company.contact_phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(company.contact_phone)) {
      return false
    }
  }
  
  return true
}

/**
 * Normalize company data
 */
export function normalizeCompany(company: Company): Company {
  const normalized = { ...company }
  
  // Normalize name
  normalized.name = normalized.name.trim()
  
  // Normalize location
  normalized.location = normalized.location?.trim() || null
  
  // Normalize email
  normalized.email = normalized.email?.trim().toLowerCase() || null
  
  // Normalize website
  if (normalized.website) {
    let website = normalized.website.trim().toLowerCase()
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      website = `https://${website}`
    }
    normalized.website = website
  }
  
  // Normalize phone
  normalized.contact_phone = normalized.contact_phone?.replace(/\s/g, '') || null
  
  return normalized
}

/**
 * Calculate confidence score for company data
 */
export function calculateConfidence(company: Company): number {
  let score = 0
  
  // Name contributes to confidence
  if (company.name) score += 20
  
  // Location contributes
  if (company.location) score += 15
  
  // Contact information contributes
  if (company.email) score += 15
  if (company.website) score += 10
  if (company.contact_phone) score += 10
  
  // Business classification contributes
  if (company.business_type) score += 10
  if (company.industry && company.industry !== 'other') score += 10
  
  // Company size contributes
  if (company.company_size) score += 10
  
  return Math.min(score, 100)
}

/**
 * Sort companies by confidence score
 */
export function sortByConfidence(companies: Company[]): Company[] {
  return companies.sort((a, b) => {
    const scoreA = calculateConfidence(a)
    const scoreB = calculateConfidence(b)
    return scoreB - scoreA
  })
}
