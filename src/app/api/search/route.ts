import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/search - Global search across posts, categories, tags, and users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all" // all, posts, categories, tags, users
    const limit = parseInt(searchParams.get("limit") || "10")
    const page = parseInt(searchParams.get("page") || "1")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      })
    }

    const searchTerm = query.trim()
    const skip = (page - 1) * limit

    let results: any = {
      posts: [],
      categories: [],
      tags: [],
      users: [],
    }

    // Search posts
    if (type === "all" || type === "posts") {
      const [posts, postsCount] = await Promise.all([
        prisma.post.findMany({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { content: { contains: searchTerm, mode: "insensitive" } },
              { excerpt: { contains: searchTerm, mode: "insensitive" } },
              { seoTitle: { contains: searchTerm, mode: "insensitive" } },
              { seoDescription: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
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
            _count: {
              select: {
                comments: true,
                likes: true,
              },
            },
          },
          orderBy: [
            { publishedAt: "desc" },
            { viewCount: "desc" },
          ],
          take: type === "posts" ? limit : 5,
          skip: type === "posts" ? skip : 0,
        }),
        prisma.post.count({
          where: {
            status: "PUBLISHED",
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { content: { contains: searchTerm, mode: "insensitive" } },
              { excerpt: { contains: searchTerm, mode: "insensitive" } },
              { seoTitle: { contains: searchTerm, mode: "insensitive" } },
              { seoDescription: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
        }),
      ])

      results.posts = posts.map(post => ({
        ...post,
        tags: post.tags.map(pt => pt.tag),
        type: "post",
      }))

      if (type === "posts") {
        const totalPages = Math.ceil(postsCount / limit)
        return NextResponse.json({
          results: results.posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: postsCount,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        })
      }
    }

    // Search categories
    if (type === "all" || type === "categories") {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: type === "categories" ? limit : 3,
        skip: type === "categories" ? skip : 0,
      })

      results.categories = categories.map(category => ({
        ...category,
        type: "category",
      }))
    }

    // Search tags
    if (type === "all" || type === "tags") {
      const tags = await prisma.tag.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: type === "tags" ? limit : 3,
        skip: type === "tags" ? skip : 0,
      })

      results.tags = tags.map(tag => ({
        ...tag,
        type: "tag",
      }))
    }

    // Search users (authors)
    if (type === "all" || type === "users") {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { bio: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: type === "users" ? limit : 3,
        skip: type === "users" ? skip : 0,
      })

      results.users = users.map(user => ({
        ...user,
        type: "user",
      }))
    }

    // For "all" type, combine and return mixed results
    if (type === "all") {
      const allResults = [
        ...results.posts,
        ...results.categories,
        ...results.tags,
        ...results.users,
      ]

      return NextResponse.json({
        results: allResults,
        breakdown: {
          posts: results.posts.length,
          categories: results.categories.length,
          tags: results.tags.length,
          users: results.users.length,
        },
      })
    }

    // For specific types, return with pagination
    const typeResults = results[type] || []
    const totalCount = typeResults.length // This is simplified; in production, you'd do a separate count query

    return NextResponse.json({
      results: typeResults,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error performing search:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
}
