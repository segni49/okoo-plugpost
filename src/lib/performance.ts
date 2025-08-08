// Performance monitoring utilities

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // Core Web Vitals observer
    if ("PerformanceObserver" in window) {
      try {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.recordMetric("LCP", lastEntry.startTime, {
            element: lastEntry.element?.tagName,
            url: lastEntry.url,
          })
        })
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] })
        this.observers.push(lcpObserver)

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric("FID", entry.processingStart - entry.startTime, {
              eventType: entry.name,
            })
          })
        })
        fidObserver.observe({ entryTypes: ["first-input"] })
        this.observers.push(fidObserver)

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.recordMetric("CLS", clsValue)
        })
        clsObserver.observe({ entryTypes: ["layout-shift"] })
        this.observers.push(clsObserver)

        // Navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric("TTFB", entry.responseStart - entry.requestStart)
            this.recordMetric("DOMContentLoaded", entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart)
            this.recordMetric("LoadComplete", entry.loadEventEnd - entry.loadEventStart)
          })
        })
        navigationObserver.observe({ entryTypes: ["navigation"] })
        this.observers.push(navigationObserver)

        // Resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.initiatorType === "img") {
              this.recordMetric("ImageLoad", entry.duration, {
                url: entry.name,
                size: entry.transferSize,
              })
            } else if (entry.initiatorType === "script") {
              this.recordMetric("ScriptLoad", entry.duration, {
                url: entry.name,
                size: entry.transferSize,
              })
            }
          })
        })
        resourceObserver.observe({ entryTypes: ["resource"] })
        this.observers.push(resourceObserver)
      } catch (error) {
        console.warn("Performance monitoring setup failed:", error)
      }
    }
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Send critical metrics to analytics
    if (this.isCriticalMetric(name, value)) {
      this.sendToAnalytics(metric)
    }
  }

  private isCriticalMetric(name: string, value: number): boolean {
    const thresholds = {
      LCP: 2500, // 2.5 seconds
      FID: 100,  // 100ms
      CLS: 0.1,  // 0.1
      TTFB: 600, // 600ms
    }

    return name in thresholds && value > thresholds[name as keyof typeof thresholds]
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Send to your analytics endpoint
      await fetch("/api/analytics/performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          timestamp: metric.timestamp,
          metadata: {
            ...metric.metadata,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
          },
        }),
      })
    } catch (error) {
      console.warn("Failed to send performance metric:", error)
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name)
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return 0
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0)
    return sum / metrics.length
  }

  getCoreWebVitals() {
    return {
      LCP: this.getAverageMetric("LCP"),
      FID: this.getAverageMetric("FID"),
      CLS: this.getAverageMetric("CLS"),
      TTFB: this.getAverageMetric("TTFB"),
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics = []
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = getPerformanceMonitor()

  const recordCustomMetric = (name: string, value: number, metadata?: Record<string, any>) => {
    monitor.recordMetric(name, value, metadata)
  }

  const getCoreWebVitals = () => monitor.getCoreWebVitals()
  const getMetrics = () => monitor.getMetrics()

  return {
    recordCustomMetric,
    getCoreWebVitals,
    getMetrics,
  }
}

// Utility functions for common performance measurements
export function measureAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  return operation().then(
    (result) => {
      const duration = performance.now() - start
      getPerformanceMonitor().recordMetric(name, duration)
      return result
    },
    (error) => {
      const duration = performance.now() - start
      getPerformanceMonitor().recordMetric(name, duration, { error: true })
      throw error
    }
  )
}

export function measureSyncOperation<T>(
  name: string,
  operation: () => T
): T {
  const start = performance.now()
  
  try {
    const result = operation()
    const duration = performance.now() - start
    getPerformanceMonitor().recordMetric(name, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    getPerformanceMonitor().recordMetric(name, duration, { error: true })
    throw error
  }
}

// Image loading optimization
export function optimizeImageLoading() {
  if (typeof window === "undefined") return

  // Lazy loading for images
  const images = document.querySelectorAll("img[data-src]")
  
  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src) {
            const start = performance.now()
            img.src = src
            img.onload = () => {
              const duration = performance.now() - start
              getPerformanceMonitor().recordMetric("LazyImageLoad", duration, {
                url: src,
              })
            }
            img.removeAttribute("data-src")
            imageObserver.unobserve(img)
          }
        }
      })
    })

    images.forEach((img) => imageObserver.observe(img))
  }
}

// Bundle size monitoring
export function trackBundleSize() {
  if (typeof window === "undefined") return

  // Monitor script loading
  const scripts = document.querySelectorAll("script[src]")
  scripts.forEach((script) => {
    const src = script.getAttribute("src")
    if (src && !src.startsWith("data:")) {
      fetch(src, { method: "HEAD" })
        .then((response) => {
          const size = response.headers.get("content-length")
          if (size) {
            getPerformanceMonitor().recordMetric("BundleSize", parseInt(size), {
              url: src,
            })
          }
        })
        .catch(() => {
          // Ignore errors for cross-origin scripts
        })
    }
  })
}
