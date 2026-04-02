import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const businessType = searchParams.get('business_type') || ''

    // Build query with filters
    let query = supabaseAdmin
      .from('companies')
      .select('*')

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

    // Get all companies with filters
    const { data: companies, error } = await query.order('scraped_at', { ascending: false })

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    // Generate CSV
    const headers = ['Name', 'Location', 'Email', 'Website', 'Business Type', 'Date Scraped']
    const rows = (companies || []).map(company => [
      company.name || '',
      company.location || '',
      company.email || '',
      company.website || '',
      company.business_type || '',
      company.scraped_at ? new Date(company.scraped_at).toLocaleDateString('en-GB') : '',
    ])

    // Combine headers and rows with CSV formatting
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="companies-export-${new Date().toISOString().split('T')[0]}.csv"`,
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
