import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface PerformanceData {
  metric: string
  value: number
  timestamp: number
  metadata?: {
    userAgent?: string
    url?: string
    referrer?: string
    [key: string]: string | number | boolean | null | undefined
  }
}

interface MetricAggregation {
  count: number
  sum: number
  min: number
  max: number
  values: Array<{
    value: number
    timestamp: Date
    url: string
  }>
}

interface PerformanceStatistic {
  metric: string
  count: number
  average: number
  min: number
  max: number
  p50: number
  p75: number
  p90: number
  p95: number
  recentValues: Array<{
    value: number
    timestamp: Date
    url: string
  }>
}

// POST /api/analytics/performance - Record performance metrics
export async function POST(request: NextRequest) {
  try {
    const data: PerformanceData = await request.json()
    
    // Validate the data
    if (!data.metric || typeof data.value !== "number") {
      return NextResponse.json(
        { error: "Invalid performance data" },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown"
    
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Store performance metric (you might want to use a different storage solution for high-volume data)
    await prisma.performanceMetric.create({
      data: {
        metric: data.metric,
        value: data.value,
        timestamp: new Date(data.timestamp),
        url: data.metadata?.url || "",
        userAgent: data.metadata?.userAgent || userAgent,
        clientIP,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording performance metric:", error)
    return NextResponse.json(
      { error: "Failed to record performance metric" },
      { status: 500 }
    )
  }
}

// GET /api/analytics/performance - Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get("period") || "7") // days
    const metric = searchParams.get("metric")
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Build where clause
    const where: {
      timestamp: { gte: Date }
      metric?: string
    } = {
      timestamp: { gte: startDate },
    }
    
    if (metric) {
      where.metric = metric
    }

    // Get performance metrics
    const metrics = await prisma.performanceMetric.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 1000, // Limit to prevent large responses
    })

    // Aggregate data by metric type
    const aggregated = metrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = {
          count: 0,
          sum: 0,
          min: metric.value,
          max: metric.value,
          values: [],
        }
      }

      const metricData = acc[metric.metric]
      metricData.count++
      metricData.sum += metric.value
      metricData.min = Math.min(metricData.min, metric.value)
      metricData.max = Math.max(metricData.max, metric.value)
      metricData.values.push({
        value: metric.value,
        timestamp: metric.timestamp,
        url: metric.url || '',
      })

      return acc
    }, {} as Record<string, MetricAggregation>)

    // Calculate statistics
    const statistics: PerformanceStatistic[] = Object.entries(aggregated).map(([metricName, data]) => {
      const average = data.sum / data.count

      // Calculate percentiles
      const sortedValues = data.values.map(v => v.value).sort((a: number, b: number) => a - b)
      const p50 = sortedValues[Math.floor(sortedValues.length * 0.5)]
      const p75 = sortedValues[Math.floor(sortedValues.length * 0.75)]
      const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)]
      const p95 = sortedValues[Math.floor(sortedValues.length * 0.95)]

      return {
        metric: metricName,
        count: data.count,
        average: Math.round(average * 100) / 100,
        min: data.min,
        max: data.max,
        p50,
        p75,
        p90,
        p95,
        recentValues: data.values.slice(0, 10), // Last 10 values
      }
    })

    // Core Web Vitals assessment
    const coreWebVitals = {
      LCP: statistics.find(s => s.metric === "LCP"),
      FID: statistics.find(s => s.metric === "FID"),
      CLS: statistics.find(s => s.metric === "CLS"),
      TTFB: statistics.find(s => s.metric === "TTFB"),
    }

    // Performance score calculation
    const calculateScore = (metric: string, value: number): number => {
      const thresholds = {
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        TTFB: { good: 600, poor: 1500 },
      }

      const threshold = thresholds[metric as keyof typeof thresholds]
      if (!threshold) return 50

      if (value <= threshold.good) return 100
      if (value >= threshold.poor) return 0
      
      // Linear interpolation between good and poor
      const range = threshold.poor - threshold.good
      const position = value - threshold.good
      return Math.round(100 - (position / range) * 100)
    }

    const performanceScore = Object.entries(coreWebVitals)
      .filter(([, data]) => data)
      .reduce((acc, [metric, data]) => {
        const score = calculateScore(metric, data!.average)
        return acc + score
      }, 0) / Object.values(coreWebVitals).filter(Boolean).length

    return NextResponse.json({
      statistics,
      coreWebVitals,
      performanceScore: Math.round(performanceScore || 0),
      period,
      totalMetrics: metrics.length,
    })
  } catch (error) {
    console.error("Error fetching performance analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch performance analytics" },
      { status: 500 }
    )
  }
}
