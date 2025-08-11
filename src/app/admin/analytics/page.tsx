"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loading } from "@/components/ui/loading"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"

interface Overview {
  totalPosts: number
  totalUsers: number
  totalComments: number
  totalViews: number
  publishedPosts: number
  recentPosts: number
  recentUsers: number
  recentComments: number
}

interface DailyView { date: string; views: number; uniqueViews: number }

interface TopPost { id: string; title: string; slug: string; viewCount: number; _count: { comments: number; likes: number } }

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [dailyViews, setDailyViews] = useState<DailyView[]>([])
  const [topPosts, setTopPosts] = useState<TopPost[]>([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const [ovRes, trafficRes, postsRes] = await Promise.all([
        fetch("/api/analytics?type=overview"),
        fetch("/api/analytics?type=traffic"),
        fetch("/api/analytics?type=posts"),
      ])

      if (ovRes.ok) {
        const data = await ovRes.json()
        setOverview(data.overview)
      }
      if (trafficRes.ok) {
        const data = await trafficRes.json()
        const normalized = (data.dailyViews || []).map((d: { date: string | number | Date; views: number; uniqueViews: number }) => ({
          date: new Date(d.date).toLocaleDateString(),
          views: d.views,
          uniqueViews: d.uniqueViews,
        }))
        setDailyViews(normalized)
      }
      if (postsRes.ok) {
        const data = await postsRes.json()
        setTopPosts(data.topPosts || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6"><Loading text="Loading analytics..." /></div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card><CardHeader><CardTitle>Posts</CardTitle></CardHeader><CardContent>
            <div className="text-2xl font-bold">{overview.totalPosts}</div>
            <p className="text-sm text-gray-500">{overview.publishedPosts} published</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Users</CardTitle></CardHeader><CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-sm text-gray-500">{overview.recentUsers} joined recently</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Comments</CardTitle></CardHeader><CardContent>
            <div className="text-2xl font-bold">{overview.totalComments}</div>
            <p className="text-sm text-gray-500">{overview.recentComments} recent</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Views</CardTitle></CardHeader><CardContent>
            <div className="text-2xl font-bold">{overview.totalViews.toLocaleString()}</div>
          </CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Traffic (Last 30 days)</CardTitle></CardHeader>
        <CardContent style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyViews} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} dot={false} name="Views" />
              <Line type="monotone" dataKey="uniqueViews" stroke="#16a34a" strokeWidth={2} dot={false} name="Unique" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Top Posts</CardTitle></CardHeader>
        <CardContent style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPosts} margin={{ left: 12, right: 12, top: 10, bottom: 10 }}>
              <XAxis dataKey="title" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="viewCount" fill="#22c55e" name="Views" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {topPosts.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm text-gray-700">
                <span className="truncate">{p.title}</span>
                <span className="text-gray-500">{p.viewCount.toLocaleString()} views</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

