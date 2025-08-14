// Advanced security features for enterprise-level protection
import { NextRequest, NextResponse } from 'next/server'
import { getCacheManager } from './cache'
import { optimizedPrisma } from './database-optimization'

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  rateLimits: {
    api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
    search: { requests: 30, window: 60 * 1000 }, // 30 searches per minute
  },
  
  // IP blocking
  maxFailedAttempts: 10,
  blockDuration: 60 * 60 * 1000, // 1 hour
  
  // Threat detection
  suspiciousPatterns: [
    /\.\.\//g, // Directory traversal
    /<script/gi, // XSS attempts
    /union\s+select/gi, // SQL injection
    /javascript:/gi, // JavaScript protocol
    /data:text\/html/gi, // Data URI XSS
    /vbscript:/gi, // VBScript protocol
  ],
  
  // Geolocation blocking (example countries)
  blockedCountries: process.env.BLOCKED_COUNTRIES?.split(',') || [],
  
  // Content Security Policy
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://vercel.live'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'connect-src': ["'self'", 'https:', 'wss:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },
}

// Audit log types
export interface AuditLogEntry {
  id: string
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// Security threat detection
class ThreatDetector {
  private cache = getCacheManager()
  private suspiciousIPs = new Set<string>()
  private blockedIPs = new Set<string>()

  async detectThreats(request: NextRequest): Promise<{
    isBlocked: boolean
    isSuspicious: boolean
    threats: string[]
    riskScore: number
  }> {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const url = request.url
    const threats: string[] = []
    let riskScore = 0

    // Check if IP is already blocked
    if (this.blockedIPs.has(ip) || await this.isIPBlocked(ip)) {
      return {
        isBlocked: true,
        isSuspicious: true,
        threats: ['blocked_ip'],
        riskScore: 100,
      }
    }

    // Check for suspicious patterns in URL
    for (const pattern of SECURITY_CONFIG.suspiciousPatterns) {
      if (pattern.test(url)) {
        threats.push('suspicious_url_pattern')
        riskScore += 20
      }
    }

    // Check for suspicious user agent
    if (this.isSuspiciousUserAgent(userAgent)) {
      threats.push('suspicious_user_agent')
      riskScore += 15
    }

    // Check for rapid requests (potential DDoS)
    const requestCount = await this.getRequestCount(ip)
    if (requestCount > 200) { // More than 200 requests in the last minute
      threats.push('rapid_requests')
      riskScore += 30
    }

    // Check for geolocation blocking
    if (await this.isBlockedCountry(ip)) {
      threats.push('blocked_country')
      riskScore += 50
    }

    // Check for known malicious IPs (you could integrate with threat intelligence APIs)
    if (await this.isMaliciousIP(ip)) {
      threats.push('malicious_ip')
      riskScore += 80
    }

    const isSuspicious = riskScore > 30
    const isBlocked = riskScore > 70

    if (isBlocked) {
      await this.blockIP(ip, 'Automated threat detection')
    } else if (isSuspicious) {
      this.suspiciousIPs.add(ip)
    }

    return {
      isBlocked,
      isSuspicious,
      threats,
      riskScore,
    }
  }

  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /^$/,
    ]

    // Allow legitimate bots
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
    ]

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent))
    const isLegitimate = legitimateBots.some(pattern => pattern.test(userAgent))

    return isSuspicious && !isLegitimate
  }

  private async getRequestCount(ip: string): Promise<number> {
    const key = `requests:${ip}:${Math.floor(Date.now() / 60000)}`
    return await this.cache.increment(key)
  }

  private async isIPBlocked(ip: string): Promise<boolean> {
    const blocked = await this.cache.get(`blocked:${ip}`)
    return !!blocked
  }

  private async blockIP(ip: string, reason: string): Promise<void> {
    this.blockedIPs.add(ip)
    await this.cache.set(`blocked:${ip}`, { reason, timestamp: new Date() }, SECURITY_CONFIG.blockDuration / 1000)
    
    // Log the blocking
    await this.logSecurityEvent({
      action: 'ip_blocked',
      resource: 'security',
      details: { ip, reason },
      ipAddress: ip,
      userAgent: '',
      severity: 'high',
    })
  }

  private async isBlockedCountry(ip: string): Promise<boolean> {
    if (SECURITY_CONFIG.blockedCountries.length === 0) return false
    
    try {
      // You would integrate with a geolocation service here
      // For now, we'll just return false
      return false
    } catch (error) {
      console.warn('Geolocation check failed:', error)
      return false
    }
  }

  private async isMaliciousIP(ip: string): Promise<boolean> {
    try {
      // You could integrate with threat intelligence APIs here
      // For now, we'll check against a simple cache
      const malicious = await this.cache.get(`malicious:${ip}`)
      return !!malicious
    } catch (error) {
      console.warn('Malicious IP check failed:', error)
      return false
    }
  }

  private async logSecurityEvent(event: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    try {
      await optimizedPrisma.auditLog.create({
        data: {
          ...event,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

// Audit logging system
class AuditLogger {
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    try {
      await optimizedPrisma.auditLog.create({
        data: {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      })

      // Also cache recent audit logs for quick access
      const cacheKey = `audit:recent:${entry.userId || 'system'}`
      const recentLogs = await getCacheManager().get<AuditLogEntry[]>(cacheKey) || []
      recentLogs.unshift({ ...entry, id: crypto.randomUUID(), timestamp: new Date() })
      
      // Keep only last 50 entries
      if (recentLogs.length > 50) {
        recentLogs.splice(50)
      }
      
      await getCacheManager().set(cacheKey, recentLogs, 3600) // 1 hour cache
    } catch (error) {
      console.error('Failed to log audit entry:', error)
    }
  }

  async getRecentLogs(userId?: string, limit = 20): Promise<AuditLogEntry[]> {
    try {
      const where = userId ? { userId } : {}
      return await optimizedPrisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      })
    } catch (error) {
      console.error('Failed to get audit logs:', error)
      return []
    }
  }

  async getSecurityEvents(severity?: AuditLogEntry['severity']): Promise<AuditLogEntry[]> {
    try {
      const where = severity ? { severity } : { severity: { in: ['high', 'critical'] } }
      return await optimizedPrisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 100,
      })
    } catch (error) {
      console.error('Failed to get security events:', error)
      return []
    }
  }
}

// Content Security Policy generator
export function generateCSP(): string {
  return Object.entries(SECURITY_CONFIG.cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

// Security headers
export const securityHeaders = {
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': generateCSP(),
}

// Advanced rate limiter with sliding window
class AdvancedRateLimiter {
  private cache = getCacheManager()

  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    category = 'default'
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    total: number
  }> {
    const now = Date.now()
    const windowStart = now - windowMs
    const key = `rate_limit:${category}:${identifier}`

    try {
      // Get current requests in the window
      const requests = await this.cache.get<number[]>(key) || []
      
      // Remove old requests outside the window
      const validRequests = requests.filter(timestamp => timestamp > windowStart)
      
      // Check if limit exceeded
      const allowed = validRequests.length < limit
      
      if (allowed) {
        // Add current request
        validRequests.push(now)
        await this.cache.set(key, validRequests, Math.ceil(windowMs / 1000))
      }

      return {
        allowed,
        remaining: Math.max(0, limit - validRequests.length - (allowed ? 0 : 1)),
        resetTime: Math.min(...validRequests) + windowMs,
        total: validRequests.length,
      }
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
        total: 1,
      }
    }
  }
}

// Singleton instances
export const threatDetector = new ThreatDetector()
export const auditLogger = new AuditLogger()
export const advancedRateLimiter = new AdvancedRateLimiter()

// Middleware helper for security checks
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  // Run threat detection
  const threatAnalysis = await threatDetector.detectThreats(request)
  
  if (threatAnalysis.isBlocked) {
    return new NextResponse('Access Denied', { 
      status: 403,
      headers: {
        'X-Threat-Score': threatAnalysis.riskScore.toString(),
        'X-Threats': threatAnalysis.threats.join(','),
      },
    })
  }

  // Apply rate limiting based on endpoint
  const pathname = new URL(request.url).pathname
  let rateLimitConfig = SECURITY_CONFIG.rateLimits.api

  if (pathname.startsWith('/api/auth')) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.auth
  } else if (pathname.startsWith('/api/upload')) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.upload
  } else if (pathname.startsWith('/api/search')) {
    rateLimitConfig = SECURITY_CONFIG.rateLimits.search
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  const rateLimit = await advancedRateLimiter.checkLimit(
    ip,
    rateLimitConfig.requests,
    rateLimitConfig.window,
    pathname.split('/')[2] || 'api'
  )

  if (!rateLimit.allowed) {
    return new NextResponse('Rate Limit Exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': rateLimitConfig.requests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
        'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
      },
    })
  }

  return null // Continue processing
}
