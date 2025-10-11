"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails } from "@/lib/dashboard-utils"
import type { ObligationWithDetails } from "@/lib/types"

export default function CalendarioPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadObligations = async () => {
      try {
        const data = await getObligationsWithDetails()
        setObligations(data)
      } catch (error) {
        console.error('Erro ao carregar obrigações:', error)
        setObligations([])
      } finally {
        setLoading(false)
      }
    }
    
    loadObligations()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando calendário...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário</h1>
            <p className="text-muted-foreground mt-2">Visualize os vencimentos das obrigações no calendário</p>
          </div>

          <CalendarView obligations={obligations} clients={[]} />
        </div>
      </main>
    </div>
  )
}
