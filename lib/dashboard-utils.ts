import type { DashboardStats, ObligationWithDetails, Client, Tax, Obligation } from "./types"
import { calculateDueDate, isOverdue, isUpcomingThisWeek, adjustForWeekend } from "./date-utils"
import { getNextDueDate } from "./recurrence-engine"

/**
 * Enriches obligations with client and tax details
 * @param obligations - Array of obligations
 * @param clients - Array of clients
 * @param taxes - Array of taxes
 * @returns Array of obligations with enriched details
 */
export const getObligationsWithDetails = (
  obligations: Obligation[],
  clients: Client[],
  taxes: Tax[],
): ObligationWithDetails[] => {
  return obligations.map((obligation) => {
    const client = clients.find((c) => c.id === obligation.clientId)!
    const tax = obligation.taxId ? taxes.find((t) => t.id === obligation.taxId) : undefined

    // CORREÇÃO: Usar função padronizada do recurrence-engine
    const currentDate = new Date()
    let calculatedDate: Date

    if (obligation.generatedFor) {
      // Se for uma obrigação gerada, usar o ano/mês dela
      const [year, month] = obligation.generatedFor.split('-').map(Number)
      calculatedDate = new Date(year, month - 1, obligation.dueDay)
    } else {
      // Para obrigações originais, calcular a próxima data de vencimento
      if (obligation.frequency === "annual" && obligation.dueMonth) {
        calculatedDate = new Date(currentDate.getFullYear(), obligation.dueMonth - 1, obligation.dueDay)
        if (calculatedDate < currentDate) {
          calculatedDate.setFullYear(calculatedDate.getFullYear() + 1)
        }
      } else {
        calculatedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), obligation.dueDay)
        if (calculatedDate < currentDate) {
          calculatedDate.setMonth(calculatedDate.getMonth() + 1)
        }
      }
    }

    const finalDueDate = adjustForWeekend(calculatedDate, obligation.weekendRule)


    return {
      ...obligation,
      client,
      tax,
      calculatedDueDate: finalDueDate.toISOString(), // Usar data calculada aqui
    }
  })
}

/**
 * Calculates dashboard statistics from clients and obligations
 * @param clients - Array of clients
 * @param obligations - Array of obligations with details
 * @returns Dashboard statistics object
 */
export const calculateDashboardStats = (
  clients: Client[],
  obligations: ObligationWithDetails[],
): DashboardStats => {
  const activeClients = clients.filter((c) => c.status === "active").length
  // CORREÇÃO: Usar a lista de obrigações detalhadas recebida
  const pendingObligationsList = obligations.filter((o) => o.status === "pending")
  const overdueObligationsList = pendingObligationsList.filter((o) => isOverdue(o.calculatedDueDate))
  const upcomingThisWeekList = pendingObligationsList.filter((o) => isUpcomingThisWeek(o.calculatedDueDate))

  const today = new Date()
  const completedThisMonthCount = obligations.filter((o) => {
    if (!o.completedAt) return false
    const completed = new Date(o.completedAt)
    return (
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear() &&
      o.status === "completed" // Garantir que está realmente completa
    )
  }).length

  return {
    totalClients: clients.length,
    activeClients,
    totalObligations: obligations.length,
    pendingObligations: pendingObligationsList.length,
    completedThisMonth: completedThisMonthCount,
    overdueObligations: overdueObligationsList.length,
    upcomingThisWeek: upcomingThisWeekList.length,
  }
}

// Date calculation functions are now consolidated in lib/date-utils.ts
