import { unstable_cache } from 'next/cache'

/**
 * Cache configuration for different data types
 */
export const CACHE_TAGS = {
  CLIENTS: 'clients',
  OBLIGATIONS: 'obligations', 
  TAXES: 'taxes',
  INSTALLMENTS: 'installments',
  DASHBOARD: 'dashboard',
  CALENDAR: 'calendar'
} as const

/**
 * Cache duration in seconds
 */
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600 // 1 hour
} as const

/**
 * Creates a cached version of a function with proper tags for invalidation
 */
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  key: string,
  tags: string[],
  revalidate: number = CACHE_DURATION.MEDIUM
) {
  return unstable_cache(fn, [key], {
    tags,
    revalidate
  })
}

/**
 * Cache keys for different operations
 */
export const CACHE_KEYS = {
  DASHBOARD_DATA: 'dashboard-data',
  CALENDAR_DATA: 'calendar-data',
  OBLIGATIONS_LIST: 'obligations-list',
  CLIENTS_LIST: 'clients-list',
  TAXES_LIST: 'taxes-list',
  INSTALLMENTS_LIST: 'installments-list'
} as const
