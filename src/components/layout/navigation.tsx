"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { 
  Menu, 
  X, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  PenTool,
  LayoutDashboard
} from "lucide-react"
import { Dropdown } from "@/components/ui/dropdown"
import { SearchWithSuggestions } from "@/components/ui/search"

export function Navigation() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Posts", href: "/posts" },
    { name: "Categories", href: "/categories" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ]

  const userMenuItems = session ? [
    {
      label: "Profile",
      value: "profile",
      icon: <User className="w-4 h-4" />,
      onClick: () => window.location.href = "/admin/profile",
    },
    ...(session.user.role === "ADMIN" || session.user.role === "EDITOR" ? [
      {
        label: "Admin Dashboard",
        value: "admin",
        icon: <LayoutDashboard className="w-4 h-4" />,
        onClick: () => window.location.href = "/admin",
      },
    ] : []),
    ...(session.user.role !== "SUBSCRIBER" ? [
      {
        label: "Write Post",
        value: "write",
        icon: <PenTool className="w-4 h-4" />,
        onClick: () => window.location.href = "/admin/posts/new",
      },
    ] : []),
    {
      label: "Settings",
      value: "settings",
      icon: <Settings className="w-4 h-4" />,
      onClick: () => window.location.href = "/admin/settings",
    },
    {
      label: "Sign Out",
      value: "signout",
      icon: <LogOut className="w-4 h-4" />,
      onClick: () => signOut(),
    },
  ] : []

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                PlugPost
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search and user menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {/* Search */}
            <div className="relative">
              {searchOpen ? (
                <SearchWithSuggestions
                  placeholder="Search posts, categories, tags..."
                  onSearch={(query) => {
                    if (query.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(query)}`
                    }
                  }}
                  onSuggestionClick={(suggestion) => {
                    window.location.href = suggestion.url
                  }}
                  className="w-64"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Search"
                  aria-label="Open search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* User menu */}
            {session ? (
              <Dropdown
                trigger={
                  <button type="button" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {session.user.name}
                    </span>
                  </button>
                }
                items={userMenuItems}
                align="right"
              />
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* Mobile search */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mobile user menu */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {session ? (
              <div className="px-4 space-y-1">
                <div className="flex items-center px-4 py-2">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {session.user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {session.user.email}
                    </div>
                  </div>
                </div>
                {userMenuItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      item.onClick()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 space-y-1">
                <Link
                  href="/auth/signin"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
