import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  )

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  )

export const urlSchema = z
  .string()
  .url("Invalid URL")
  .max(2048, "URL is too long")

export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")

// Content validation schemas
export const titleSchema = z
  .string()
  .min(1, "Title is required")
  .max(200, "Title is too long")
  .trim()

export const excerptSchema = z
  .string()
  .max(500, "Excerpt is too long")
  .optional()

export const contentSchema = z
  .string()
  .min(1, "Content is required")
  .max(50000, "Content is too long")

export const tagNameSchema = z
  .string()
  .min(1, "Tag name is required")
  .max(50, "Tag name is too long")
  .regex(/^[a-zA-Z0-9\s-]+$/, "Tag name contains invalid characters")

export const categoryNameSchema = z
  .string()
  .min(1, "Category name is required")
  .max(100, "Category name is too long")
  .regex(/^[a-zA-Z0-9\s-]+$/, "Category name contains invalid characters")

// User validation schemas
export const userNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name is too long")
  .regex(/^[a-zA-Z0-9\s-_.]+$/, "Name contains invalid characters")

export const bioSchema = z
  .string()
  .max(1000, "Bio is too long")
  .optional()

export const websiteSchema = z
  .string()
  .url("Invalid website URL")
  .max(255, "Website URL is too long")
  .optional()
  .or(z.literal(""))

// Comment validation
export const commentContentSchema = z
  .string()
  .min(1, "Comment content is required")
  .max(1000, "Comment is too long")
  .trim()

// File upload validation
export const imageFileSchema = z
  .object({
    name: z.string(),
    size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
    type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, "Invalid file type"),
  })

// Search validation
export const searchQuerySchema = z
  .string()
  .min(2, "Search query must be at least 2 characters")
  .max(100, "Search query is too long")
  .trim()

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// Sorting validation
export const sortSchema = z.object({
  sortBy: z.enum(["createdAt", "updatedAt", "publishedAt", "title", "viewCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// HTML sanitization
export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
}): string {
  const defaultOptions = {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "a", "img", "code", "pre", "table",
      "thead", "tbody", "tr", "th", "td", "hr", "div", "span"
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id", "target", "rel",
      "width", "height", "style"
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover"],
  }

  if (options?.allowedTags) {
    defaultOptions.ALLOWED_TAGS = options.allowedTags
  }

  if (options?.allowedAttributes) {
    defaultOptions.ALLOWED_ATTR = Object.values(options.allowedAttributes).flat()
  }

  return DOMPurify.sanitize(html, defaultOptions)
}

// Text sanitization for plain text fields
export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .trim()
}

// SQL injection prevention (additional layer)
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''").replace(/;/g, "\\;")
}

// XSS prevention utilities
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// CSRF token validation
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken || token.length !== expectedToken.length) {
    return false
  }
  
  // Constant-time comparison to prevent timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }
  
  return result === 0
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => `${err.path.join(".")}: ${err.message}`)
        throw new Error(`Validation failed: ${messages.join(", ")}`)
      }
      throw error
    }
  }
}

// File validation
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File size must be less than 5MB" }
  }
  
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed" }
  }
  
  // Check file extension
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."))
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: "Invalid file extension" }
  }
  
  return { valid: true }
}

// Content moderation
export function moderateContent(content: string): {
  approved: boolean
  flags: string[]
  score: number
} {
  const flags: string[] = []
  let score = 0
  
  // Check for spam patterns
  const spamPatterns = [
    /\b(buy now|click here|limited time|act now)\b/gi,
    /\b(viagra|cialis|pharmacy)\b/gi,
    /\b(casino|gambling|poker)\b/gi,
    /\b(make money|earn \$|get rich)\b/gi,
  ]
  
  spamPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      flags.push("potential_spam")
      score += 20
    }
  })
  
  // Check for profanity (basic implementation)
  const profanityPatterns = [
    /\b(fuck|shit|damn|hell|bitch)\b/gi,
  ]
  
  profanityPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      flags.push("profanity")
      score += 15
    }
  })
  
  // Check for excessive caps
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (capsRatio > 0.5 && content.length > 20) {
    flags.push("excessive_caps")
    score += 10
  }
  
  // Check for excessive links
  const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length
  if (linkCount > 3) {
    flags.push("excessive_links")
    score += 25
  }
  
  return {
    approved: score < 50,
    flags,
    score,
  }
}

// Rate limiting validation
export function validateRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  store: Map<string, { count: number; resetTime: number }> = new Map()
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = store.get(identifier)
  
  if (!entry || entry.resetTime < now) {
    const newEntry = { count: 1, resetTime: now + windowMs }
    store.set(identifier, newEntry)
    return { allowed: true, remaining: limit - 1, resetTime: newEntry.resetTime }
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }
  
  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}
