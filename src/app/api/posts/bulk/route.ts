import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { PostStatus } from "@prisma/client"

// POST /api/posts/bulk - Perform bulk operations on posts
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

    const { action, postIds, data } = await request.json()

    if (!action || !postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Verify all posts exist and user has permission
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postIds },
      },
      select: {
        id: true,
        authorId: true,
        title: true,
        status: true,
      },
    })

    if (posts.length !== postIds.length) {
      return NextResponse.json(
        { error: "Some posts not found" },
        { status: 404 }
      )
    }

    // Check permissions for each post
    const unauthorizedPosts = posts.filter(
      post => user.id !== post.authorId && user.role !== "ADMIN"
    )

    if (unauthorizedPosts.length > 0 && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Insufficient permissions for some posts" },
        { status: 403 }
      )
    }

    const result: { success: boolean; affected: number; message?: string } = { success: true, affected: 0 }

    switch (action) {
      case "delete":
        const deleteResult = await prisma.post.deleteMany({
          where: {
            id: { in: postIds },
          },
        })
        result.affected = deleteResult.count
        result.message = `${deleteResult.count} posts deleted successfully`
        break

      case "publish":
        const publishResult = await prisma.post.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(),
          },
        })
        result.affected = publishResult.count
        result.message = `${publishResult.count} posts published successfully`
        break

      case "unpublish":
        const unpublishResult = await prisma.post.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: PostStatus.DRAFT,
            publishedAt: null,
          },
        })
        result.affected = unpublishResult.count
        result.message = `${unpublishResult.count} posts unpublished successfully`
        break

      case "archive":
        const archiveResult = await prisma.post.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: PostStatus.ARCHIVED,
          },
        })
        result.affected = archiveResult.count
        result.message = `${archiveResult.count} posts archived successfully`
        break

      case "change_category":
        if (!data?.categoryId) {
          return NextResponse.json(
            { error: "Category ID is required" },
            { status: 400 }
          )
        }

        // Verify category exists
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        })

        if (!category) {
          return NextResponse.json(
            { error: "Category not found" },
            { status: 404 }
          )
        }

        const categoryResult = await prisma.post.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            categoryId: data.categoryId,
          },
        })
        result.affected = categoryResult.count
        result.message = `${categoryResult.count} posts moved to category "${category.name}"`
        break

      case "schedule":
        if (!data?.scheduledAt) {
          return NextResponse.json(
            { error: "Scheduled date is required" },
            { status: 400 }
          )
        }

        const scheduledDate = new Date(data.scheduledAt)
        if (scheduledDate <= new Date()) {
          return NextResponse.json(
            { error: "Scheduled date must be in the future" },
            { status: 400 }
          )
        }

        const scheduleResult = await prisma.post.updateMany({
          where: {
            id: { in: postIds },
          },
          data: {
            status: PostStatus.SCHEDULED,
            scheduledAt: scheduledDate,
          },
        })
        result.affected = scheduleResult.count
        result.message = `${scheduleResult.count} posts scheduled for ${scheduledDate.toLocaleDateString()}`
        break

      case "add_tags":
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { error: "Tags array is required" },
            { status: 400 }
          )
        }

        // Create or find tags
        const tagPromises = data.tags.map(async (tagName: string) => {
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-")
          return await prisma.tag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: {
              name: tagName,
              slug: tagSlug,
            },
          })
        })

        const tags = await Promise.all(tagPromises)

        // Add tags to posts
        const tagConnections = []
        for (const postId of postIds) {
          for (const tag of tags) {
            tagConnections.push({
              postId,
              tagId: tag.id,
            })
          }
        }

        await prisma.postTag.createMany({
          data: tagConnections,
          skipDuplicates: true,
        })

        result.affected = postIds.length
        result.message = `Tags added to ${postIds.length} posts`
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error performing bulk operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    )
  }
}
