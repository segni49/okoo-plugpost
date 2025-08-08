import { NextRequest } from "next/server"

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (request) => this.getClientIP(request),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    }
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    const realIP = request.headers.get("x-real-ip")
    const remoteAddr = request.headers.get("remote-addr")
    
    if (forwarded) {
      return forwarded.split(",")[0].trim()
    }
    
    return realIP || remoteAddr || "unknown"
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    const key = this.config.keyGenerator!(request)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    let entry = rateLimitStore.get(key)
    
    // Reset if window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      }
    }
    
    const allowed = entry.count < this.config.maxRequests
    
    if (allowed) {
      entry.count++
      rateLimitStore.set(key, entry)
    }
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }

  async middleware(request: NextRequest) {
    const result = await this.checkLimit(request)
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": result.limit.toString(),
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    
    return null // Allow request to continue
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limit
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),
  
  // Authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),
  
  // Comment creation
  comments: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),
  
  // Search endpoints
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  }),
  
  // File uploads
  uploads: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),
  
  // Password reset
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  }),
}

// Utility function to apply rate limiting to API routes
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: any[]) => {
    const rateLimitResponse = await rateLimiter.middleware(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    return handler(request, ...args)
  }
}

// Advanced rate limiting with different limits for authenticated users
export class AdaptiveRateLimiter extends RateLimiter {
  private authenticatedConfig: RateLimitConfig
  
  constructor(
    anonymousConfig: RateLimitConfig,
    authenticatedConfig: RateLimitConfig
  ) {
    super(anonymousConfig)
    this.authenticatedConfig = authenticatedConfig
  }
  
  async checkLimit(request: NextRequest, isAuthenticated = false): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
  }> {
    const config = isAuthenticated ? this.authenticatedConfig : this.config
    const key = `${isAuthenticated ? "auth" : "anon"}:${config.keyGenerator!(request)}`
    const now = Date.now()
    
    let entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }
    
    const allowed = entry.count < config.maxRequests
    
    if (allowed) {
      entry.count++
      rateLimitStore.set(key, entry)
    }
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }
}

// Adaptive rate limiter for API endpoints
export const adaptiveApiLimiter = new AdaptiveRateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50, // Anonymous users
  },
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // Authenticated users
  }
)

// IP-based blocking for suspicious activity
const blockedIPs = new Set<string>()
const suspiciousActivity = new Map<string, { count: number; lastActivity: number }>()

export function blockIP(ip: string, duration = 24 * 60 * 60 * 1000) {
  blockedIPs.add(ip)
  setTimeout(() => blockedIPs.delete(ip), duration)
}

export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip)
}

export function trackSuspiciousActivity(ip: string) {
  const now = Date.now()
  const activity = suspiciousActivity.get(ip) || { count: 0, lastActivity: now }
  
  // Reset count if more than 1 hour has passed
  if (now - activity.lastActivity > 60 * 60 * 1000) {
    activity.count = 0
  }
  
  activity.count++
  activity.lastActivity = now
  suspiciousActivity.set(ip, activity)
  
  // Block IP if too many suspicious activities
  if (activity.count > 10) {
    blockIP(ip)
    suspiciousActivity.delete(ip)
  }
}

// Middleware to check for blocked IPs
export function checkBlockedIP(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            request.headers.get("x-real-ip") ||
            "unknown"
  
  if (isIPBlocked(ip)) {
    return new Response(
      JSON.stringify({
        error: "Access denied",
        message: "Your IP address has been temporarily blocked due to suspicious activity.",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
  
  return null
}
