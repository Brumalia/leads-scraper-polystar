import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const businessType = searchParams.get('business_type') || ''

    // Build query with filters
    let query = supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact' })

    // Apply search filter (name or email)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply location filter
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }

    // Apply business_type filter
    if (businessType) {
      query = query.eq('business_type', businessType)
    }

    // Get total count with filters
    const { count: totalCount, error: countError } = await query

    if (countError) {
      console.error('Error counting companies:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch companies count' },
        { status: 500 }
      )
    }

    // Get paginated companies with filters
    const { data: companies, error } = await query
      .order('scraped_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      companies: companies || [],
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
