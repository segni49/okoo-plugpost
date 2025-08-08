import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// POST /api/comments/[id]/like - Toggle like on a comment
export async function POST(
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

    const commentId = params.id

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Check if user already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    })

    let liked: boolean
    let likeCount: number

    if (existingLike) {
      // Unlike the comment
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId,
          },
        },
      })
      liked = false
    } else {
      // Like the comment
      await prisma.commentLike.create({
        data: {
          userId: user.id,
          commentId,
        },
      })
      liked = true
    }

    // Get updated like count
    likeCount = await prisma.commentLike.count({
      where: { commentId },
    })

    return NextResponse.json({
      liked,
      likeCount,
    })
  } catch (error) {
    console.error("Error toggling comment like:", error)
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    )
  }
}
