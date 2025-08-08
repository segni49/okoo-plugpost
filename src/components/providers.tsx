"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/toast"
import { getPerformanceMonitor, optimizeImageLoading, trackBundleSize } from "@/lib/performance"

interface ProvidersProps {
  children: React.ReactNode
}

function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring
    const monitor = getPerformanceMonitor()

    // Optimize image loading
    optimizeImageLoading()

    // Track bundle sizes
    trackBundleSize()

    // Record page load time
    if (typeof window !== "undefined") {
      window.addEventListener("load", () => {
        const loadTime = performance.now()
        monitor.recordMetric("PageLoad", loadTime, {
          url: window.location.href,
        })
      })
    }

    return () => {
      monitor.destroy()
    }
  }, [])

  return <>{children}</>
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <PerformanceProvider>
          {children}
        </PerformanceProvider>
      </ToastProvider>
    </SessionProvider>
  )
}
