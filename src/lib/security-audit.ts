import { prisma } from "@/lib/prisma"

interface SecurityEvent {
  type: "login_attempt" | "failed_login" | "suspicious_activity" | "rate_limit_exceeded" | "unauthorized_access"
  userId?: string
  ip: string
  userAgent: string
  details: Record<string, unknown>
  timestamp: Date
}

interface SecurityReport {
  summary: {
    totalEvents: number
    criticalEvents: number
    suspiciousIPs: string[]
    topThreats: Array<{ type: string; count: number }>
  }
  events: SecurityEvent[]
  recommendations: string[]
}

// In-memory store for security events (in production, use a proper logging system)
const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 10000

export class SecurityAuditor {
  static logEvent(event: Omit<SecurityEvent, "timestamp">) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    }
    
    securityEvents.push(securityEvent)
    
    // Keep only the most recent events
    if (securityEvents.length > MAX_EVENTS) {
      securityEvents.splice(0, securityEvents.length - MAX_EVENTS)
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Security Event:", securityEvent)
    }
    
    // In production, you would send this to a logging service
    // like DataDog, Sentry, or CloudWatch
  }
  
  static async generateReport(days = 7): Promise<SecurityReport> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Filter events by date
    const recentEvents = securityEvents.filter(
      event => event.timestamp >= startDate
    )
    
    // Analyze events
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Find suspicious IPs (multiple failed attempts)
    const ipCounts = recentEvents.reduce((acc, event) => {
      if (event.type === "failed_login" || event.type === "suspicious_activity") {
        acc[event.ip] = (acc[event.ip] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const suspiciousIPs = Object.entries(ipCounts)
      .filter(([, count]) => count > 5)
      .map(([ip]) => ip)
    
    // Top threats
    const topThreats = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))
    
    // Critical events
    const criticalTypes = ["unauthorized_access", "suspicious_activity"]
    const criticalEvents = recentEvents.filter(event => 
      criticalTypes.includes(event.type)
    ).length
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(recentEvents, suspiciousIPs)
    
    return {
      summary: {
        totalEvents: recentEvents.length,
        criticalEvents,
        suspiciousIPs,
        topThreats,
      },
      events: recentEvents.slice(-100), // Last 100 events
      recommendations,
    }
  }
  
  private static generateRecommendations(
    events: SecurityEvent[],
    suspiciousIPs: string[]
  ): string[] {
    const recommendations: string[] = []
    
    // Check for excessive failed logins
    const failedLogins = events.filter(e => e.type === "failed_login").length
    if (failedLogins > 50) {
      recommendations.push("Consider implementing CAPTCHA after multiple failed login attempts")
    }
    
    // Check for suspicious IPs
    if (suspiciousIPs.length > 0) {
      recommendations.push(`Consider blocking or monitoring IPs: ${suspiciousIPs.join(", ")}`)
    }
    
    // Check for rate limit violations
    const rateLimitEvents = events.filter(e => e.type === "rate_limit_exceeded").length
    if (rateLimitEvents > 100) {
      recommendations.push("Consider implementing more aggressive rate limiting")
    }
    
    // Check for unauthorized access attempts
    const unauthorizedEvents = events.filter(e => e.type === "unauthorized_access").length
    if (unauthorizedEvents > 10) {
      recommendations.push("Review access controls and authentication mechanisms")
    }
    
    return recommendations
  }
  
  static async checkUserSecurity(userId: string): Promise<{
    riskLevel: "low" | "medium" | "high"
    issues: string[]
    recommendations: string[]
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        status: true,
      },
    })
    
    if (!user) {
      return {
        riskLevel: "high",
        issues: ["User not found"],
        recommendations: ["Verify user existence"],
      }
    }
    
    const issues: string[] = []
    const recommendations: string[] = []
    let riskLevel: "low" | "medium" | "high" = "low"
    
    // Check password strength (if using credentials)
    if (user.password) {
      // In a real implementation, you'd check password complexity
      // This is just a placeholder
      if (user.password.length < 8) {
        issues.push("Weak password")
        recommendations.push("Enforce stronger password requirements")
        riskLevel = "medium"
      }
    }
    
    // Check account age
    const accountAge = Date.now() - user.createdAt.getTime()
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)
    
    if (daysSinceCreation < 1 && user.role !== "SUBSCRIBER") {
      issues.push("New account with elevated privileges")
      recommendations.push("Monitor new accounts with admin/editor roles")
      riskLevel = "medium"
    }
    
    // Check for recent security events
    const userEvents = securityEvents.filter(event => event.userId === userId)
    const recentFailedLogins = userEvents.filter(
      event => event.type === "failed_login" && 
      Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000
    ).length
    
    if (recentFailedLogins > 5) {
      issues.push("Multiple recent failed login attempts")
      recommendations.push("Consider requiring password reset or account verification")
      riskLevel = "high"
    }
    
    return { riskLevel, issues, recommendations }
  }
  
  static async scanForVulnerabilities(): Promise<{
    vulnerabilities: Array<{
      type: string
      severity: "low" | "medium" | "high" | "critical"
      description: string
      recommendation: string
    }>
  }> {
    const vulnerabilities: Array<{
      type: string
      severity: "low" | "medium" | "high" | "critical"
      description: string
      recommendation: string
    }> = []
    
    // Check for users with weak passwords
    const usersWithPasswords = await prisma.user.count({
      where: {
        password: { not: null },
      },
    })
    
    if (usersWithPasswords > 0) {
      // In a real implementation, you'd check actual password strength
      vulnerabilities.push({
        type: "weak_passwords",
        severity: "medium",
        description: "Some users may have weak passwords",
        recommendation: "Implement password strength requirements and periodic password updates",
      })
    }
    
    // Check for admin users
    const adminUsers = await prisma.user.count({
      where: { role: "ADMIN" },
    })
    
    if (adminUsers > 5) {
      vulnerabilities.push({
        type: "excessive_admin_users",
        severity: "medium",
        description: "Large number of admin users detected",
        recommendation: "Review admin user list and remove unnecessary admin privileges",
      })
    }
    
    // Check for inactive users with elevated privileges
    const inactiveAdmins = await prisma.user.count({
      where: {
        role: { in: ["ADMIN", "EDITOR"] },
        updatedAt: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        },
      },
    })
    
    if (inactiveAdmins > 0) {
      vulnerabilities.push({
        type: "inactive_privileged_users",
        severity: "high",
        description: "Inactive users with admin/editor privileges found",
        recommendation: "Disable or remove privileges from inactive admin/editor accounts",
      })
    }
    
    // Check environment variables
    const criticalEnvVars = [
      "NEXTAUTH_SECRET",
      "DATABASE_URL",
      "NEXTAUTH_URL",
    ]
    
    const missingEnvVars = criticalEnvVars.filter(
      varName => !process.env[varName]
    )
    
    if (missingEnvVars.length > 0) {
      vulnerabilities.push({
        type: "missing_env_vars",
        severity: "critical",
        description: `Missing critical environment variables: ${missingEnvVars.join(", ")}`,
        recommendation: "Set all required environment variables",
      })
    }
    
    return { vulnerabilities }
  }
}

// Helper functions for logging security events
export function logLoginAttempt(userId: string, ip: string, userAgent: string, success: boolean) {
  SecurityAuditor.logEvent({
    type: success ? "login_attempt" : "failed_login",
    userId,
    ip,
    userAgent,
    details: { success },
  })
}

export function logSuspiciousActivity(ip: string, userAgent: string, details: Record<string, unknown>) {
  SecurityAuditor.logEvent({
    type: "suspicious_activity",
    ip,
    userAgent,
    details,
  })
}

export function logRateLimitExceeded(ip: string, userAgent: string, endpoint: string) {
  SecurityAuditor.logEvent({
    type: "rate_limit_exceeded",
    ip,
    userAgent,
    details: { endpoint },
  })
}

export function logUnauthorizedAccess(userId: string | undefined, ip: string, userAgent: string, resource: string) {
  SecurityAuditor.logEvent({
    type: "unauthorized_access",
    userId,
    ip,
    userAgent,
    details: { resource },
  })
}


