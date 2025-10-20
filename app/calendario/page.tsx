"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails } from "@/lib/dashboard-utils"
import { getTaxes, getInstallments, getClients } from "@/lib/storage"
import type { Tax, InstallmentWithDetails } from "@/lib/types"
import { adjustForWeekend } from "@/lib/date-utils"

export default function CalendarioPage() {
  const [obligations, setObligations] = useState(getObligationsWithDetails())
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])

  useEffect(() => {
    setObligations(getObligationsWithDetails())
    setTaxes(getTaxes())

    const clients = getClients()
    const rawInstallments = getInstallments()
    const installmentsWithDetails: InstallmentWithDetails[] = rawInstallments.map((inst) => {
      const client = clients.find((c) => c.id === inst.clientId)!
      const tax = inst.taxId ? getTaxes().find((t) => t.id === inst.taxId) : undefined

      // Calculate due date for current installment
      const firstDue = new Date(inst.firstDueDate)
      const monthsToAdd = inst.currentInstallment - 1
      const dueDate = new Date(firstDue.getFullYear(), firstDue.getMonth() + monthsToAdd, inst.dueDay)
      const adjustedDueDate = adjustForWeekend(dueDate, inst.weekendRule)

      return {
        ...inst,
        client,
        tax,
        calculatedDueDate: adjustedDueDate.toISOString(),
      }
    })
    setInstallments(installmentsWithDetails)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground mt-2">
              Visualize os vencimentos de obrigações, impostos e parcelamentos
            </p>
          </div>

          <CalendarView obligations={obligations} taxes={taxes} installments={installments} />
        </div>
      </main>
    </div>
  )
}
