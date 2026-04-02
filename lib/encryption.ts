/**
 * Utility for encrypting and decrypting API keys
 * Uses AES-256-GCM encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'

/**
 * Encrypt a string using AES-256-GCM
 */
export async function encrypt(text: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  const algorithm = 'aes-256-gcm'
  
  // Generate salt and IV
  const salt = randomBytes(16).toString('hex')
  const iv = randomBytes(16).toString('hex')
  
  // Derive key from salt
  const key = await deriveKey(salt)
  
  const cipher = createCipheriv(algorithm, key, Buffer.from(iv, 'hex'))
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  return {
    encrypted: `${encrypted}:${authTag}`,
    salt,
    iv,
  }
}

/**
 * Decrypt an encrypted string
 */
export async function decrypt(encrypted: string, salt: string, iv: string): Promise<string> {
  const algorithm = 'aes-256-gcm'
  
  // Derive key from salt
  const key = await deriveKey(salt)
  
  const decipher = createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'))
  
  const [encryptedText, authTag] = encrypted.split(':')
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Derive encryption key from salt
 * Uses a fixed passphrase (in production, this would be from environment)
 */
async function deriveKey(salt: string): Promise<Buffer> {
  const passphrase = process.env.API_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-this-in-production'
  
  return new Promise((resolve, reject) => {
    scrypt(passphrase, salt, 32, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })
}

/**
 * Mask API key for display (show only first 4 and last 4 characters)
 */
export function maskKey(key: string): string {
  if (!key || key.length < 8) return '****'
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
}

/**
 * Validate API key format
 */
export function validateApiKey(service: string, key: string): { valid: boolean; error?: string } {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API key cannot be empty' }
  }
  
  // Service-specific validation
  switch (service) {
    case 'companies_house':
      // Companies House keys are typically long strings
      if (key.length < 10) {
        return { valid: false, error: 'Companies House API key is too short' }
      }
      break
      
    case 'google_places':
      // Google API keys are typically alphanumeric with a specific format
      if (!/^[a-zA-Z0-9_-]+$/.test(key) || key.length < 20) {
        return { valid: false, error: 'Invalid Google Places API key format' }
      }
      break
      
    default:
      // Generic validation
      if (key.length < 5) {
        return { valid: false, error: 'API key is too short' }
      }
  }
  
  return { valid: true }
}
