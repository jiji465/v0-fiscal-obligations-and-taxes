import type { DashboardStats, ObligationWithDetails, Client, Tax, Obligation } from "./types" // CORREÇÃO: Tipos importados
// REMOVIDO: import { getClients, getTaxes, getObligations } from "./storage" // NÃO USAR STORAGE
import { calculateDueDate, isOverdue, isUpcomingThisWeek } from "./date-utils"

// CORREÇÃO: A função agora recebe os dados como parâmetros
export const getObligationsWithDetails = (
  obligations: Obligation[],
  clients: Client[],
  taxes: Tax[],
): ObligationWithDetails[] => {
  return obligations.map((obligation) => {
    const client = clients.find((c) => c.id === obligation.clientId)!
    const tax = obligation.taxId ? taxes.find((t) => t.id === obligation.taxId) : undefined

    // CORREÇÃO: Cálculo da data movido para cá para consistência
    const dueDate = new Date() // Precisa de uma data de referência
    let calculatedDate: Date;
     if (obligation.frequency === "annual" && obligation.dueMonth) {
        calculatedDate = new Date(dueDate.getFullYear(), obligation.dueMonth - 1, obligation.dueDay);
        if (calculatedDate < dueDate && !obligation.generatedFor) { // Ajusta ano apenas se não for uma gerada
            calculatedDate.setFullYear(calculatedDate.getFullYear() + 1);
        }
     } else {
        calculatedDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), obligation.dueDay);
         if (calculatedDate < dueDate && !obligation.generatedFor) { // Ajusta mês apenas se não for uma gerada
            calculatedDate.setMonth(calculatedDate.getMonth() + 1);
         }
     }
     // Se for uma obrigação gerada, usar o ano/mês dela
     if (obligation.generatedFor) {
         const [year, month] = obligation.generatedFor.split('-').map(Number);
         calculatedDate = new Date(year, month -1, obligation.dueDay);
     }


    const finalDueDate = adjustForWeekend(calculatedDate, obligation.weekendRule);


    return {
      ...obligation,
      client,
      tax,
      calculatedDueDate: finalDueDate.toISOString(), // Usar data calculada aqui
    }
  })
}

// CORREÇÃO: A função agora recebe os dados como parâmetros
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

// CORREÇÃO: Função adjustForWeekend precisa estar aqui ou importada corretamente
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6 // 0 = Domingo, 6 = Sábado
}

export const adjustForWeekend = (date: Date, rule: "postpone" | "anticipate" | "keep"): Date => {
  if (!isWeekend(date) || rule === 'keep') return date

  const adjusted = new Date(date)

  if (rule === "anticipate") {
    // Move para dia útil anterior
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1)
    }
  } else if (rule === "postpone") {
    // Move para próximo dia útil
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() + 1)
    }
  }
  return adjusted
}
