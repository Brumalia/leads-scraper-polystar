import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the most recent scrape status
    const { data: latestScrape, error } = await supabase
      .from('scrapes')
      .select('*')
      .order('run_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // If no scrapes exist yet, return default status
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          status: 'never_run',
          message: 'No scrapes have been run yet',
          scrape: null,
        })
      }

      console.error('Error fetching scrape status:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scrape status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: latestScrape.status,
      scrape: latestScrape,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
