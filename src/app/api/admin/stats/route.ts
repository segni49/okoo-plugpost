import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { PostStatus } from "@prisma/client"

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Get current date for monthly stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all statistics in parallel
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalUsers,
      totalComments,
      totalViews,
      monthlyViews,
    ] = await Promise.all([
      // Total posts
      prisma.post.count(),
      
      // Published posts
      prisma.post.count({
        where: { status: PostStatus.PUBLISHED },
      }),
      
      // Draft posts
      prisma.post.count({
        where: { status: PostStatus.DRAFT },
      }),
      
      // Scheduled posts
      prisma.post.count({
        where: { status: PostStatus.SCHEDULED },
      }),
      
      // Total users
      prisma.user.count(),
      
      // Total comments
      prisma.comment.count(),
      
      // Total views (sum of all post view counts)
      prisma.post.aggregate({
        _sum: {
          viewCount: true,
        },
      }),
      
      // Monthly views (simplified - in a real app you'd track this properly)
      prisma.post.aggregate({
        where: {
          publishedAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          viewCount: true,
        },
      }),
    ])

    const stats = {
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalUsers,
      totalComments,
      totalViews: totalViews._sum.viewCount || 0,
      monthlyViews: monthlyViews._sum.viewCount || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
