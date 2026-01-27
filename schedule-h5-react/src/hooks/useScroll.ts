import { useEffect, useRef } from 'react'

export function useScroll(key: string) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll-${key}`)
    if (savedPosition && scrollRef.current) {
      const position = parseInt(savedPosition, 10)
      scrollRef.current.scrollTop = position
      scrollPositionRef.current = position
    }
  }, [key])

  const saveScrollPosition = () => {
    if (scrollRef.current) {
      scrollPositionRef.current = scrollRef.current.scrollTop
      sessionStorage.setItem(`scroll-${key}`, scrollPositionRef.current.toString())
    }
  }

  useEffect(() => {
    const element = scrollRef.current
    if (element) {
      const handleScroll = () => {
        saveScrollPosition()
      }
      element.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        element.removeEventListener('scroll', handleScroll)
      }
    }
  }, [key])

  return scrollRef
}
