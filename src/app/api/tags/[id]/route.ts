import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"
import { updateTagSchema } from "@/lib/validations"

// PUT /api/tags/[id] - Update a tag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const tagId = params.id
    const body = await request.json()
    const data = updateTagSchema.parse(body)

    const existing = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Prevent duplicate name/slug
    if (data.name || data.slug) {
      const dup = await prisma.tag.findFirst({
        where: {
          AND: [
            { id: { not: tagId } },
            {
              OR: (
                [
                  ...(data.name ? [{ name: data.name }] as const : []),
                  ...(data.slug ? [{ slug: data.slug }] as const : []),
                ] as Array<{ name?: string; slug?: string }>
              ),
            },
          ],
        },
      })
      if (dup) {
        return NextResponse.json(
          { error: "A tag with this name or slug already exists" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 })
  }
}

// DELETE /api/tags/[id] - Delete a tag
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const tagId = params.id

    const existing = await prisma.tag.findUnique({ where: { id: tagId } })
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    await prisma.postTag.deleteMany({ where: { tagId } })
    await prisma.tag.delete({ where: { id: tagId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 })
  }
}

