import type { DashboardStats, ObligationWithDetails, Client, Obligation } from "./types"
import { calculateDueDate, isOverdue, isUpcomingThisWeek } from "./date-utils"

export const calculateDashboardStats = (obligations: ObligationWithDetails[], clients: Client[]): DashboardStats => {
  const activeClients = clients.filter((c) => c.status === "active").length
  const pendingObligations = obligations.filter((o) => o.status === "pending")
  const overdueObligations = pendingObligations.filter((o) => isOverdue(o.calculatedDueDate))
  const upcomingThisWeek = pendingObligations.filter((o) => isUpcomingThisWeek(o.calculatedDueDate))

  const today = new Date()
  const completedThisMonth = obligations.filter((o) => {
    if (!o.completedAt) return false
    const completed = new Date(o.completedAt)
    return (
      completed.getMonth() === today.getMonth() &&
      completed.getFullYear() === today.getFullYear() &&
      o.status === "completed"
    )
  }).length

  return {
    totalClients: clients.length,
    activeClients,
    totalObligations: obligations.length,
    pendingObligations: pendingObligations.length,
    completedThisMonth,
    overdueObligations: overdueObligations.length,
    upcomingThisWeek: upcomingThisWeek.length,
  }
}
