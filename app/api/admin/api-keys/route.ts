import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { encrypt, validateApiKey } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/api-keys
 * List all API keys (masked)
 */
export async function GET() {
  try {
    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, service, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      )
    }

    // Return masked keys
    const maskedKeys = keys?.map(key => ({
      ...key,
      has_key: true, // Indicate that a key exists without exposing it
    })) || []

    return NextResponse.json({ keys: maskedKeys })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/api-keys
 * Create or update an API key
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, apiKey } = body

    // Validate
    if (!service) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Validate API key format
    const validation = validateApiKey(service, apiKey)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid API key' },
        { status: 400 }
      )
    }

    // Encrypt the key
    const { encrypted, salt, iv } = await encrypt(apiKey)

    // Check if key already exists
    const { data: existing } = await supabaseAdmin
      .from('api_keys')
      .select('id')
      .eq('service', service)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing key
      const { error: updateError } = await supabaseAdmin
        .from('api_keys')
        .update({
          encrypted_key: encrypted,
          salt,
          iv,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)

      if (updateError) {
        console.error('Error updating API key:', updateError)
        return NextResponse.json(
          { error: 'Failed to update API key' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'API key updated successfully',
        service,
      })
    } else {
      // Insert new key
      const { error: insertError } = await supabaseAdmin
        .from('api_keys')
        .insert({
          service,
          encrypted_key: encrypted,
          salt,
          iv,
          is_active: true,
        })

      if (insertError) {
        console.error('Error creating API key:', insertError)
        return NextResponse.json(
          { error: 'Failed to create API key' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'API key created successfully',
        service,
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
