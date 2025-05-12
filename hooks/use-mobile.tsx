"use client"

import { useState, useEffect } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(0)

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        const width = window.innerWidth
        setViewportWidth(width)
        setIsMobile(width < 768)
      }

      // Initial check
      checkMobile()

      // Add event listener for window resize
      window.addEventListener("resize", checkMobile)

      // Cleanup
      return () => window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return { isMobile, viewportWidth }
}
