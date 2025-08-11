import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth-utils"

// GET /api/settings - return site settings as key/value map
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const rows = await prisma.siteSettings.findMany()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return NextResponse.json({ settings: map })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// PUT /api/settings - upsert settings from object { settings: { key: value } }
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const settings = (body?.settings || {}) as Record<string, string>
    const keys = Object.keys(settings)

    await prisma.$transaction(async (tx) => {
      for (const key of keys) {
        await tx.siteSettings.upsert({
          where: { key },
          update: { value: settings[key] },
          create: { key, value: settings[key] },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

