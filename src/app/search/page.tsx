"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  Filter,
  FileText,
  FolderOpen,
  Tag,
  User,
  Calendar,
  Eye,
  MessageSquare,
  Heart,
  AlertCircle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { formatRelativeTime, truncateText } from "@/lib/utils"

interface SearchResult {
  id: string
  type: "post" | "category" | "tag" | "user"
  title?: string
  name?: string
  slug: string
  excerpt?: string
  description?: string
  bio?: string
  content?: string
  featuredImage?: string
  color?: string
  publishedAt?: string
  author?: {
    name: string
    image: string | null
  }
  _count?: {
    posts?: number
    comments?: number
    likes?: number
  }
  viewCount?: number
}

interface SearchBreakdown {
  posts: number
  categories: number
  tags: number
  users: number
}

interface SearchError {
  message: string
  code?: string
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  )
}

function SearchClient() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<SearchError | null>(null)
  const [searchType, setSearchType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [breakdown, setBreakdown] = useState<SearchBreakdown>({
    posts: 0,
    categories: 0,
    tags: 0,
    users: 0
  })

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        page: currentPage.toString(),
        limit: "12",
      })

      const response = await fetch(`/api/search?${params}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Search failed with status ${response.status}`)
      }

      const data = await response.json()
      setResults(data.results || [])

      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
      }

      if (data.breakdown) {
        setBreakdown(data.breakdown)
      }
    } catch (error) {
      console.error("Error performing search:", error)
      setError({
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        code: "SEARCH_ERROR"
      })
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [searchType, currentPage])

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery, performSearch])

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query, searchType, currentPage, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError({ message: "Please enter a search term", code: "EMPTY_QUERY" })
      return
    }
    setCurrentPage(1)
    setError(null)
    performSearch(query)
  }

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleTypeChange = (type: string) => {
    setSearchType(type)
    setCurrentPage(1)
    setError(null)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="w-5 h-5" />
      case "category":
        return <FolderOpen className="w-5 h-5" />
      case "tag":
        return <Tag className="w-5 h-5" />
      case "user":
        return <User className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case "post":
        return `/posts/${result.slug}`
      case "category":
        return `/categories/${result.slug}`
      case "tag":
        return `/tags/${result.slug}`
      case "user":
        return `/authors/${result.slug}`
      default:
        return "#"
    }
  }

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${
            result.type === "post" ? "bg-blue-100 text-blue-600" :
            result.type === "category" ? "bg-green-100 text-green-600" :
            result.type === "tag" ? "bg-purple-100 text-purple-600" :
            "bg-gray-100 text-gray-600"
          }`}>
            {getResultIcon(result.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {result.type}
              </Badge>
              {result._count?.posts && (
                <span className="text-xs text-gray-500">
                  {result._count.posts} posts
                </span>
              )}
            </div>
            
            <Link href={getResultUrl(result)}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors mb-2">
                {result.title || result.name}
              </h3>
            </Link>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {result.excerpt || result.description || result.bio || 
               (result.content && truncateText(result.content.replace(/<[^>]*>/g, ""), 150))}
            </p>
            
            {result.type === "post" && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {result.author && (
                  <span>by {result.author.name}</span>
                )}
                {result.publishedAt && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatRelativeTime(result.publishedAt)}</span>
                  </div>
                )}
                {result.viewCount !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{result.viewCount}</span>
                  </div>
                )}
                {result._count?.comments !== undefined && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{result._count.comments}</span>
                  </div>
                )}
                {result._count?.likes !== undefined && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{result._count.likes}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {result.featuredImage && (
            <div className="flex-shrink-0">
              <Image
                src={result.featuredImage}
                alt={result.title || result.name || ""}
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded-lg"
                unoptimized
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Search</h1>
          <p className="text-xl text-gray-600">
            Find posts, categories, tags, and authors
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
            
            {/* Search Type Filter */}
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex space-x-2">
                {[
                  { value: "all", label: "All" },
                  { value: "posts", label: "Posts" },
                  { value: "categories", label: "Categories" },
                  { value: "tags", label: "Tags" },
                  { value: "users", label: "Authors" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      searchType === type.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                    {breakdown[type.value as keyof SearchBreakdown] && (
                      <span className="ml-1">({breakdown[type.value as keyof SearchBreakdown]})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Search Error</h3>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Searching..." />
          </div>
        ) : error ? null : query && results.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Search Results for &ldquo;{query}&rdquo;
              </h2>
              <p className="text-gray-600">
                Found {results.length} results
              </p>
            </div>
            
            <div className="space-y-6 mb-12">
              {results.map((result) => (
                <ResultCard key={`${result.type}-${result.id}`} result={result} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="justify-center"
              />
            )}
          </>
        ) : query && !loading ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No results found for &ldquo;{query}&rdquo;
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse our categories.
            </p>
            <Link
              href="/categories"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Start searching
            </h3>
            <p className="text-gray-600">
              Enter a search term above to find posts, categories, tags, and authors.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
