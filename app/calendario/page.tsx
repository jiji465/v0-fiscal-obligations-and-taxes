"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { CalendarView } from "@/components/calendar-view"
import { getObligationsWithDetails as calculateObligationsWithDetails } from "@/lib/dashboard-utils" // CORREÇÃO: Renomeado para clareza
import { getTaxes, getInstallments, getClients, getObligations } from "@/lib/supabase/database" // CORREÇÃO: Usar supabase
import type { Tax, InstallmentWithDetails, Client, Obligation, ObligationWithDetails, Installment } from "@/lib/types" // CORREÇÃO: Tipos completos
import { adjustForWeekend } from "@/lib/date-utils"

export default function CalendarioPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [loading, setLoading] = useState(true) // CORREÇÃO: Estado de loading

  // CORREÇÃO: Função async para buscar dados
  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsData, taxesData, installmentsData, obligationsData] = await Promise.all([
          getClients(),
          getTaxes(),
          getInstallments(),
          getObligations()
      ]);

      const obligationsWithDetails = calculateObligationsWithDetails(obligationsData, clientsData, taxesData);
      setObligations(obligationsWithDetails);
      setTaxes(taxesData);

      const installmentsWithDetails: InstallmentWithDetails[] = installmentsData.map((inst: Installment) => { // CORREÇÃO: Tipar inst
        const client = clientsData.find((c: Client) => c.id === inst.clientId)!; // CORREÇÃO: Tipar c e usar !
        const tax = inst.taxId ? taxesData.find((t: Tax) => t.id === inst.taxId) : undefined; // CORREÇÃO: Tipar t

        // Calculate due date for current installment
        const firstDue = new Date(inst.firstDueDate)
        const monthsToAdd = inst.currentInstallment - 1
        // Usa o ano/mês da firstDueDate + meses adicionados
        const dueDate = new Date(firstDue.getFullYear(), firstDue.getMonth() + monthsToAdd, inst.dueDay)
        const adjustedDueDate = adjustForWeekend(dueDate, inst.weekendRule)

        return {
          ...inst,
          client,
          tax,
          calculatedDueDate: adjustedDueDate.toISOString(),
        }
      })
      setInstallments(installmentsWithDetails);

    } catch (error) {
        console.error("[v0] Erro ao carregar dados do calendário:", error);
    } finally {
        setLoading(false);
    }
  }


  useEffect(() => {
    loadData(); // CORREÇÃO: Chama a função async
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

          {/* CORREÇÃO: Adicionar estado de loading */}
          {loading ? (
             <p>Carregando calendário...</p>
           ) : (
             <CalendarView obligations={obligations} taxes={taxes} installments={installments} />
           )}
        </div>
      </main>
    </div>
  )
}
