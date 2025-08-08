import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/search/suggestions - Get search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = parseInt(searchParams.get("limit") || "5")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const searchTerm = query.trim()

    // Get suggestions from different sources
    const [postTitles, categoryNames, tagNames] = await Promise.all([
      // Post titles
      prisma.post.findMany({
        where: {
          status: "PUBLISHED",
          title: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          title: true,
          slug: true,
        },
        take: limit,
        orderBy: { viewCount: "desc" },
      }),

      // Category names
      prisma.category.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          name: true,
          slug: true,
        },
        take: Math.ceil(limit / 2),
      }),

      // Tag names
      prisma.tag.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        select: {
          name: true,
          slug: true,
        },
        take: Math.ceil(limit / 2),
      }),
    ])

    const suggestions = [
      ...postTitles.map(post => ({
        text: post.title,
        type: "post",
        url: `/posts/${post.slug}`,
      })),
      ...categoryNames.map(category => ({
        text: category.name,
        type: "category",
        url: `/categories/${category.slug}`,
      })),
      ...tagNames.map(tag => ({
        text: tag.name,
        type: "tag",
        url: `/tags/${tag.slug}`,
      })),
    ].slice(0, limit)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error getting search suggestions:", error)
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    )
  }
}
