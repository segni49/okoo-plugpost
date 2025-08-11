import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN])
}

export async function requireEditor() {
  return requireRole([UserRole.ADMIN, UserRole.EDITOR])
}

export async function requireContributor() {
  return requireRole([UserRole.ADMIN, UserRole.EDITOR, UserRole.CONTRIBUTOR])
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN
}

export function isEditor(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN || userRole === UserRole.EDITOR
}

export function isContributor(userRole: UserRole): boolean {
  return (
    userRole === UserRole.ADMIN ||
    userRole === UserRole.EDITOR ||
    userRole === UserRole.CONTRIBUTOR
  )
}
