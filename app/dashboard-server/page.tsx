import { NavigationServer } from "@/components/navigation-server"
import { DashboardStats } from "@/components/dashboard-stats"
import { ObligationList } from "@/components/obligation-list"
import { UpcomingObligations } from "@/components/upcoming-obligations"
import { getDashboardData } from "@/lib/server-actions"
import { getAlertCounts } from "@/lib/server-utils"

export default async function DashboardServerPage() {
  const [{ stats, obligations, installments }, alertCounts] = await Promise.all([
    getDashboardData(),
    getAlertCounts()
  ])

  return (
    <div className="min-h-screen bg-background">
      <NavigationServer alertCounts={alertCounts} />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Visão geral das obrigações fiscais e métricas de produtividade
            </p>
          </div>

          <DashboardStats stats={stats} />

          <div className="grid gap-8 lg:grid-cols-2">
            <ObligationList obligations={obligations} />
            <UpcomingObligations obligations={obligations} installments={installments} />
          </div>
        </div>
      </main>
    </div>
  )
}
