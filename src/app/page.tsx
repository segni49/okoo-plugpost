"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  Heart,
  ArrowRight,
  TrendingUp
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading, PostCardSkeleton } from "@/components/ui/loading"
import { formatRelativeTime, truncateText } from "@/lib/utils"

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
  category: {
    id: string
    name: string
    slug: string
    color: string
  } | null
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

interface Category {
  id: string
  name: string
  slug: string
  color: string
  _count: {
    posts: number
  }
}

export default function HomePage() {
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [popularPosts, setPopularPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHomeData()
  }, [])

  const fetchHomeData = async () => {
    try {
      setLoading(true)
      const [featuredRes, recentRes, popularRes, categoriesRes] = await Promise.all([
        fetch("/api/posts?limit=3&sortBy=publishedAt&sortOrder=desc"),
        fetch("/api/posts?limit=6&sortBy=publishedAt&sortOrder=desc"),
        fetch("/api/posts?limit=5&sortBy=viewCount&sortOrder=desc"),
        fetch("/api/categories?includePostCount=true"),
      ])

      if (featuredRes.ok) {
        const data = await featuredRes.json()
        setFeaturedPosts(data.posts.slice(0, 3))
      }

      if (recentRes.ok) {
        const data = await recentRes.json()
        setRecentPosts(data.posts.slice(3)) // Skip first 3 (featured)
      }

      if (popularRes.ok) {
        const data = await popularRes.json()
        setPopularPosts(data.posts)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching home data:", error)
    } finally {
      setLoading(false)
    }
  }

  const PostCard = ({ post, featured = false }: { post: Post; featured?: boolean }) => (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${featured ? "h-full" : ""}`}>
      {post.featuredImage && (
        <div className={`relative ${featured ? "h-48" : "h-40"} overflow-hidden`}>
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {post.category && (
            <div className="absolute top-4 left-4">
              <Badge
                style={{ backgroundColor: post.category.color }}
                className="text-white"
              >
                {post.category.name}
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardContent className="p-6">
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
            <span>{post.readTime} min read</span>
          </div>
        </div>

        <Link href={`/posts/${post.slug}`}>
          <h2 className={`font-bold text-gray-900 hover:text-blue-600 transition-colors mb-3 ${
            featured ? "text-xl" : "text-lg"
          }`}>
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {post.excerpt || truncateText(post.content.replace(/<[^>]*>/g, ""), 150)}
        </p>

        <div className="flex items-center justify-between">
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
          <Link
            href={`/posts/${post.slug}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1"
          >
            <span>Read more</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(3)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-blue-600">PlugPost</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover amazing stories, insights, and ideas from our community of writers.
              Stay updated with the latest trends and join the conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/posts"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Explore Posts
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Browse Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Featured Posts</h2>
              <Link
                href="/posts"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <PostCard key={post.id} post={post} featured />
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Posts */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Recent Posts</h2>
              <Link
                href="/posts"
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-8">
              {recentPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Popular Posts */}
            {popularPosts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Popular Posts
                  </h3>
                  <div className="space-y-4">
                    {popularPosts.map((post, index) => (
                      <div key={post.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/posts/${post.slug}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                          >
                            {post.title}
                          </Link>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                            <span>{post.viewCount} views</span>
                            <span>•</span>
                            <span>{post._count.comments} comments</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Categories</h3>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{category._count.posts}</span>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/categories"
                    className="block mt-4 text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    View all categories
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
