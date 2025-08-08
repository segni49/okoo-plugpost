import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/posts/[id]/versions - Get post version history
export async function GET(
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

    // Check permissions
    if (user.id !== post.authorId && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const versions = await prisma.postVersion.findMany({
      where: { postId },
      orderBy: {
        version: "desc",
      },
    })

    return NextResponse.json({ versions })
  } catch (error) {
    console.error("Error fetching post versions:", error)
    return NextResponse.json(
      { error: "Failed to fetch post versions" },
      { status: 500 }
    )
  }
}

// POST /api/posts/[id]/versions - Create a new version
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

    const postId = params.id

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

    // Check permissions
    if (user.id !== post.authorId && user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Get the latest version number
    const latestVersion = await prisma.postVersion.findFirst({
      where: { postId },
      orderBy: { version: "desc" },
    })

    const nextVersion = (latestVersion?.version || 0) + 1

    // Create new version with current post content
    const version = await prisma.postVersion.create({
      data: {
        postId,
        title: post.title,
        content: post.content,
        version: nextVersion,
      },
    })

    return NextResponse.json(version, { status: 201 })
  } catch (error) {
    console.error("Error creating post version:", error)
    return NextResponse.json(
      { error: "Failed to create post version" },
      { status: 500 }
    )
  }
}
