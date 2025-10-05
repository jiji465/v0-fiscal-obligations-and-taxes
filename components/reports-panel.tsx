"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, AlertTriangle, Calendar } from "lucide-react"
import type { ObligationWithDetails } from "@/lib/types"
import { formatDate, formatCurrency } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"

type ReportsPanelProps = {
  obligations: ObligationWithDetails[]
}

export function ReportsPanel({ obligations }: ReportsPanelProps) {
  // Estatísticas gerais
  const completed = obligations.filter((o) => o.status === "completed")
  const inProgress = obligations.filter((o) => o.status === "in_progress")
  const pending = obligations.filter((o) => o.status === "pending")
  const overdue = obligations.filter((o) => o.status === "overdue")

  const completionRate = obligations.length > 0 ? Math.round((completed.length / obligations.length) * 100) : 0

  // Obrigações por cliente
  const byClient = obligations.reduce(
    (acc, obl) => {
      const clientName = obl.client.name
      if (!acc[clientName]) {
        acc[clientName] = { total: 0, completed: 0, pending: 0, inProgress: 0 }
      }
      acc[clientName].total++
      if (obl.status === "completed") acc[clientName].completed++
      if (obl.status === "pending") acc[clientName].pending++
      if (obl.status === "in_progress") acc[clientName].inProgress++
      return acc
    },
    {} as Record<string, { total: number; completed: number; pending: number; inProgress: number }>,
  )

  // Obrigações por tipo de recorrência
  const byRecurrence = obligations.reduce(
    (acc, obl) => {
      const recurrence = getRecurrenceDescription(obl)
      acc[recurrence] = (acc[recurrence] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="size-4 text-green-600" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
            <Progress value={completionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{completionRate}% do total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground mt-3">
              {Math.round((inProgress.length / obligations.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="size-4 text-gray-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Aguardando início</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Requerem atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Detalhados */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Por Cliente</TabsTrigger>
          <TabsTrigger value="recurrence">Por Recorrência</TabsTrigger>
          <TabsTrigger value="completed">Finalizadas</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações por Cliente</CardTitle>
              <CardDescription>Distribuição de tarefas entre os clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byClient).map(([client, stats]) => (
                  <div key={client} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{client}</span>
                      <span className="text-sm text-muted-foreground">{stats.total} obrigações</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-600">{stats.completed} concluídas</Badge>
                      <Badge className="bg-blue-600">{stats.inProgress} em andamento</Badge>
                      <Badge variant="secondary">{stats.pending} pendentes</Badge>
                    </div>
                    <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recurrence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações por Tipo de Recorrência</CardTitle>
              <CardDescription>Distribuição por frequência de vencimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(byRecurrence).map(([recurrence, count]) => (
                  <div key={recurrence} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{recurrence}</span>
                    <Badge variant="outline">{count} obrigações</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações Finalizadas</CardTitle>
              <CardDescription>Histórico de tarefas concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma obrigação concluída ainda</p>
                ) : (
                  completed.map((obl) => (
                    <div key={obl.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{obl.name}</div>
                        <div className="text-sm text-muted-foreground">{obl.client.name}</div>
                        {obl.realizationDate && (
                          <div className="text-xs text-muted-foreground">
                            Realizada em: {formatDate(obl.realizationDate)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {obl.amount && <div className="font-medium">{formatCurrency(obl.amount)}</div>}
                        <Badge className="bg-green-600 mt-1">
                          <CheckCircle2 className="size-3 mr-1" />
                          Concluída
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
