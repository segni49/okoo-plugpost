import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { createPostSchema, postQuerySchema, generateSlug, calculateReadTime } from "@/lib/validations"
import { PostStatus, Prisma } from "@prisma/client"

// GET /api/posts - Get all posts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost")
    const query = postQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Prisma.PostWhereInput = {}

    // Apply filters
    if (query.status) {
      where.status = query.status
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId
    }
    if (query.authorId) {
      where.authorId = query.authorId
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
        { excerpt: { contains: query.search, mode: "insensitive" } },
      ]
    }

    // For public access, only show published posts
    const user = await getCurrentUser()
    if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      where.status = PostStatus.PUBLISHED
      where.publishedAt = { lte: new Date() }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
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
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.post.count({ where }),
    ])

    const totalPages = Math.ceil(total / query.limit)

    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        tags: post.tags.map(pt => pt.tag),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}

// POST /api/posts - Create a new post
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

    const body = await request.json()
    const data = createPostSchema.parse(body)

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.title)
    }

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: data.slug },
    })

    if (existingPost) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      )
    }

    // Calculate read time
    const readTime = calculateReadTime(data.content)

    // Handle tags
    const tagConnections = []
    if (data.tags && data.tags.length > 0) {
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
        tagConnections.push({ tagId: tag.id })
      }
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        status: data.status || PostStatus.DRAFT,
        publishedAt: data.status === PostStatus.PUBLISHED ? new Date() : data.publishedAt ? new Date(data.publishedAt) : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        readTime,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        authorId: user.id,
        categoryId: data.categoryId,
        tags: {
          create: tagConnections,
        },
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
      ...post,
      tags: post.tags.map(pt => pt.tag),
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
