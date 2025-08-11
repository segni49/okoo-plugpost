import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { updatePostSchema, generateSlug, calculateReadTime } from "@/lib/validations"
import { PostStatus } from "@prisma/client"

// GET /api/posts/[id] - Get a single post
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const postId = params.id

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
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
        comments: {
          where: {
            parentId: null, // Only top-level comments
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
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

    // Check if user can access this post
    if (post.status !== PostStatus.PUBLISHED) {
      if (!user || (user.id !== post.authorId && user.role !== "ADMIN" && user.role !== "EDITOR")) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        )
      }
    }

    // Increment view count for published posts
    if (post.status === PostStatus.PUBLISHED) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({
      ...post,
      tags: post.tags.map(pt => pt.tag),
    })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}

// PUT /api/posts/[id] - Update a post
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

    const postId = params.id
    const body = await request.json()
    const data = updatePostSchema.parse(body)

    // Check if post exists and user has permission
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.id !== existingPost.authorId && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Handle slug update
    if (data.slug && data.slug !== existingPost.slug) {
      const slugExists = await prisma.post.findFirst({
        where: {
          slug: data.slug,
          id: { not: postId },
        },
      })

      if (slugExists) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        )
      }
    }

    // Calculate read time if content is updated
    let readTime = existingPost.readTime
    if (data.content) {
      readTime = calculateReadTime(data.content)
    }

    // Handle tags update
    if (data.tags) {
      // Delete existing tag connections
      await prisma.postTag.deleteMany({
        where: { postId },
      })

      // Create new tag connections
      for (const tagName of data.tags) {
        const tagSlug = generateSlug(tagName)
        const tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: {
            name: tagName,
            slug: tagSlug,
          },
        })
        await prisma.postTag.create({
          data: {
            postId,
            tagId: tag.id,
          },
        })
      }
    }

    // Handle status change to published
    let publishedAt = existingPost.publishedAt
    if (data.status === PostStatus.PUBLISHED && existingPost.status !== PostStatus.PUBLISHED) {
      publishedAt = new Date()
    }

    // Prepare update data without tags (handled separately above)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tags: _, ...updateData } = data

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        readTime,
        publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
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
      tags: updatedPost.tags.map((pt: { tag: { id: string; name: string; slug: string } }) => pt.tag),
    })
  } catch (error) {
    console.error("Error updating post:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  _request: NextRequest,
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

    // Check if post exists and user has permission
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check permissions
    if (user.id !== existingPost.authorId && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    await prisma.post.delete({
      where: { id: postId },
    })

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}
