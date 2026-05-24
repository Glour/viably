'use client'

import { useState, useEffect } from 'react'
import { api, parseApiError } from '@/shared/api/client'
import type { UserPlanData, UserPlanResponse } from '../types'

export interface UseSubscriptionReturn {
  data: UserPlanData | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [data, setData] = useState<UserPlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('users/me/plan').json<UserPlanResponse>()
      setData(response.data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch subscription data')
      setError(error)
      console.error('useSubscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
