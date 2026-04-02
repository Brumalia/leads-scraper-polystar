/**
 * Web Scraper using Playwright
 * Target sources: 192.com, Yell.com, industry association sites
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright'

interface ScrapedCompanyData {
  name: string
  location: string | null
  email: string | null
  website: string | null
  business_type: string | null
  contact_phone: string | null
}

/**
 * Scrape 192.com for company information
 */
async function scrape192(page: Page, query: string, location?: string): Promise<ScrapedCompanyData[]> {
  const searchPath = `/search?q=${encodeURIComponent(query)}${location ? `,${encodeURIComponent(location)}` : ''}`
  
  await page.goto(`https://www.192.com${searchPath}`)
  
  // Wait for results to load
  await page.waitForSelector('.data-list', { timeout: 10000 }).catch(() => null)
  
  const companies: ScrapedCompanyData[] = []
  
  // Extract company data from listings
  const listings = await page.$$('.data-list li')
  
  for (const listing of listings) {
    try {
      const name = await listing.$eval('.name', el => el.textContent?.trim()) || null
      const address = await listing.$eval('.address', el => el.textContent?.trim()) || null
      const phone = await listing.$eval('.phone', el => el.textContent?.trim()) || null
      
      // Click to get more details
      const link = await listing.$('a')
      if (link) {
        const href = await link.getAttribute('href')
        if (href) {
          await link.click()
          await page.waitForLoadState('networkidle')
          
          const email = await page.$eval('.email', el => el.textContent?.trim()).catch(() => null)
          const website = await page.$eval('.website', el => el.textContent?.trim()).catch(() => null)
          
          companies.push({
            name: name || '',
            location: address,
            email: email || null,
            website: website || null,
            business_type: null,
            contact_phone: phone || null,
          })
          
          await page.goBack()
        }
      }
    } catch (error) {
      console.error('Error extracting 192.com listing:', error)
    }
  }
  
  return companies
}

/**
 * Scrape Yell.com for company information
 */
async function scrapeYell(page: Page, query: string, location?: string): Promise<ScrapedCompanyData[]> {
  const searchPath = `https://www.yell.com/uk/${location ? location + '/' : ''}${encodeURIComponent(query)}`
  
  await page.goto(searchPath)
  
  // Wait for results to load
  await page.waitForSelector('.resultsListing', { timeout: 10000 }).catch(() => null)
  
  const companies: ScrapedCompanyData[] = []
  
  const listings = await page.$$('.row')
  
  for (const listing of listings) {
    try {
      const name = await listing.$eval('.businessName', el => el.textContent?.trim()) || null
      const address = await listing.$eval('.address', el => el.textContent?.trim()) || null
      const phone = await listing.$eval('.phoneNumber', el => el.textContent?.trim()) || null
      
      companies.push({
        name: name || '',
        location: address,
        email: null, // Yell doesn't typically show email
        website: null, // Will need to click through to get website
        business_type: null,
        contact_phone: phone || null,
      })
    } catch (error) {
      console.error('Error extracting Yell listing:', error)
    }
  }
  
  return companies
}

/**
 * Check robots.txt compliance
 */
async function checkRobotsCompliance(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}/robots.txt`)
    if (!response.ok) {
      // If robots.txt is not accessible, proceed cautiously
      return true
    }
    
    const robotsTxt = await response.text()
    
    // Check if scraping is disallowed
    const lines = robotsTxt.split('\n')
    for (const line of lines) {
      if (line.toLowerCase().startsWith('disallow:')) {
        if (line.includes('*')) {
          // Completely disallowed
          return false
        }
      }
    }
    
    return true
  } catch (error) {
    console.error(`Error checking robots.txt for ${domain}:`, error)
    return true // Proceed if we can't check
  }
}

/**
 * Main scraper function
 */
export async function scrapeCompanies(
  query: string,
  location?: string,
  targets: string[] = ['192', 'yell']
): Promise<ScrapedCompanyData[]> {
  const allCompanies: ScrapedCompanyData[] = []
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  
  try {
    browser = await chromium.launch({
      headless: true,
    })
    
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    })
    
    const page = await context.newPage()
    
    // Configure request timeout
    page.setDefaultTimeout(30000)
    
    // Scrape from each target
    if (targets.includes('192')) {
      try {
        if (await checkRobotsCompliance('192.com')) {
          const results = await scrape192(page, query, location)
          allCompanies.push(...results)
          console.log(`Scraped ${results.length} companies from 192.com`)
          
          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Error scraping 192.com:', error)
      }
    }
    
    if (targets.includes('yell')) {
      try {
        if (await checkRobotsCompliance('yell.com')) {
          const results = await scrapeYell(page, query, location)
          allCompanies.push(...results)
          console.log(`Scraped ${results.length} companies from Yell.com`)
          
          // Rate limit: 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error('Error scraping Yell.com:', error)
      }
    }
    
  } catch (error) {
    console.error('Scraping error:', error)
    throw error
  } finally {
    await context?.close()
    await browser?.close()
  }
  
  return allCompanies
}

/**
 * Scrape a single company's detailed information
 */
export async function scrapeCompanyDetails(url: string): Promise<Partial<ScrapedCompanyData> | null> {
  let browser: Browser | null = null
  let context: BrowserContext | null = null
  
  try {
    browser = await chromium.launch({ headless: true })
    context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto(url, { waitUntil: 'networkidle' })
    
    // Extract common fields
    const email = await page.$eval('.email, [href^="mailto:"]', el => 
      el.textContent?.trim() || el.getAttribute('href')?.replace('mailto:', '') || ''
    ).catch(() => null)
    
    const phone = await page.$eval('.phone, [href^="tel:"]', el =>
      el.textContent?.trim() || el.getAttribute('href')?.replace('tel:', '') || ''
    ).catch(() => null)
    
    const website = await page.$eval('.website, [href^="http"]', el =>
      el.getAttribute('href') || ''
    ).catch(() => null)
    
    return {
      email: email || null,
      contact_phone: phone || null,
      website: website || null,
    }
    
  } catch (error) {
    console.error(`Error scraping company details from ${url}:`, error)
    return null
  } finally {
    await context?.close()
    await browser?.close()
  }
}

/**
 * Retry logic for failed scrapes
 */
export async function scrapeWithRetry<T>(
  scrapeFn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await scrapeFn()
    } catch (error) {
      lastError = error as Error
      console.error(`Scrape attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, backoffMs * attempt))
      }
    }
  }
  
  throw lastError || new Error('Scrape failed after all retries')
}

/**
 * Rate limiting: 1 request per second
 */
const rateLimiter = {
  lastRequest: 0,
  minInterval: 1000, // 1 second
  
  async waitForSlot(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequest
    
    if (elapsed < this.minInterval) {
      const waitTime = this.minInterval - elapsed
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequest = Date.now()
  },
}

export { rateLimiter }
