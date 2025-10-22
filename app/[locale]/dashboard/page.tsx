import { NavigationI18n } from "@/components/navigation-i18n"
import { DashboardStats } from "@/components/dashboard-stats"
import { ObligationList } from "@/components/obligation-list"
import { UpcomingObligations } from "@/components/upcoming-obligations"
import { getDashboardData } from "@/lib/server-actions"
import { getAlertCounts } from "@/lib/server-utils"
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const [{ stats, obligations, installments }, alertCounts] = await Promise.all([
    getDashboardData(),
    getAlertCounts()
  ])

  return (
    <div className="min-h-screen bg-background">
      <NavigationI18n />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('subtitle')}
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
