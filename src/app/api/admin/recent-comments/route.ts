import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/admin/recent-comments - Get recent comments for dashboard
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "5")

    const comments = await prisma.comment.findMany({
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching recent comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch recent comments" },
      { status: 500 }
    )
  }
}
