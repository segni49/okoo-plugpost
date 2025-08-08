import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { createTagSchema, generateSlug } from "@/lib/validations"

// GET /api/tags - Get all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includePostCount = searchParams.get("includePostCount") === "true"
    const search = searchParams.get("search")

    const where: any = {}
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      }
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: includePostCount ? {
          select: {
            posts: {
              where: {
                post: {
                  status: "PUBLISHED",
                },
              },
            },
          },
        } : undefined,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const data = createTagSchema.parse(body)

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlug(data.name)
    }

    // Check if tag with same name or slug exists
    const existingTag = await prisma.tag.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: data.slug },
        ],
      },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: "A tag with this name or slug already exists" },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name,
        slug: data.slug,
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    )
  }
}
