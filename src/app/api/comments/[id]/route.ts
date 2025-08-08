import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { z } from "zod"

const updateCommentSchema = z.object({
  content: z.string().min(1, "Comment content is required").max(1000, "Comment is too long"),
})

// GET /api/comments/[id] - Get a specific comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = params.id

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
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
            status: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error fetching comment:", error)
    return NextResponse.json(
      { error: "Failed to fetch comment" },
      { status: 500 }
    )
  }
}

// PUT /api/comments/[id] - Update a comment
export async function PUT(
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
    const body = await request.json()
    const validatedData = updateCommentSchema.parse(body)

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        createdAt: true,
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (existingComment.authorId !== user.id && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Check if comment is too old to edit (24 hours)
    const hoursSinceCreation = (Date.now() - existingComment.createdAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24 && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Comment is too old to edit" },
        { status: 403 }
      )
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: validatedData.content,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id] - Delete a comment
export async function DELETE(
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
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (existingComment.authorId !== user.id && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // If comment has replies, just mark it as deleted instead of actually deleting
    if (existingComment._count.replies > 0) {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: "[This comment has been deleted]",
          deletedAt: new Date(),
        },
      })
    } else {
      // Delete the comment completely if it has no replies
      await prisma.comment.delete({
        where: { id: commentId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}
