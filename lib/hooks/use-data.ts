import useSWR from 'swr'
import { getDashboardData, getCalendarData } from '../server-actions'

/**
 * SWR fetcher function for server actions
 */
const fetcher = async (key: string) => {
  switch (key) {
    case 'dashboard':
      return await getDashboardData()
    case 'calendar':
      return await getCalendarData()
    default:
      throw new Error(`Unknown key: ${key}`)
  }
}

/**
 * Hook to fetch dashboard data with SWR caching
 * @returns Dashboard data with loading and error states
 */
export function useDashboardData() {
  const { data, error, isLoading, mutate } = useSWR('dashboard', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

/**
 * Hook to fetch calendar data with SWR caching
 * @returns Calendar data with loading and error states
 */
export function useCalendarData() {
  const { data, error, isLoading, mutate } = useSWR('calendar', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
