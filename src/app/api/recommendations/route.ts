// API endpoint for content recommendations
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-utils'
import { recommendationEngine, recommendationHelpers } from '@/lib/ai-recommendations'
import { z } from 'zod'

// Request validation schemas
const getRecommendationsSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  types: z.string().optional().transform(val => 
    val ? val.split(',') as Array<'similar_content' | 'user_interest' | 'trending' | 'collaborative_filtering' | 'content_based' | 'hybrid'> 
    : ['hybrid']
  ),
})

const trackInteractionSchema = z.object({
  postId: z.string(),
  action: z.enum(['view', 'click', 'like', 'share']),
})

// GET /api/recommendations - Get personalized recommendations for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const { limit, types } = getRecommendationsSchema.parse(Object.fromEntries(searchParams))

    // Generate recommendations
    const recommendations = await recommendationEngine.generateRecommendations(
      user.id,
      limit,
      types
    )

    // Get actual post data for recommendations
    const postIds = recommendations.map(r => r.postId)
    const posts = await Promise.all(
      postIds.map(async (postId) => {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/posts/${postId}`)
          if (response.ok) {
            return await response.json()
          }
          return null
        } catch (error) {
          console.error(`Failed to fetch post ${postId}:`, error)
          return null
        }
      })
    )

    // Combine recommendations with post data
    const enrichedRecommendations = recommendations
      .map((rec, index) => ({
        ...rec,
        post: posts[index],
      }))
      .filter(rec => rec.post !== null)

    // Store recommendations for tracking
    await recommendationEngine.storeRecommendations(user.id, recommendations)

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      total: enrichedRecommendations.length,
      userId: user.id,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

// POST /api/recommendations/track - Track user interaction with recommendations
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, action } = trackInteractionSchema.parse(body)

    // Track the interaction
    await recommendationHelpers.trackInteraction(user.id, postId, action)

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
    })
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error)
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    )
  }
}

// PUT /api/recommendations/feedback - Provide feedback on recommendations
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, feedback, reason } = body

    // Store feedback for improving recommendations
    // This would typically update the recommendation algorithm
    console.log(`User ${user.id} provided feedback for post ${postId}:`, { feedback, reason })

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
    })
  } catch (error) {
    console.error('Error recording recommendation feedback:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}
