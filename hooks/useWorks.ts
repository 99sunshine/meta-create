'use client'

import { useState, useEffect } from 'react'
import type { WorkWithCreator } from '@/types'
import { WorksRepository } from '@/supabase/repos/works'

interface UseWorksOptions {
  limit?: number
  category?: string
  userId?: string
}

export function useWorks(options: UseWorksOptions = {}) {
  const [works, setWorks] = useState<WorkWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorks = async () => {
    setLoading(true)
    setError(null)

    try {
      const repo = new WorksRepository()
      let data: WorkWithCreator[]

      if (options.userId) {
        data = await repo.getWorksByUserId(options.userId, options.limit)
      } else if (options.category) {
        data = await repo.getWorksByCategory(options.category, options.limit)
      } else {
        data = await repo.getRecentWorks(options.limit)
      }

      setWorks(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch works'
      setError(errorMessage)
      console.error('useWorks error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorks()
  }, [options.limit, options.category, options.userId])

  return {
    works,
    loading,
    error,
    refetch: fetchWorks,
  }
}
