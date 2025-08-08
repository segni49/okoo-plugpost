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
  Share2,
  ArrowLeft,
  User,
  Tag
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { formatDate, formatRelativeTime, calculateReadingTime } from "@/lib/utils"
import { CommentSection } from "@/components/comments/comment-section"

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
  seoTitle: string | null
  seoDescription: string | null
  author: {
    id: string
    name: string
    image: string | null
    bio: string | null
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

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string
    image: string | null
  }
  replies?: Comment[]
}

export default function PostPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (slug) {
      fetchPost()
    }
  }, [slug])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const [postRes, commentsRes] = await Promise.all([
        fetch(`/api/posts/slug/${slug}`),
        fetch(`/api/posts/slug/${slug}/comments`),
      ])

      if (postRes.ok) {
        const postData = await postRes.json()
        setPost(postData)
        setLikeCount(postData._count.likes)
        
        // Track view
        fetch(`/api/posts/${postData.id}/analytics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "view", data: { isUnique: true } }),
        })

        // Fetch related posts
        if (postData.category) {
          const relatedRes = await fetch(`/api/posts?categoryId=${postData.category.id}&limit=3&exclude=${postData.id}`)
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json()
            setRelatedPosts(relatedData.posts)
          }
        }
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        setComments(commentsData.comments)
      }
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!post) return

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        setLikeCount(data.likeCount)
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: window.location.href,
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Loading post..." />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
          <Link
            href="/posts"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/posts"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Link>

          {/* Category */}
          {post.category && (
            <div className="mb-4">
              <Link href={`/categories/${post.category.slug}`}>
                <Badge 
                  style={{ backgroundColor: post.category.color }}
                  className="text-white"
                >
                  {post.category.name}
                </Badge>
              </Link>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-gray-500 mb-8">
            <div className="flex items-center space-x-3">
              {post.author.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm">{formatDate(post.publishedAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.viewCount} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-4 h-4" />
                <span>{post._count.comments} comments</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-8">
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none mb-12"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Author Bio */}
            {post.author.bio && (
              <Card className="mb-12">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {post.author.image ? (
                      <img
                        src={post.author.image}
                        alt={post.author.name}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        About {post.author.name}
                      </h3>
                      <p className="text-gray-600">{post.author.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Comments ({comments.length})
              </h3>
              
              {/* Comment Form */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Leave a Comment
                  </h4>
                  <form className="space-y-4">
                    <textarea
                      rows={4}
                      placeholder="Write your comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Post Comment
                    </button>
                  </form>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {comment.author.image ? (
                          <img
                            src={comment.author.image}
                            alt={comment.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {comment.author.name}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Related Posts
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <div key={relatedPost.id} className="flex space-x-3">
                        {relatedPost.featuredImage && (
                          <div className="flex-shrink-0">
                            <img
                              src={relatedPost.featuredImage}
                              alt={relatedPost.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/posts/${relatedPost.slug}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                          >
                            {relatedPost.title}
                          </Link>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(relatedPost.publishedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
