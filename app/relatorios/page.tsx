"use client"

import { useEffect, useState } from "react"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails } from "@/lib/types"
import { getObligations, getClients, getTaxes } from "@/lib/storage"
import { calculateDueDate } from "@/lib/date-utils"

export default function RelatoriosPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const obligationsData = getObligations()
    const clientsData = getClients()
    const taxesData = getTaxes()

    const obligationsWithDetails: ObligationWithDetails[] = obligationsData.map((obl) => {
      const client = clientsData.find((c) => c.id === obl.clientId)!
      const tax = obl.taxId ? taxesData.find((t) => t.id === obl.taxId) : undefined
      const calculatedDueDate = calculateDueDate(obl)

      return {
        ...obl,
        client,
        tax,
        calculatedDueDate,
      }
    })

    setObligations(obligationsWithDetails)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground mt-2">Análise detalhada de obrigações fiscais e produtividade</p>
      </div>

      <ReportsPanel obligations={obligations} />
    </div>
  )
}
