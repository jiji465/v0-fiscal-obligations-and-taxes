"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp } from "lucide-react"
import type { Obligation, ObligationWithDetails } from "@/lib/types" // Adicionado Obligation
import { formatDate, formatCurrency, isOverdue } from "@/lib/date-utils" // Adicionado isOverdue
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { useState } from "react"

type ReportsPanelProps = {
  obligations: ObligationWithDetails[]
}

export function ReportsPanel({ obligations }: ReportsPanelProps) {
  const [periodFilter, setPeriodFilter] = useState<string>("all")

  const filteredObligations = obligations.filter((obl) => {
    // Pula obrigações sem data calculada (embora não devesse acontecer com ObligationWithDetails)
    if (!obl?.calculatedDueDate) return false;

    const oblDate = new Date(obl.calculatedDueDate)
    if (isNaN(oblDate.getTime())) return false; // Pula datas inválidas

    const now = new Date()

    switch (periodFilter) {
      case "this_month":
        return oblDate.getMonth() === now.getMonth() && oblDate.getFullYear() === now.getFullYear()
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return oblDate.getMonth() === lastMonth.getMonth() && oblDate.getFullYear() === lastMonth.getFullYear()
      case "this_quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        const oblQuarter = Math.floor(oblDate.getMonth() / 3)
        return oblQuarter === quarter && oblDate.getFullYear() === now.getFullYear()
      case "this_year":
        return oblDate.getFullYear() === now.getFullYear()
      default: // all
        return true
    }
  })

  // Recalcula status considerando overdue real
  const getRealStatus = (obl: ObligationWithDetails) => {
    if (obl.status === 'completed') return 'completed';
    if (isOverdue(obl.calculatedDueDate)) return 'overdue';
    return obl.status; // pending or in_progress
  }

  const completed = filteredObligations.filter((o) => getRealStatus(o) === "completed");
  const inProgress = filteredObligations.filter((o) => getRealStatus(o) === "in_progress");
  const pending = filteredObligations.filter((o) => getRealStatus(o) === "pending");
  const overdue = filteredObligations.filter((o) => getRealStatus(o) === "overdue");


  const totalFiltered = filteredObligations.length; // Usar o total filtrado para porcentagens
  const completionRate = totalFiltered > 0 ? Math.round((completed.length / totalFiltered) * 100) : 0;
  const inProgressRate = totalFiltered > 0 ? Math.round((inProgress.length / totalFiltered) * 100) : 0; // Taxa de Em Andamento

  const completedOnTime = completed.filter((obl) => {
    // Garante que as datas são válidas
    if (!obl.realizationDate || !obl.calculatedDueDate) return false;
    try {
        const realization = new Date(obl.realizationDate);
        const due = new Date(obl.calculatedDueDate);
        if (isNaN(realization.getTime()) || isNaN(due.getTime())) return false;
        // Compara ignorando a hora para ser mais preciso
        realization.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        return realization <= due;
    } catch {
        return false;
    }
  });

  const onTimeRate = completed.length > 0 ? Math.round((completedOnTime.length / completed.length) * 100) : 0;

  // Obrigações por cliente
  const byClient = filteredObligations.reduce(
    (acc, obl) => {
      // --- Acesso seguro ao nome do cliente ---
      const clientName = obl.client?.name ?? 'Cliente Inválido';
      if (!acc[clientName]) {
        acc[clientName] = { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 }; // Adicionado overdue
      }
      acc[clientName].total++;
      const realStatus = getRealStatus(obl); // Usa status real
      if (realStatus === "completed") acc[clientName].completed++;
      if (realStatus === "pending") acc[clientName].pending++;
      if (realStatus === "in_progress") acc[clientName].inProgress++;
      if (realStatus === "overdue") acc[clientName].overdue++; // Contabiliza overdue
      return acc;
    },
    {} as Record<string, { total: number; completed: number; pending: number; inProgress: number; overdue: number }>,
  );


  // Obrigações por tipo de recorrência
  const byRecurrence = filteredObligations.reduce(
    (acc, obl) => {
      // Passa a obrigação base para getRecurrenceDescription se ela esperar Obligation
      const recurrence = getRecurrenceDescription(obl as Obligation); // Tenta type assertion se necessário
      acc[recurrence] = (acc[recurrence] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );


  // Obrigações por imposto
  const byTax = filteredObligations.reduce(
    (acc, obl) => {
      // --- Acesso seguro ao nome do imposto ---
      const taxName = obl.tax?.name ?? "Sem imposto associado";
      if (!acc[taxName]) {
        acc[taxName] = { total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 }; // Adicionado status
      }
      acc[taxName].total++;
      const realStatus = getRealStatus(obl); // Usa status real
      if (realStatus === "completed") acc[taxName].completed++;
      if (realStatus === "pending") acc[taxName].pending++;
      if (realStatus === "in_progress") acc[taxName].inProgress++;
      if (realStatus === "overdue") acc[taxName].overdue++;
      return acc;
    },
    {} as Record<string, { total: number; completed: number; pending: number; inProgress: number; overdue: number }>,
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Desempenho</h2>
          <p className="text-muted-foreground">Métricas e indicadores de produtividade</p>
        </div>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="this_month">Este mês</SelectItem>
            <SelectItem value="last_month">Mês passado</SelectItem>
            <SelectItem value="this_quarter">Este trimestre</SelectItem>
            <SelectItem value="this_year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo Geral */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Card Concluídas */}
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

        {/* Card No Prazo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-4 text-blue-600" /> {/* Ícone ajustado */}
              No Prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOnTime.length}</div>
            <Progress value={onTimeRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{onTimeRate}% das concluídas</p>
          </CardContent>
        </Card>

        {/* Card Em Andamento */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="size-4 text-blue-600" /> {/* Ícone ajustado */}
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground mt-3">
              {inProgressRate}% do total {/* Usa a taxa calculada */}
            </p>
          </CardContent>
        </Card>

        {/* Card Pendentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="size-4 text-yellow-600" /> {/* Cor ajustada */}
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-3">Aguardando início</p>
          </CardContent>
        </Card>

        {/* Card Atrasadas */}
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
          <TabsTrigger value="tax">Por Imposto</TabsTrigger>
          <TabsTrigger value="recurrence">Por Recorrência</TabsTrigger>
          <TabsTrigger value="completed">Finalizadas</TabsTrigger>
        </TabsList>

        {/* Tab por Cliente */}
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
                    {/* Mostra todos os status */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-green-600">{stats.completed} concluídas</Badge>
                      <Badge className="bg-blue-600">{stats.inProgress} em andamento</Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{stats.pending} pendentes</Badge>
                      {stats.overdue > 0 && <Badge variant="destructive">{stats.overdue} atrasadas</Badge>}
                    </div>
                    <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-2" />
                  </div>
                ))}
                {Object.keys(byClient).length === 0 && (
                   <p className="text-center text-muted-foreground py-8">Nenhum dado de cliente para exibir com os filtros atuais.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab por Imposto */}
        <TabsContent value="tax" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações por Tipo de Imposto</CardTitle>
              <CardDescription>Distribuição por categoria fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(byTax)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([tax, stats]) => (
                    <div key={tax} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{tax}</span>
                        <span className="text-sm text-muted-foreground">{stats.total} obrigações</span>
                      </div>
                       {/* Mostra todos os status */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-green-600">{stats.completed} concluídas</Badge>
                        <Badge className="bg-blue-600">{stats.inProgress} em andamento</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{stats.pending} pendentes</Badge>
                         {stats.overdue > 0 && <Badge variant="destructive">{stats.overdue} atrasadas</Badge>}
                      </div>
                      <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                  {Object.keys(byTax).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Nenhum dado de imposto para exibir com os filtros atuais.</p>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab por Recorrência */}
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
                {Object.keys(byRecurrence).length === 0 && (
                   <p className="text-center text-muted-foreground py-8">Nenhum dado de recorrência para exibir com os filtros atuais.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Finalizadas */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obrigações Finalizadas</CardTitle>
              <CardDescription>Histórico de tarefas concluídas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completed.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma obrigação concluída no período selecionado</p>
                ) : (
                  completed.map((obl) => (
                    <div key={obl.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{obl.name}</div>
                        {/* Acesso seguro ao nome do cliente */}
                        <div className="text-sm text-muted-foreground">{obl.client?.name ?? 'Cliente Inválido'}</div>
                        {obl.realizationDate && (
                          <div className="text-xs text-muted-foreground">
                            {/* Usa a função formatDate segura */}
                            Realizada em: {formatDate(obl.realizationDate)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                         {/* Usa a função formatCurrency segura */}
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
