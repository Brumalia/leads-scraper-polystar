import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { searchCompanies as searchCompaniesHouse } from '@/lib/companies-house'
import { searchPlaces as searchGooglePlaces } from '@/lib/google-places'
import { scrapeCompanies as scrapeWeb } from '@/lib/scraper'
import { mergeCompanies, filterByLocation, normalizeCompany, validateCompany } from '@/lib/deduplication'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { industry = 'all', location = 'north england' } = body

    console.log(`Starting scrape: industry=${industry}, location=${location}`)

    // Create scrape run record
    const { data: scrape, error: scrapeError } = await supabaseAdmin
      .from('scrapes')
      .insert({
        run_date: new Date().toISOString().split('T')[0],
        companies_found: 0,
        companies_added: 0,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (scrapeError) {
      console.error('Error creating scrape run:', scrapeError)
      throw new Error('Failed to create scrape run')
    }

    const scrapeId = scrape.id

    try {
      // Step 1: Search Companies House
      console.log('Step 1: Searching Companies House API...')
      const companiesHouseResults: unknown[] = []

      try {
        const searchQueries = industry === 'all' 
          ? ['manufacturer', 'producer', 'brewery', 'distillery', 'food production']
          : [industry + ' manufacturer', industry + ' producer']

        for (const query of searchQueries) {
          const results = await searchCompaniesHouse(query)
          companiesHouseResults.push(...results)
          console.log(`Companies House found ${results.length} companies for "${query}"`)
        }
      } catch (error) {
        console.error('Companies House API error:', error)
      }

      // Step 2: Search Google Places
      console.log('Step 2: Searching Google Places API...')
      const googlePlacesResults: unknown[] = []

      try {
        const searchQueries = industry === 'all'
          ? ['manufacturing', 'food production', 'brewery', 'distillery']
          : [industry + ' manufacturing']

        for (const query of searchQueries) {
          const results = await searchGooglePlaces(query)
          googlePlacesResults.push(...results)
          console.log(`Google Places found ${results.length} places for "${query}"`)
        }
      } catch (error) {
        console.error('Google Places API error:', error)
      }

      // Step 3: Web scraping with Playwright
      console.log('Step 3: Web scraping with Playwright...')
      const webResults: unknown[] = []

      try {
        const searchQueries = industry === 'all'
          ? ['food manufacturer', 'brewery', 'distillery']
          : [industry + ' manufacturer']

        for (const query of searchQueries) {
          const results = await scrapeWeb(query, location, ['192', 'yell'])
          webResults.push(...results)
          console.log(`Web scraping found ${results.length} companies for "${query}"`)
        }
      } catch (error) {
        console.error('Web scraping error:', error)
      }

      // Step 4: Merge and deduplicate
      console.log('Step 4: Merging and deduplicating data...')
      const companiesBySource: Record<string, unknown[]> = {
        'companies_house': companiesHouseResults,
        'google_places': googlePlacesResults,
        'web_scraping': webResults,
      }

      const { companies: mergedCompanies, duplicatesRemoved, conflictsResolved } = mergeCompanies(companiesBySource)
      console.log(`Merged ${mergedCompanies.length} companies, removed ${duplicatesRemoved} duplicates, resolved ${conflictsResolved} conflicts`)

      // Step 5: Filter by location (North England)
      console.log('Step 5: Filtering by location (North England)...')
      const locationFiltered = filterByLocation(mergedCompanies)
      console.log(`Location filter: ${locationFiltered.length} companies in North England`)

      // Step 6: Normalize and validate
      console.log('Step 6: Normalizing and validating data...')
      const normalized = locationFiltered
        .map(normalizeCompany)
        .filter(validateCompany)
      console.log(`After validation: ${normalized.length} valid companies`)

      // Step 7: Store in database
      console.log('Step 7: Storing companies in database...')
      let companiesAdded = 0
      let companiesUpdated = 0

      for (const company of normalized) {
        // Check if company already exists
        const { data: existing } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('name', company.name)
          .eq('location', company.location)
          .limit(1)

        if (existing && existing.length > 0) {
          // Update existing company
          const existingCompany = existing[0]
          
          const { error: updateError } = await supabaseAdmin
            .from('companies')
            .update({
              email: company.email || existingCompany.email,
              website: company.website || existingCompany.website,
              contact_phone: company.contact_phone || existingCompany.contact_phone,
              business_type: company.business_type || existingCompany.business_type,
              industry: company.industry || existingCompany.industry,
              company_size: company.company_size || existingCompany.company_size,
              is_contract_packer: company.is_contract_packer !== undefined ? company.is_contract_packer : existingCompany.is_contract_packer,
              is_growing: company.is_growing !== undefined ? company.is_growing : existingCompany.is_growing,
              scraped_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCompany.id)

          if (!updateError) {
            companiesUpdated++
          }
        } else {
          // Insert new company
          const { error: insertError } = await supabaseAdmin
            .from('companies')
            .insert({
              name: company.name,
              location: company.location,
              email: company.email,
              website: company.website,
              business_type: company.business_type,
              industry: company.industry,
              company_size: company.company_size,
              contact_phone: company.contact_phone,
              is_contract_packer: company.is_contract_packer,
              is_growing: company.is_growing,
              scraped_at: new Date().toISOString(),
            })

          if (!insertError) {
            companiesAdded++
          }
        }
      }

      console.log(`Stored: ${companiesAdded} new, ${companiesUpdated} updated`)

      // Step 8: Update scrape run record
      const { error: updateError } = await supabaseAdmin
        .from('scrapes')
        .update({
          companies_found: normalized.length,
          companies_added: companiesAdded,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', scrapeId)

      if (updateError) {
        console.error('Error updating scrape run:', updateError)
      }

      return NextResponse.json({
        message: 'Scrape completed successfully',
        status: 'completed',
        scrapeId,
        results: {
          companiesFound: normalized.length,
          companiesAdded,
          companiesUpdated,
          duplicatesRemoved,
          conflictsResolved,
        },
        sources: {
          companiesHouse: companiesHouseResults.length,
          googlePlaces: googlePlacesResults.length,
          webScraping: webResults.length,
        },
      })

    } catch (error) {
      // Update scrape run with error status
      await supabaseAdmin
        .from('scrapes')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', scrapeId)

      throw error
    }

  } catch (error) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
