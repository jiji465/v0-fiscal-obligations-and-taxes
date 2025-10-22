"use server"

import { getObligations, getClients, getTaxes, getInstallments, getObligationsWithDetailsFiltered, getObligationsCount, type ObligationFilters } from "./supabase/database"
import { getObligationsWithDetails, calculateDashboardStats } from "./dashboard-utils"
import { createCachedFunction, CACHE_KEYS, CACHE_TAGS, CACHE_DURATION } from "./cache"
import type { DashboardStats, ObligationWithDetails, InstallmentWithDetails } from "./types"

/**
 * Fetches dashboard data with caching
 * @returns Dashboard statistics, obligations, and installments
 */
async function _getDashboardData(): Promise<{
  stats: DashboardStats
  obligations: ObligationWithDetails[]
  installments: InstallmentWithDetails[]
}> {
  try {
    const [obligationsData, clientsData, taxesData, installmentsData] = await Promise.all([
      getObligations(),
      getClients(),
      getTaxes(),
      getInstallments(),
    ])

    const obligations = getObligationsWithDetails(obligationsData, clientsData, taxesData)
    const stats = calculateDashboardStats(clientsData, obligations)

    // Process installments with details
    const installments: InstallmentWithDetails[] = installmentsData.map((inst) => {
      const client = clientsData.find((c) => c.id === inst.clientId)!
      const tax = inst.taxId ? taxesData.find((t) => t.id === inst.taxId) : undefined

      // Calculate due date for current installment
      const firstDue = new Date(inst.firstDueDate)
      const monthsToAdd = inst.currentInstallment - 1
      const dueDate = new Date(firstDue.getFullYear(), firstDue.getMonth() + monthsToAdd, inst.dueDay)
      const adjustedDueDate = new Date(dueDate) // Apply weekend rules if needed

      return {
        ...inst,
        client,
        tax,
        calculatedDueDate: adjustedDueDate.toISOString(),
      }
    })

    return {
      stats,
      obligations,
      installments,
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw new Error("Failed to fetch dashboard data")
  }
}

export const getDashboardData = createCachedFunction(
  _getDashboardData,
  CACHE_KEYS.DASHBOARD_DATA,
  [CACHE_TAGS.CLIENTS, CACHE_TAGS.OBLIGATIONS, CACHE_TAGS.TAXES, CACHE_TAGS.INSTALLMENTS, CACHE_TAGS.DASHBOARD],
  CACHE_DURATION.MEDIUM
)

/**
 * Fetches calendar data with caching
 * @returns Calendar obligations, taxes, and installments
 */
async function _getCalendarData(): Promise<{
  obligations: ObligationWithDetails[]
  taxes: any[]
  installments: InstallmentWithDetails[]
}> {
  try {
    const [obligationsData, clientsData, taxesData, installmentsData] = await Promise.all([
      getObligations(),
      getClients(),
      getTaxes(),
      getInstallments(),
    ])

    const obligations = getObligationsWithDetails(obligationsData, clientsData, taxesData)

    const installments: InstallmentWithDetails[] = installmentsData.map((inst) => {
      const client = clientsData.find((c) => c.id === inst.clientId)!
      const tax = inst.taxId ? taxesData.find((t) => t.id === inst.taxId) : undefined

      const firstDue = new Date(inst.firstDueDate)
      const monthsToAdd = inst.currentInstallment - 1
      const dueDate = new Date(firstDue.getFullYear(), firstDue.getMonth() + monthsToAdd, inst.dueDay)
      const adjustedDueDate = new Date(dueDate)

      return {
        ...inst,
        client,
        tax,
        calculatedDueDate: adjustedDueDate.toISOString(),
      }
    })

    return {
      obligations,
      taxes: taxesData,
      installments,
    }
  } catch (error) {
    console.error("Error fetching calendar data:", error)
    throw new Error("Failed to fetch calendar data")
  }
}

export const getCalendarData = createCachedFunction(
  _getCalendarData,
  CACHE_KEYS.CALENDAR_DATA,
  [CACHE_TAGS.CLIENTS, CACHE_TAGS.OBLIGATIONS, CACHE_TAGS.TAXES, CACHE_TAGS.INSTALLMENTS, CACHE_TAGS.CALENDAR],
  CACHE_DURATION.MEDIUM
)

/**
 * Fetches filtered obligations with server-side processing
 * @param filters - Filter and sort options
 * @returns Filtered obligations with pagination info
 */
export async function getFilteredObligations(filters: ObligationFilters = {}) {
  try {
    const [obligations, totalCount] = await Promise.all([
      getObligationsWithDetailsFiltered(filters),
      getObligationsCount(filters)
    ])

    return {
      obligations,
      totalCount,
      hasMore: filters.offset ? (filters.offset + (filters.limit || 50)) < totalCount : false
    }
  } catch (error) {
    console.error("Error fetching filtered obligations:", error)
    throw new Error("Failed to fetch filtered obligations")
  }
}
