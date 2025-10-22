import { getObligations, getClients, getTaxes } from "./supabase/database"
import { getObligationsWithDetails } from "./dashboard-utils"
import { isOverdue } from "./date-utils"

export async function getAlertCounts() {
  try {
    const [obligationsData, clientsData, taxesData] = await Promise.all([
      getObligations(),
      getClients(),
      getTaxes()
    ])

    const obligations = getObligationsWithDetails(obligationsData, clientsData, taxesData)
    const overdue = obligations.filter((o) => isOverdue(o.calculatedDueDate) && o.status !== "completed").length
    const pending = obligations.filter((o) => o.status === "pending").length

    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thisWeek = obligations.filter((o) => {
      const dueDate = new Date(o.calculatedDueDate)
      return dueDate >= today && dueDate <= nextWeek && o.status !== "completed"
    }).length

    return { overdue, pending, thisWeek }
  } catch (error) {
    console.error("Error calculating alert counts:", error)
    return { overdue: 0, pending: 0, thisWeek: 0 }
  }
}
