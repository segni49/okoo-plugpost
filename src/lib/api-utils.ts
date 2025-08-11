import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { Prisma } from "@prisma/client"

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error)

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.issues.map(err => ({
      field: err.path.join("."),
      message: err.message,
    }))
    
    return NextResponse.json(
      {
        error: "Validation failed",
        details: errors,
      },
      { status: 400 }
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          { error: "A record with this value already exists" },
          { status: 409 }
        )
      case "P2025":
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        )
      case "P2003":
        return NextResponse.json(
          { error: "Foreign key constraint failed" },
          { status: 400 }
        )
      default:
        return NextResponse.json(
          { error: "Database error" },
          { status: 500 }
        )
    }
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  )
}

export function createSuccessResponse<T = unknown>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

// Rate limiting utility (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Pagination utility
export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
