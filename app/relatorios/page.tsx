"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ReportsPanel } from "@/components/reports-panel"
import type { ObligationWithDetails, Client, Tax, Obligation } from "@/lib/types" // CORREÇÃO: Tipos completos
import { getObligations, getClients, getTaxes } from "@/lib/supabase/database" // CORREÇÃO: Usar supabase
// calculateDueDate agora está em dashboard-utils ou date-utils, ajustar import se necessário
import { getObligationsWithDetails as calculateObligationsWithDetails } from "@/lib/dashboard-utils" // CORREÇÃO: Reutilizar função

export default function RelatoriosPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [loading, setLoading] = useState(true); // CORREÇÃO: Loading state

  // CORREÇÃO: Função async
  const loadData = async () => {
    setLoading(true);
    try {
        const [obligationsData, clientsData, taxesData] = await Promise.all([
            getObligations(),
            getClients(),
            getTaxes()
        ]);

        const obligationsWithDetails: ObligationWithDetails[] = calculateObligationsWithDetails(
            obligationsData,
            clientsData,
            taxesData
        );

        setObligations(obligationsWithDetails);
    } catch (error) {
        console.error("[v0] Erro ao carregar dados para relatórios:", error);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => {
    loadData(); // CORREÇÃO: Chamar função async
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Relatórios</h1>
            <p className="text-lg text-muted-foreground">Análise detalhada de obrigações fiscais e produtividade</p>
          </div>

          {/* CORREÇÃO: Adicionar loading */}
          {loading ? <p>Carregando relatórios...</p> : <ReportsPanel obligations={obligations} />}
        </div>
      </main>
    </div>
  )
}
