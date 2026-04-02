/**
 * Google Places API Integration
 * API Documentation: https://developers.google.com/maps/documentation/places/web-service
 */

import { getGooglePlacesApiKey } from './api-keys'

interface PlaceSearchResponse {
  results: {
    place_id: string
    name: string
    formatted_address: string
    formatted_phone_number?: string
    international_phone_number?: string
    website?: string
    types: string[]
    geometry: {
      location: {
        lat: number
        lng: number
      }
    }
  }[]
  next_page_token?: string
  status: string
  error_message?: string
}

interface PlaceDetailsResponse {
  result: {
    place_id: string
    name: string
    formatted_address: string
    formatted_phone_number?: string
    international_phone_number?: string
    website?: string
    types: string[]
    business_status?: string
    opening_hours?: {
      periods_open_now?: boolean
    }
  }
  status: string
  error_message?: string
}

/**
 * Search for places by keyword and location
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius = 50000 // 50km radius
): Promise<PlaceSearchResponse['results']> {
  const GOOGLE_PLACES_API_KEY = await getGooglePlacesApiKey()

  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured. Please configure it in Admin > API Keys.')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  url.searchParams.append('query', query)
  url.searchParams.append('key', GOOGLE_PLACES_API_KEY)

  if (location) {
    url.searchParams.append('location', `${location.lat},${location.lng}`)
    url.searchParams.append('radius', radius.toString())
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
  }

  const data: PlaceSearchResponse = await response.json()

  if (data.status === 'ZERO_RESULTS') {
    return []
  }

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`)
  }

  return data.results
}

/**
 * Get detailed place information
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse['result']> {
  const GOOGLE_PLACES_API_KEY = await getGooglePlacesApiKey()

  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured. Please configure it in Admin > API Keys.')
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.append('place_id', placeId)
  url.searchParams.append('fields', 'place_id,name,formatted_address,formatted_phone_number,international_phone_number,website,types,business_status')
  url.searchParams.append('key', GOOGLE_PLACES_API_KEY)

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
  }

  const data: PlaceDetailsResponse = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status} - ${data.error_message}`)
  }

  return data.result
}

/**
 * Extract contact information from place data
 */
export function extractContactInfo(place: PlaceSearchResponse['results'][0] | PlaceDetailsResponse['result']) {
  return {
    phone: place.formatted_phone_number || place.international_phone_number || null,
    website: place.website || null,
    types: place.types || [],
    businessStatus: 'business_status' in place ? place.business_status : undefined,
  }
}

/**
 * Check if location is in North England
 * Leicester is approximately at 52.6369° N, -1.1397° W
 */
export function isNorthEngland(lat: number): boolean {
  const leicesterLat = 52.6369
  
  // North England is generally considered to be north of Leicester
  return lat > leicesterLat
}

/**
 * Extract UK business types from Google Places types
 */
export function extractBusinessType(types: string[]): string | null {
  const businessTypeMappings: Record<string, string> = {
    'food': 'Food Production',
    'restaurant': 'Restaurant',
    'bar': 'Beverage',
    'cafe': 'Beverage',
    'bakery': 'Food Production',
    'grocery_or_supermarket': 'Retail',
    'store': 'Retail',
    'establishment': '', // Generic, don't use
  }

  for (const type of types) {
    const typeLower = type.toLowerCase()
    for (const [googleType, businessType] of Object.entries(businessTypeMappings)) {
      if (typeLower.includes(googleType) && businessType) {
        return businessType
      }
    }
  }

  return null
}

/**
 * Google Places API quota: $200 credit/month
 * ~$0.002 per call (or $0.007 per call with Places Details)
 */
const quotaManager = {
  calls: 0,
  lastReset: Date.now(),
  dailyLimit: 60000, // Approximate daily limit based on $200 credit
  
  async checkQuota(): Promise<boolean> {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    
    if (now - this.lastReset > dayMs) {
      this.calls = 0
      this.lastReset = now
    }
    
    if (this.calls >= this.dailyLimit) {
      return false
    }
    
    this.calls++
    return true
  },
}

export { quotaManager }
