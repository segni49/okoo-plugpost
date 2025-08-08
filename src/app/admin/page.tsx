"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Calendar,
  Plus,
  ArrowUpRight,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalUsers: number
  totalComments: number
  totalViews: number
  monthlyViews: number
}

interface RecentPost {
  id: string
  title: string
  status: string
  createdAt: string
  viewCount: number
  author: {
    name: string
    image: string | null
  }
}

interface RecentComment {
  id: string
  content: string
  createdAt: string
  author: {
    name: string
    image: string | null
  }
  post: {
    title: string
    slug: string
  }
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([])
  const [recentComments, setRecentComments] = useState<RecentComment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, postsRes, commentsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/recent-posts"),
        fetch("/api/admin/recent-comments"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setRecentPosts(postsData.posts)
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        setRecentComments(commentsData.comments)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "success"
      case "DRAFT":
        return "secondary"
      case "SCHEDULED":
        return "info"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.publishedPosts} published, {stats.draftPosts} drafts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
              <p className="text-xs text-muted-foreground">
                Total comments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyViews.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/posts/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Create Post</h3>
                <p className="text-sm text-gray-500">Write a new blog post</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-500">View and edit users</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>

            <Link
              href="/admin/comments"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">Moderate Comments</h3>
                <p className="text-sm text-gray-500">Review pending comments</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Posts</CardTitle>
            <Link
              href="/admin/posts"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {post.author.image ? (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={post.author.image}
                        alt={post.author.name}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>by {post.author.name}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {post.viewCount}
                      </span>
                    </div>
                  </div>
                  <Badge variant={getStatusColor(post.status) as any}>
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Comments</CardTitle>
            <Link
              href="/admin/comments"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {comment.author.image ? (
                        <img
                          className="h-6 w-6 rounded-full"
                          src={comment.author.image}
                          alt={comment.author.name}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-500">
                    on <Link href={`/posts/${comment.post.slug}`} className="text-blue-600 hover:text-blue-800">
                      {comment.post.title}
                    </Link>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Posts */}
      {stats && stats.scheduledPosts > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Scheduled Posts ({stats.scheduledPosts})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              You have {stats.scheduledPosts} posts scheduled for future publication.
            </p>
            <Link
              href="/admin/posts?status=SCHEDULED"
              className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              View scheduled posts
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
