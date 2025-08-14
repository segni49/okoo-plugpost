// Advanced search API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { advancedSearchEngine } from '@/lib/advanced-search'
import { z } from 'zod'

// Request validation schema
const searchSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['all', 'posts', 'users', 'categories', 'tags']).optional().default('all'),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  sortBy: z.enum(['relevance', 'date', 'popularity', 'title']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  categoryIds: z.string().optional().transform(val => val ? val.split(',') : undefined),
  tagIds: z.string().optional().transform(val => val ? val.split(',') : undefined),
  authorIds: z.string().optional().transform(val => val ? val.split(',') : undefined),
  dateFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  includeHighlights: z.string().optional().transform(val => val === 'true'),
  includeFacets: z.string().optional().transform(val => val === 'true'),
})

// GET /api/search/advanced - Perform advanced search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = searchSchema.parse(Object.fromEntries(searchParams))

    // Build search options
    const options = {
      type: params.type,
      limit: params.limit,
      offset: params.offset,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      includeHighlights: params.includeHighlights,
      includeFacets: params.includeFacets,
      filters: {
        categoryIds: params.categoryIds,
        tagIds: params.tagIds,
        authorIds: params.authorIds,
        dateRange: (params.dateFrom || params.dateTo) ? {
          from: params.dateFrom,
          to: params.dateTo,
        } : undefined,
      },
    }

    // Perform search
    const results = await advancedSearchEngine.search(params.q, options)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Advanced search error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

// POST /api/search/advanced - Perform search with complex filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      query,
      filters = {},
      options = {},
    } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Build search options from request body
    const searchOptions = {
      type: options.type || 'all',
      limit: Math.min(options.limit || 20, 100),
      offset: options.offset || 0,
      sortBy: options.sortBy || 'relevance',
      sortOrder: options.sortOrder || 'desc',
      includeHighlights: options.includeHighlights || false,
      includeFacets: options.includeFacets || false,
      filters: {
        categoryIds: filters.categoryIds,
        tagIds: filters.tagIds,
        authorIds: filters.authorIds,
        dateRange: filters.dateRange,
        status: filters.status,
      },
    }

    // Perform search
    const results = await advancedSearchEngine.search(query.trim(), searchOptions)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Advanced search POST error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
