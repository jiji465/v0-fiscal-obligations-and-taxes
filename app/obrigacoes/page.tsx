"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ObligationList } from "@/components/obligation-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getClients, getTaxes } from "@/lib/storage"
import { getObligationsWithDetails } from "@/lib/dashboard-utils"
import { isOverdue } from "@/lib/date-utils"
import { CheckCircle2, Clock, PlayCircle, AlertTriangle } from "lucide-react"

export default function ObligacoesPage() {
  const [obligations, setObligations] = useState(getObligationsWithDetails())
  const [clients, setClients] = useState(getClients())
  const [taxes, setTaxes] = useState(getTaxes())
  const [activeTab, setActiveTab] = useState("all")

  const updateData = () => {
    setObligations(getObligationsWithDetails())
    setClients(getClients())
    setTaxes(getTaxes())
  }

  useEffect(() => {
    updateData()
  }, [])

  const pendingObligations = obligations.filter((o) => o.status === "pending")
  const inProgressObligations = obligations.filter((o) => o.status === "in_progress")
  const completedObligations = obligations.filter((o) => o.status === "completed")
  const overdueObligations = obligations.filter((o) => isOverdue(o.calculatedDueDate) && o.status !== "completed")

  const getFilteredObligations = () => {
    switch (activeTab) {
      case "pending":
        return pendingObligations
      case "in_progress":
        return inProgressObligations
      case "completed":
        return completedObligations
      case "overdue":
        return overdueObligations
      default:
        return obligations
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Obrigações Acessórias</h1>
            <p className="text-lg text-muted-foreground">Gerencie todas as obrigações fiscais dos seus clientes</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="all" className="flex flex-col gap-1 py-3">
                <span className="text-sm font-medium">Todas</span>
                <Badge variant="secondary" className="text-xs">
                  {obligations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="text-sm font-medium">Pendentes</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pendingObligations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <PlayCircle className="size-3.5" />
                  <span className="text-sm font-medium">Em Andamento</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  {inProgressObligations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span className="text-sm font-medium">Concluídas</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                >
                  {completedObligations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex flex-col gap-1 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  <span className="text-sm font-medium">Atrasadas</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                >
                  {overdueObligations.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card className="p-6">
                <ObligationList
                  obligations={getFilteredObligations()}
                  clients={clients}
                  taxes={taxes}
                  onUpdate={updateData}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
