import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all scrape runs with pagination
    const { data: scrapes, error } = await supabaseAdmin
      .from('scrapes')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching scrapes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scrapes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      scrapes: scrapes || [],
      count: scrapes?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
