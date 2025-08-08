import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { PostStatus } from "@prisma/client"

// POST /api/posts/schedule - Schedule a post for publishing
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (user.role !== "ADMIN" && user.role !== "EDITOR" && user.role !== "CONTRIBUTOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { postId, scheduledAt } = await request.json()

    if (!postId || !scheduledAt) {
      return NextResponse.json(
        { error: "Post ID and scheduled date are required" },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled date must be in the future" },
        { status: 400 }
      )
    }

    // Check if post exists and user has permission
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    if (user.id !== post.authorId && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Update post with scheduled date
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.SCHEDULED,
        scheduledAt: scheduledDate,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updatedPost,
      tags: updatedPost.tags.map(pt => pt.tag),
    })
  } catch (error) {
    console.error("Error scheduling post:", error)
    return NextResponse.json(
      { error: "Failed to schedule post" },
      { status: 500 }
    )
  }
}

// GET /api/posts/schedule - Get scheduled posts
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

    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: PostStatus.SCHEDULED,
        scheduledAt: {
          gte: new Date(),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    })

    return NextResponse.json({
      posts: scheduledPosts.map(post => ({
        ...post,
        tags: post.tags.map(pt => pt.tag),
      })),
    })
  } catch (error) {
    console.error("Error fetching scheduled posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    )
  }
}
