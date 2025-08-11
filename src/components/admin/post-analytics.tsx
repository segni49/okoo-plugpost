"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Eye, 
  MessageCircle, 
  Heart, 
  Bookmark, 
  Share2, 
  TrendingUp,
  Clock,
  Calendar
} from "lucide-react"

interface PostAnalyticsProps {
  postId: string
}

interface AnalyticsData {
  views: number
  uniqueViews: number
  comments: number
  likes: number
  bookmarks: number
  shares: number
  avgReadTime: number
  bounceRate: number
  publishedAt: string | null
  lastViewed: string | null
}

export function PostAnalytics({ postId }: PostAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d") // 7d, 30d, 90d, all

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [postId, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [postId, timeRange, fetchAnalytics])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const metrics = [
    {
      label: "Total Views",
      value: formatNumber(analytics.views),
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Unique Views",
      value: formatNumber(analytics.uniqueViews),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Comments",
      value: formatNumber(analytics.comments),
      icon: MessageCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Likes",
      value: formatNumber(analytics.likes),
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Bookmarks",
      value: formatNumber(analytics.bookmarks),
      icon: Bookmark,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Shares",
      value: formatNumber(analytics.shares),
      icon: Share2,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      label: "Avg. Read Time",
      value: formatDuration(analytics.avgReadTime),
      icon: Clock,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      label: "Bounce Rate",
      value: `${analytics.bounceRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Select time range for analytics"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600">
                {metric.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          {analytics.publishedAt && (
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Published: {new Date(analytics.publishedAt).toLocaleDateString()}
            </div>
          )}
          {analytics.lastViewed && (
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Last viewed: {new Date(analytics.lastViewed).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Engagement Rate */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-900">
              Engagement Rate
            </div>
            <div className="text-xs text-blue-700">
              (Comments + Likes + Bookmarks) / Views
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {analytics.views > 0
              ? (((analytics.comments + analytics.likes + analytics.bookmarks) / analytics.views) * 100).toFixed(1)
              : "0"
            }%
          </div>
        </div>
      </div>
    </div>
  )
}
