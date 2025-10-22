import { NavigationServer } from "@/components/navigation-server"
import { CalendarView } from "@/components/calendar-view"
import { getCalendarData } from "@/lib/server-actions"
import { getAlertCounts } from "@/lib/server-utils"

export default async function CalendarioServerPage() {
  const [{ obligations, taxes, installments }, alertCounts] = await Promise.all([
    getCalendarData(),
    getAlertCounts()
  ])

  return (
    <div className="min-h-screen bg-background">
      <NavigationServer alertCounts={alertCounts} />
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
