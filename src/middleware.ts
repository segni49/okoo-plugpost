import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin")
    const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")

    // Allow API auth routes
    if (isApiAuthRoute) {
      return NextResponse.next()
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

    // Check admin/editor permissions for admin routes
    if (isAdminPage && isAuth) {
      const userRole = token?.role as string
      if (userRole !== "ADMIN" && userRole !== "EDITOR") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle authorization
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/auth/:path*",
    "/api/admin/:path*",
  ]
}
