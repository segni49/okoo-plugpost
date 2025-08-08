import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

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

    let analytics: any = {}

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
            select: { name: true, image: true },
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
      // Daily traffic data
      const dailyViews = await prisma.postAnalytics.groupBy({
        by: ["date"],
        where: {
          date: { gte: startDate },
        },
        _sum: {
          views: true,
          uniqueViews: true,
        },
        orderBy: {
          date: "asc",
        },
      })

      analytics.dailyViews = dailyViews.map(day => ({
        date: day.date,
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
      // Top authors
      const topAuthors = await prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "EDITOR", "AUTHOR"] },
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

      analytics.topAuthors = topAuthors.map(author => ({
        id: author.id,
        name: author.name,
        image: author.image,
        totalPosts: author._count.posts,
        recentPosts: author.posts.length,
        totalViews: author.posts.reduce((sum, post) => sum + post.viewCount, 0),
        totalComments: author.posts.reduce((sum, post) => sum + post._count.comments, 0),
        totalLikes: author.posts.reduce((sum, post) => sum + post._count.likes, 0),
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
