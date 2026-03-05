import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  pageLoadTime: number | null
  firstContentfulPaint: number | null
  largestContentfulPaint: number | null
}

export const usePerformance = (pageName: string) => {
  const metricsRef = useRef<PerformanceMetrics>({
    pageLoadTime: null,
    firstContentfulPaint: null,
    largestContentfulPaint: null
  })

  useEffect(() => {
    const startTime = performance.now()

    const measurePageLoad = () => {
      const loadTime = performance.now() - startTime
      metricsRef.current.pageLoadTime = loadTime

      if (loadTime > 3000) {
        console.warn(`[Performance] ${pageName} load time exceeded 3s: ${loadTime.toFixed(0)}ms`)
      }
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          metricsRef.current.firstContentfulPaint = entry.startTime
        }
        if (entry.entryType === 'largest-contentful-paint') {
          metricsRef.current.largestContentfulPaint = entry.startTime
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
    } catch (e) {
      // PerformanceObserver not supported
    }

    requestIdleCallback ? requestIdleCallback(measurePageLoad) : setTimeout(measurePageLoad, 0)

    return () => {
      observer.disconnect()
    }
  }, [pageName])

  return metricsRef.current
}

export default usePerformance
