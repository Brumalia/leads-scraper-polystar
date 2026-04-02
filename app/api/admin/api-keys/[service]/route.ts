import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { decrypt } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params

    if (!service) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      )
    }

    // Fetch the encrypted key
    const { data: keyData, error } = await supabaseAdmin
      .from('api_keys')
      .select('encrypted_key, salt, iv, is_active')
      .eq('service', service)
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching API key:', error)
      return NextResponse.json(
        { error: 'Failed to fetch API key' },
        { status: 500 }
      )
    }

    if (!keyData) {
      return NextResponse.json(
        { error: `No API key found for service: ${service}` },
        { status: 404 }
      )
    }

    if (!keyData.is_active) {
      return NextResponse.json(
        { error: 'API key is inactive' },
        { status: 400 }
      )
    }

    // Decrypt the key
    const decryptedKey = await decrypt(keyData.encrypted_key, keyData.salt, keyData.iv)

    return NextResponse.json({
      service,
      apiKey: decryptedKey,
      isActive: keyData.is_active,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const { service } = params

    if (!service) {
      return NextResponse.json(
        { error: 'Service name is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('service', service)

    if (error) {
      console.error('Error deleting API key:', error)
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `API key for ${service} deleted successfully`,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
