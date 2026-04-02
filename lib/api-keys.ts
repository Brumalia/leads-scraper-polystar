/**
 * Get API key securely from encrypted storage
 */

import { supabaseAdmin } from '@/lib/supabase'
import { decrypt } from '@/lib/encryption'

/**
 * Get API key for a service
 * This decrypts the key from the database
 */
export async function getApiKey(service: string): Promise<string> {
  try {
    // Fetch the encrypted key
    const { data: keyData, error } = await supabaseAdmin
      .from('api_keys')
      .select('encrypted_key, salt, iv, is_active')
      .eq('service', service)
      .limit(1)
      .single()

    if (error) {
      throw new Error(`Failed to fetch API key for ${service}: ${error.message}`)
    }

    if (!keyData) {
      throw new Error(`No API key found for service: ${service}`)
    }

    if (!keyData.is_active) {
      throw new Error(`API key for ${service} is inactive`)
    }

    // Decrypt the key
    const decryptedKey = await decrypt(keyData.encrypted_key, keyData.salt, keyData.iv)

    return decryptedKey
  } catch (error) {
    console.error(`Error getting API key for ${service}:`, error)
    throw error
  }
}

/**
 * Get Companies House API key
 */
export async function getCompaniesHouseApiKey(): Promise<string> {
  return getApiKey('companies_house')
}

/**
 * Get Google Places API key
 */
export async function getGooglePlacesApiKey(): Promise<string> {
  return getApiKey('google_places')
}

/**
 * Check if an API key exists and is active
 */
export async function hasApiKey(service: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('is_active')
      .eq('service', service)
      .limit(1)
      .single()

    if (error) {
      return false
    }

    return data?.is_active === true
  } catch {
    return false
  }
}
