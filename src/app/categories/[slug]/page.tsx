"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  Calendar, 
  Clock, 
  Eye, 
  MessageSquare, 
  Heart, 
  ArrowLeft,
  FolderOpen,
  Search
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading, PostCardSkeleton } from "@/components/ui/loading"
import { Pagination } from "@/components/ui/pagination"
import { formatRelativeTime, truncateText } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  _count: {
    posts: number
  }
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featuredImage: string | null
  publishedAt: string
  readTime: number
  viewCount: number
  author: {
    id: string
    name: string
    image: string | null
  }
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  _count: {
    comments: number
    likes: number
  }
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [category, setCategory] = useState<Category | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("publishedAt")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (slug) {
      fetchCategory()
      fetchPosts()
    }
  }, [slug, currentPage, searchTerm, sortBy])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/categories/slug/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setCategory(data)
      }
    } catch (error) {
      console.error("Error fetching category:", error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "12",
        sortBy,
        sortOrder: "desc",
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/categories/slug/${slug}/posts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const PostCard = ({ post }: { post: Post }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
      {post.featuredImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-2">
            {post.author.image ? (
              <img
                src={post.author.image}
                alt={post.author.name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300" />
            )}
            <span>{post.author.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatRelativeTime(post.publishedAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{post.readTime} min</span>
          </div>
        </div>

        <Link href={`/posts/${post.slug}`}>
          <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors mb-3 line-clamp-2">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
          {post.excerpt || truncateText(post.content.replace(/<[^>]*>/g, ""), 150)}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>{post._count.comments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{post._count.likes}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!category && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link
            href="/categories"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/categories"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>

          {category && (
            <>
              <div className="flex items-center mb-6">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center mr-6"
                  style={{ backgroundColor: category.color }}
                >
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {category.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <span>{category._count.posts} posts</span>
                  </div>
                </div>
              </div>

              {category.description && (
                <p className="text-xl text-gray-600 max-w-3xl">
                  {category.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search posts in this category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="publishedAt">Latest</option>
                <option value="viewCount">Most Popular</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(12)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="justify-center"
            />
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "Try adjusting your search criteria."
                : "No posts have been published in this category yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
