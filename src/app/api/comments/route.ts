import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { createCommentSchema, paginationSchema } from "@/lib/validations"
import { z } from "zod"
import { Prisma } from "@prisma/client"

const commentQuerySchema = paginationSchema.extend({
  postId: z.string().optional(),
  authorId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "content"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  admin: z.string().optional(), // Flag for admin view
})

// GET /api/comments - Get comments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = commentQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      postId: searchParams.get("postId") ?? undefined,
      authorId: searchParams.get("authorId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      admin: searchParams.get("admin") ?? undefined,
    })

    const user = await getCurrentUser()
    const isAdmin = query.admin === "true" && user && (user.role === "ADMIN" || user.role === "EDITOR")

    const where: Prisma.CommentWhereInput = {}

    if (query.postId) {
      where.postId = query.postId
      if (!isAdmin) {
        where.parentId = null // Only top-level comments for post view
      }
    }

    if (query.authorId) {
      where.authorId = query.authorId
    }

    if (query.search) {
      where.content = {
        contains: query.search,
        mode: "insensitive",
      }
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: isAdmin,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          replies: !isAdmin ? {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
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
          } : undefined,
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.comment.count({ where }),
    ])

    const totalPages = Math.ceil(total / query.limit)

    return NextResponse.json({
      comments,
      pagination: {
        currentPage: query.page,
        totalPages,
        totalItems: total,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createCommentSchema.parse(body)

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    if (post.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot comment on unpublished post" },
        { status: 400 }
      )
    }

    // Check if parent comment exists (for replies)
    if (data.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: data.parentId },
      })

      if (!parentComment || parentComment.postId !== data.postId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        parentId: data.parentId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Error creating comment:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
