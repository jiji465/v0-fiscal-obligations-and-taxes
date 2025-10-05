"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { DashboardStatsCards } from "@/components/dashboard-stats"
import { ProductivityStats } from "@/components/productivity-stats"
import { UpcomingObligations } from "@/components/upcoming-obligations"
import { ClientOverview } from "@/components/client-overview"
import { TaxCalendar } from "@/components/tax-calendar"
import { QuickActions } from "@/components/quick-actions"
import { getClients, getTaxes } from "@/lib/storage"
import { getObligationsWithDetails, calculateDashboardStats } from "@/lib/dashboard-utils"

export default function DashboardPage() {
  const [stats, setStats] = useState(calculateDashboardStats())
  const [obligations, setObligations] = useState(getObligationsWithDetails())
  const [clients, setClients] = useState(getClients())
  const [taxes, setTaxes] = useState(getTaxes())

  const updateData = () => {
    setStats(calculateDashboardStats())
    setObligations(getObligationsWithDetails())
    setClients(getClients())
    setTaxes(getTaxes())
  }

  useEffect(() => {
    updateData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Dashboard Fiscal</h1>
            <p className="text-lg text-muted-foreground">Controle completo de obrigações acessórias e impostos</p>
          </div>

          <div className="animate-in">
            <DashboardStatsCards stats={stats} />
          </div>

          <QuickActions obligations={obligations} onUpdate={updateData} />

          <TaxCalendar taxes={taxes} />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Indicadores de Produtividade</h2>
            <ProductivityStats obligations={obligations} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <UpcomingObligations obligations={obligations} />
            <ClientOverview clients={clients} obligations={obligations} />
          </div>
        </div>
      </main>
    </div>
  )
}
