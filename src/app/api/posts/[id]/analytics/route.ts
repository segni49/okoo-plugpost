import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/posts/[id]/analytics - Get post analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const postId = params.id
    const { searchParams } = new URL(request.url)
    const range = searchParams.get("range") || "7d"

    // Check if post exists and user has permission
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.id !== post.authorId && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Calculate date range
    let startDate: Date
    const now = new Date()
    
    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(0) // All time
    }

    // Get or create analytics record
    let analytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    })

    if (!analytics) {
      analytics = await prisma.postAnalytics.create({
        data: {
          postId,
          views: post.viewCount,
          uniqueViews: Math.floor(post.viewCount * 0.7), // Estimate unique views
          avgReadTime: 120, // Default 2 minutes
          bounceRate: 65.0, // Default bounce rate
          socialShares: 0,
        },
      })
    }

    // Get time-based counts (for the selected range)
    const [commentsInRange, likesInRange, bookmarksInRange] = await Promise.all([
      prisma.comment.count({
        where: {
          postId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.like.count({
        where: {
          postId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.bookmark.count({
        where: {
          postId,
          createdAt: { gte: startDate },
        },
      }),
    ])

    // Calculate views for the range (simplified - in a real app you'd track this properly)
    const viewsInRange = range === "all" 
      ? analytics.views 
      : Math.floor(analytics.views * (range === "7d" ? 0.3 : range === "30d" ? 0.7 : 0.9))

    const responseData = {
      views: viewsInRange,
      uniqueViews: Math.floor(viewsInRange * 0.7),
      comments: commentsInRange,
      likes: likesInRange,
      bookmarks: bookmarksInRange,
      shares: analytics.socialShares,
      avgReadTime: analytics.avgReadTime || 120,
      bounceRate: analytics.bounceRate || 65.0,
      publishedAt: post.publishedAt,
      lastViewed: analytics.updatedAt,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error fetching post analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id]/analytics - Update analytics (for tracking views, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id
    const { event, data } = await request.json()

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Get or create analytics record
    let analytics = await prisma.postAnalytics.findUnique({
      where: { postId },
    })

    if (!analytics) {
      analytics = await prisma.postAnalytics.create({
        data: {
          postId,
          views: 0,
          uniqueViews: 0,
          avgReadTime: 0,
          bounceRate: 0,
          socialShares: 0,
        },
      })
    }

    // Handle different events
    switch (event) {
      case "view":
        await prisma.postAnalytics.update({
          where: { postId },
          data: {
            views: { increment: 1 },
            uniqueViews: data?.isUnique ? { increment: 1 } : undefined,
          },
        })
        break

      case "read_time":
        if (data?.readTime) {
          // Update average read time
          const newAvgReadTime = analytics.avgReadTime 
            ? (analytics.avgReadTime + data.readTime) / 2
            : data.readTime
          
          await prisma.postAnalytics.update({
            where: { postId },
            data: {
              avgReadTime: newAvgReadTime,
            },
          })
        }
        break

      case "share":
        await prisma.postAnalytics.update({
          where: { postId },
          data: {
            socialShares: { increment: 1 },
          },
        })
        break

      case "bounce":
        if (data?.bounced !== undefined) {
          // Update bounce rate (simplified calculation)
          const newBounceRate = analytics.bounceRate
            ? (analytics.bounceRate + (data.bounced ? 100 : 0)) / 2
            : data.bounced ? 100 : 0
          
          await prisma.postAnalytics.update({
            where: { postId },
            data: {
              bounceRate: newBounceRate,
            },
          })
        }
        break

      default:
        return NextResponse.json(
          { error: "Invalid event type" },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating analytics:", error)
    return NextResponse.json(
      { error: "Failed to update analytics" },
      { status: 500 }
    )
  }
}
