"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FolderOpen, FileText, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  _count: {
    posts: number
  }
  posts?: Array<{
    id: string
    title: string
    slug: string
    featuredImage: string | null
    publishedAt: string
    author: {
      name: string
      image: string | null
    }
  }>
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/categories?includePostCount=true&includeRecentPosts=true")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Loading categories..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Browse Categories
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our content organized by topics. Find exactly what you're looking for.
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-0">
                  {/* Header */}
                  <div 
                    className="p-6 text-white"
                    style={{ backgroundColor: category.color }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <FolderOpen className="w-8 h-8" />
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {category._count.posts} posts
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
                    {category.description && (
                      <p className="text-white/90 text-sm">{category.description}</p>
                    )}
                  </div>

                  {/* Recent Posts */}
                  <div className="p-6">
                    {category.posts && category.posts.length > 0 ? (
                      <div className="space-y-4 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                          Recent Posts
                        </h3>
                        {category.posts.slice(0, 3).map((post) => (
                          <div key={post.id} className="flex items-start space-x-3">
                            {post.featuredImage && (
                              <div className="flex-shrink-0">
                                <img
                                  src={post.featuredImage}
                                  alt={post.title}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/posts/${post.slug}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                              >
                                {post.title}
                              </Link>
                              <p className="text-xs text-gray-500 mt-1">
                                by {post.author.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No posts yet</p>
                      </div>
                    )}

                    {/* View All Link */}
                    <Link
                      href={`/categories/${category.slug}`}
                      className="inline-flex items-center w-full justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      View All Posts
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Categories will appear here once they are created.</p>
          </div>
        )}

        {/* Stats */}
        {categories.length > 0 && (
          <div className="mt-16 bg-white rounded-lg shadow-sm border p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Content Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {categories.length}
                  </div>
                  <div className="text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {categories.reduce((total, cat) => total + cat._count.posts, 0)}
                  </div>
                  <div className="text-gray-600">Total Posts</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Math.round(categories.reduce((total, cat) => total + cat._count.posts, 0) / categories.length)}
                  </div>
                  <div className="text-gray-600">Avg Posts per Category</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
