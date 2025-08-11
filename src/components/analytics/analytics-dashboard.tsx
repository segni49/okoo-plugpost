"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"
import {
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Eye,
  Zap,
  Target
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"

interface AnalyticsData {
  overview: {
    totalPosts: number
    totalUsers: number
    totalComments: number
    totalViews: number
    publishedPosts: number
    recentPosts: number
    recentUsers: number
    recentComments: number
  }
  topPosts: Array<{
    id: string
    title: string
    viewCount: number
    author: { name: string }
    _count: { comments: number; likes: number }
  }>
  dailyViews: Array<{
    date: string
    views: number
    uniqueViews: number
  }>
  categories: Array<{
    name: string
    totalPosts: number
    totalViews: number
    color: string
  }>
  topAuthors: Array<{
    name: string
    totalPosts: number
    totalViews: number
  }>
}

interface PerformanceData {
  performanceScore: number
  coreWebVitals: {
    LCP?: { average: number; p95: number }
    FID?: { average: number; p95: number }
    CLS?: { average: number; p95: number }
    TTFB?: { average: number; p95: number }
  }
  statistics: Array<{
    metric: string
    average: number
    p95: number
    count: number
  }>
}

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}&type=all`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }, [period])

  const fetchPerformance = useCallback(async () => {
    try {
      const response = await fetch(`/api/analytics/performance?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      }
    } catch (error) {
      console.error("Error fetching performance data:", error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
    fetchPerformance()
  }, [fetchAnalytics, fetchPerformance])

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const getWebVitalColor = (metric: string, value: number) => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 600, poor: 1500 },
    }

    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return "text-gray-600"

    if (value <= threshold.good) return "text-green-600"
    if (value >= threshold.poor) return "text-red-600"
    return "text-yellow-600"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Loading analytics..." />
      </div>
    )
  }



  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriod(days)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === days
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalPosts}
                  </p>
                  <p className="text-sm text-green-600">
                    +{analyticsData.overview.recentPosts} this period
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalUsers}
                  </p>
                  <p className="text-sm text-green-600">
                    +{analyticsData.overview.recentUsers} this period
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalViews.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600">
                    {analyticsData.dailyViews.reduce((sum, day) => sum + day.views, 0).toLocaleString()} this period
                  </p>
                </div>
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.overview.totalComments}
                  </p>
                  <p className="text-sm text-green-600">
                    +{analyticsData.overview.recentComments} this period
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Score */}
      {performanceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Performance Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getPerformanceColor(performanceData.performanceScore)}`}>
                  {performanceData.performanceScore}
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                {Object.entries(performanceData.coreWebVitals).map(([metric, data]) => {
                  if (!data) return null
                  return (
                    <div key={metric} className="text-center">
                      <div className={`text-lg font-semibold ${getWebVitalColor(metric, data.average)}`}>
                        {metric === "CLS" ? data.average.toFixed(3) : Math.round(data.average)}
                        {metric !== "CLS" && "ms"}
                      </div>
                      <div className="text-xs text-gray-600">{metric}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart */}
        {analyticsData && analyticsData.dailyViews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Daily Traffic</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value: string) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value: string) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Total Views"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uniqueViews" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Unique Views"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Posts */}
        {analyticsData && analyticsData.topPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Top Posts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topPosts.slice(0, 5).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {index + 1}. {post.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        by {post.author.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {post.viewCount.toLocaleString()} views
                      </p>
                      <p className="text-xs text-gray-500">
                        {post._count.comments} comments
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Categories Chart */}
      {analyticsData && analyticsData.categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.categories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalViews" fill="#3B82F6" name="Total Views" />
                <Bar dataKey="totalPosts" fill="#10B981" name="Total Posts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
