import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// Types for analytics response
interface AnalyticsOverview {
  totalPosts: number
  totalUsers: number
  totalComments: number
  totalViews: number
  publishedPosts: number
  recentPosts: number
  recentUsers: number
  recentComments: number
}

interface TopPost {
  id: string
  title: string
  slug: string
  viewCount: number
  author: {
    name: string | null
  }
  _count: {
    comments: number
    likes: number
  }
}

interface DailyView {
  date: Date
  views: number
  uniqueViews: number
}

interface CategoryStat {
  id: string
  name: string
  slug: string
  color: string | null
  totalPosts: number
  recentPosts: number
  totalViews: number
  totalComments: number
  totalLikes: number
}

interface TopAuthor {
  id: string
  name: string | null
  totalPosts: number
  recentPosts: number
  totalViews: number
  totalComments: number
  totalLikes: number
}

interface PostWithCounts {
  viewCount: number
  _count: {
    comments: number
    likes: number
  }
}

interface AnalyticsResponse {
  overview?: AnalyticsOverview
  topPosts?: TopPost[]
  dailyViews?: DailyView[]
  categories?: CategoryStat[]
  topAuthors?: TopAuthor[]
}

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days
    const type = searchParams.get("type") || "overview"

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const analytics: AnalyticsResponse = {}

    if (type === "overview" || type === "all") {
      // Overview statistics
      const [
        totalPosts,
        totalUsers,
        totalComments,
        totalViews,
        publishedPosts,
        recentPosts,
        recentUsers,
        recentComments,
      ] = await Promise.all([
        prisma.post.count(),
        prisma.user.count(),
        prisma.comment.count(),
        prisma.postAnalytics.aggregate({
          _sum: { views: true },
        }),
        prisma.post.count({
          where: { status: "PUBLISHED" },
        }),
        prisma.post.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.comment.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
      ])

      analytics.overview = {
        totalPosts,
        totalUsers,
        totalComments,
        totalViews: totalViews._sum.views || 0,
        publishedPosts,
        recentPosts,
        recentUsers,
        recentComments,
      }
    }

    if (type === "posts" || type === "all") {
      // Top posts by views
      const topPosts = await prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: startDate },
        },
        include: {
          author: {
            select: { name: true },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: { viewCount: "desc" },
        take: 10,
      })

      analytics.topPosts = topPosts
    }

    if (type === "traffic" || type === "all") {
      // Daily traffic data - using createdAt since PostAnalytics doesn't have a date field
      const dailyViews = await prisma.postAnalytics.groupBy({
        by: ["createdAt"],
        where: {
          createdAt: { gte: startDate },
        },
        _sum: {
          views: true,
          uniqueViews: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      })

      analytics.dailyViews = dailyViews.map(day => ({
        date: day.createdAt,
        views: day._sum.views || 0,
        uniqueViews: day._sum.uniqueViews || 0,
      }))
    }

    if (type === "categories" || type === "all") {
      // Category performance
      const categoryStats = await prisma.category.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
          posts: {
            where: {
              status: "PUBLISHED",
              publishedAt: { gte: startDate },
            },
            select: {
              viewCount: true,
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          },
        },
      })

      analytics.categories = categoryStats.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        totalPosts: category._count.posts,
        recentPosts: category.posts.length,
        totalViews: category.posts.reduce((sum, post) => sum + post.viewCount, 0),
        totalComments: category.posts.reduce((sum, post) => sum + post._count.comments, 0),
        totalLikes: category.posts.reduce((sum, post) => sum + post._count.likes, 0),
      }))
    }

    if (type === "users" || type === "all") {
      // Top authors - using valid UserRole values
      const topAuthors = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "EDITOR", "CONTRIBUTOR"] },
        },
        include: {
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
          posts: {
            where: {
              status: "PUBLISHED",
              publishedAt: { gte: startDate },
            },
            select: {
              viewCount: true,
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          },
        },
        orderBy: {
          posts: {
            _count: "desc",
          },
        },
        take: 10,
      })

      analytics.topAuthors = topAuthors.map((author) => ({
        id: author.id,
        name: author.name,
        totalPosts: author._count?.posts || 0,
        recentPosts: author.posts?.length || 0,
        totalViews: author.posts?.reduce((sum: number, post: PostWithCounts) => sum + post.viewCount, 0) || 0,
        totalComments: author.posts?.reduce((sum: number, post: PostWithCounts) => sum + post._count.comments, 0) || 0,
        totalLikes: author.posts?.reduce((sum: number, post: PostWithCounts) => sum + post._count.likes, 0) || 0,
      }))
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
