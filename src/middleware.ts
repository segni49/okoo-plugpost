import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { rateLimiters, checkBlockedIP, trackSuspiciousActivity } from "@/lib/rate-limit"

// Security headers
const securityHeaders = {
  "X-XSS-Protection": "1; mode=block",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
  ].join("; "),
}

// Rate limited routes
const rateLimitedRoutes = {
  "/api/auth": rateLimiters.auth,
  "/api/comments": rateLimiters.comments,
  "/api/search": rateLimiters.search,
}

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
    const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
    const pathname = req.nextUrl.pathname

    // Create response with security headers
    const response = NextResponse.next()
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Check for blocked IPs
    const blockedResponse = checkBlockedIP(req)
    if (blockedResponse) {
      return blockedResponse
    }

    // Apply rate limiting
    for (const [route, limiter] of Object.entries(rateLimitedRoutes)) {
      if (pathname.startsWith(route)) {
        const rateLimitResponse = await limiter.middleware(req)
        if (rateLimitResponse) {
          const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                    req.headers.get("x-real-ip") ||
                    "unknown"
          trackSuspiciousActivity(ip)
          return rateLimitResponse
        }
        break
      }
    }

    // Log suspicious activity
    if (pathname.includes("..") || pathname.includes("//") || pathname.includes("%")) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                req.headers.get("x-real-ip") ||
                "unknown"
      trackSuspiciousActivity(ip)
      return new NextResponse("Bad Request", { status: 400 })
    }

    // Allow API auth routes
    if (isApiAuthRoute) {
      return response
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    // Redirect unauthenticated users to sign in
    if (!isAuth && !isAuthPage) {
      if (isAdminPage || req.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    // Check role-based access for admin routes
    if (isAdminPage && isAuth) {
      const userRole = token?.role as string
      if (userRole === "ADMIN" || userRole === "EDITOR") {
        // allowed
      } else if (userRole === "CONTRIBUTOR") {
        const allowedContributorPaths = ["/admin/posts", "/admin/profile"]
        const isAllowed = allowedContributorPaths.some(p => pathname === p || pathname.startsWith(`${p}/`))
        if (!isAllowed) {
          return NextResponse.redirect(new URL("/", req.url))
        }
      } else {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    // Add request ID for tracking
    response.headers.set("X-Request-ID", crypto.randomUUID())

    // Add cache headers
    if (pathname.startsWith("/api/")) {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    }

    return response
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
}
