import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// POST /api/posts/[id]/versions/[versionId]/restore - Restore a post version
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
    const versionId = params.versionId

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

    // Find the version to restore
    const version = await prisma.postVersion.findUnique({
      where: { id: versionId },
    })

    if (!version || version.postId !== postId) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      )
    }

    // Create a new version with current content before restoring
    const latestVersion = await prisma.postVersion.findFirst({
      where: { postId },
      orderBy: { version: "desc" },
    })

    const nextVersion = (latestVersion?.version || 0) + 1

    await prisma.postVersion.create({
      data: {
        postId,
        title: post.title,
        content: post.content,
        version: nextVersion,
      },
    })

    // Restore the post to the selected version
    const restoredPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: version.title,
        content: version.content,
        updatedAt: new Date(),
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
      ...restoredPost,
      tags: restoredPost.tags.map(pt => pt.tag),
      restoredFromVersion: version.version,
    })
  } catch (error) {
    console.error("Error restoring post version:", error)
    return NextResponse.json(
      { error: "Failed to restore post version" },
      { status: 500 }
    )
  }
}
