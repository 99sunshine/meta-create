'use client'

// /main is kept for backwards compatibility; it redirects to /explore
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MainRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/explore')
  }, [router])
  return null
}
