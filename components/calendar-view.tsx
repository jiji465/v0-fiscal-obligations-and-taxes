"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarIcon, Filter, FileText, Receipt, CreditCard } from "lucide-react"
import type { ObligationWithDetails, InstallmentWithDetails, Tax, Client } from "@/lib/types" // Adicionado Client
import { formatDate, adjustForWeekend } from "@/lib/date-utils" // Adicionado adjustForWeekend

type CalendarItem = {
  id: string
  name: string
  type: "obligation" | "tax" | "installment"
  clientName: string // Mantido como string, mas com fallback
  dueDate: string
  status: string
  description?: string
  realizationDate?: string
  taxName?: string
  installmentInfo?: string
}

type CalendarViewProps = {
  obligations: ObligationWithDetails[]
  taxes: Tax[]
  installments: InstallmentWithDetails[]
}

export function CalendarView({ obligations, taxes, installments }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // --- Correção na criação de allCalendarItems ---
  const allCalendarItems: CalendarItem[] = [
    // Obrigações
    ...obligations.map((o) => ({
      id: o.id,
      name: o.name,
      type: "obligation" as const,
      clientName: o.client?.name ?? 'Cliente Inválido', // Acesso seguro com fallback
      dueDate: o.calculatedDueDate,
      status: o.status,
      description: o.description,
      realizationDate: o.realizationDate,
      taxName: o.tax?.name, // Acesso seguro
    })),
    // Impostos (Considerando vencimento no mês atual)
    ...taxes
        .filter(t => t.dueDay) // Apenas impostos com dia de vencimento
        .map((t) => {
            let dueDate = new Date(year, month, t.dueDay);
             // Ajusta fim de semana se necessário (use a regra padrão ou específica do imposto se tiver)
            dueDate = adjustForWeekend(dueDate, t.weekendRule ?? 'postpone');
            return {
                id: t.id,
                name: t.name,
                type: "tax" as const,
                clientName: "N/A", // Impostos geralmente não são por cliente aqui
                dueDate: dueDate.toISOString(),
                status: t.status,
                description: t.description,
                realizationDate: t.realizationDate,
            };
    }),
    // Parcelamentos
    ...installments.map((i) => {
      // Recalcula a data de vencimento ajustada para o mês atual, se aplicável
      const firstDue = new Date(i.firstDueDate);
      // Calcula quantos meses se passaram desde o primeiro vencimento até o início do mês atual
      const monthsDiff = (year - firstDue.getFullYear()) * 12 + (month - firstDue.getMonth());

      // Verifica se este parcelamento tem uma parcela neste mês
      let targetInstallmentNumber = -1;
      if (i.recurrence === 'monthly' && monthsDiff >= 0) {
          targetInstallmentNumber = monthsDiff + 1; // +1 porque a primeira parcela é no mês 0 diff
      }
      // Adicionar lógica para outras recorrências (bimestral, etc.) se necessário

      // Se não há parcela neste mês ou já passou do total, não inclui
      if (targetInstallmentNumber < 1 || targetInstallmentNumber > i.installmentCount) {
           return null; // Marca para filtrar depois
      }

      // Calcula a data de vencimento para a parcela deste mês
      const dueDate = new Date(year, month, i.dueDay);
      const adjustedDueDate = adjustForWeekend(dueDate, i.weekendRule);

      // Determina o status real da parcela (pode estar atrasada mesmo se o registro diz pendente)
      let realStatus = i.status;
      if (i.status !== 'completed' && adjustedDueDate < new Date() && targetInstallmentNumber <= i.currentInstallment) {
          realStatus = 'overdue';
      }

      return {
        id: i.id + `_inst_${targetInstallmentNumber}`, // ID único para a ocorrência do calendário
        name: i.name,
        type: "installment" as const,
        clientName: i.client?.name ?? 'Cliente Inválido', // Acesso seguro
        dueDate: adjustedDueDate.toISOString(),
        status: realStatus, // Usa o status real calculado
        description: i.description,
        realizationDate: targetInstallmentNumber === i.currentInstallment ? i.realizationDate : undefined, // Só mostra se for a parcela atual
        taxName: i.tax?.name, // Acesso seguro
        installmentInfo: `${targetInstallmentNumber}/${i.installmentCount}`, // Mostra a parcela do mês
      }
    }),
  ].filter(item => item !== null) as CalendarItem[]; // Filtra os nulos


  const uniqueClients = Array.from(new Set(allCalendarItems
        .map((item) => item.clientName)
        .filter(name => name !== 'N/A' && name !== 'Cliente Inválido') // Filtra nomes genéricos
    )).sort();


  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getItemsForDay = (day: number) => {
    // Cria data inicial e final para o dia, ignorando hora/fuso
    const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

    return allCalendarItems.filter((item) => {
      if (!item || !item.dueDate) return false; // Segurança extra

      let itemDate: Date;
      try {
           itemDate = new Date(item.dueDate);
           if (isNaN(itemDate.getTime())) return false; // Data inválida
           // Converte para UTC para comparação segura
           itemDate = new Date(Date.UTC(itemDate.getUTCFullYear(), itemDate.getUTCMonth(), itemDate.getUTCDate()));
      } catch(e) {
          return false; // Ignora se a data for inválida
      }

      const matchesDate = itemDate >= startOfDay && itemDate <= endOfDay;
      const matchesClient = filterClient === "all" || item.clientName === filterClient || (filterClient === 'N/A' && item.clientName === 'N/A');
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesType = filterType === "all" || item.type === filterType;

      return matchesDate && matchesClient && matchesStatus && matchesType;
    });
  }


  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const calendarDays = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
      case "in_progress":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
      case "overdue":
        return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
      default: // pending
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "obligation":
        return <FileText className="size-3" />
      case "tax":
        return <Receipt className="size-3" />
      case "installment":
        return <CreditCard className="size-3" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "obligation":
        return "Obrigação"
      case "tax":
        return "Imposto"
      case "installment":
        return "Parcelamento"
      default:
        return type
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendário de Vencimentos</CardTitle>
              <CardDescription>Visualize obrigações, impostos e parcelamentos por data</CardDescription>
            </div>
            <CalendarIcon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controles do Calendário */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              {/* Navegação Mês/Ano */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <h3 className="text-lg font-semibold min-w-[180px] text-center">
                  {monthNames[month]} {year}
                </h3>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Hoje
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="obligation">Obrigações</SelectItem>
                    <SelectItem value="tax">Impostos</SelectItem>
                    <SelectItem value="installment">Parcelamentos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                     <SelectItem value="N/A">N/A (Impostos)</SelectItem> {/* Opção para Impostos */}
                    {uniqueClients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="overdue">Atrasada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid do Calendário */}
            <div className="grid grid-cols-7 gap-2">
              {/* Cabeçalho dias da semana */}
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Dias do mês */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayItems = getItemsForDay(day)
                const isToday =
                  day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                const dateForWeekendCheck = new Date(year, month, day);
                const isWeekendDay = dateForWeekendCheck.getDay() === 0 || dateForWeekendCheck.getDay() === 6;


                return (
                  <button
                    key={day}
                    onClick={() => { if (dayItems.length > 0) setSelectedDay(day); }} // Só abre modal se tiver itens
                    className={`relative aspect-square border rounded-lg p-1 flex flex-col hover:bg-accent transition-colors ${
                      isToday ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                    } ${isWeekendDay ? "bg-muted/30" : ""} ${dayItems.length > 0 ? "cursor-pointer" : "cursor-default"}`} // Muda cursor
                  >
                    <div className={`text-sm font-medium ${isToday ? "text-primary font-bold" : ""}`}>{day}</div>
                    {/* Indicador de Itens */}
                    {dayItems.length > 0 && (
                        <div className="absolute top-0.5 right-0.5 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[9px] h-4 w-4 font-bold">
                            {dayItems.length > 9 ? '9+' : dayItems.length}
                        </div>
                    )}
                     {/* Preview de Itens (Opcional, pode poluir visualmente) */}
                     {/*
                     <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayItems.slice(0, 1).map((item) => ( // Mostra só o primeiro item
                        <div
                          key={item.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate border flex items-center gap-1 ${getStatusColor(item.status)}`}
                          title={`${getTypeLabel(item.type)}: ${item.name} - ${item.clientName}`}
                        >
                          {getTypeIcon(item.type)}
                          <span className="truncate">{item.name}</span>
                        </div>
                      ))}
                      {dayItems.length > 1 && (
                        <div className="text-[10px] text-muted-foreground font-medium">+{dayItems.length - 1} mais</div>
                      )}
                    </div>
                    */}
                  </button>
                )
              })}
            </div>

            {/* Legenda (sem alterações) */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Legenda</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-4 border-2 border-primary rounded ring-2 ring-primary/20" />
                  <span className="text-muted-foreground">Hoje</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-muted/30 rounded" />
                  <span className="text-muted-foreground">Final de semana</span>
                </div>
                 <div className="flex items-center gap-2">
                  <div className="size-4 bg-primary rounded-full" />
                  <span className="text-muted-foreground">Dia com vencimentos</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-4" />
                  <span className="text-muted-foreground">Obrigação</span>
                </div>
                <div className="flex items-center gap-2">
                  <Receipt className="size-4" />
                  <span className="text-muted-foreground">Imposto</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4" />
                  <span className="text-muted-foreground">Parcelamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-yellow-500/20 border border-yellow-500/30 rounded" />
                  <span className="text-muted-foreground">Pendente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-blue-500/20 border border-blue-500/30 rounded" />
                  <span className="text-muted-foreground">Em Andamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-green-500/20 border border-green-500/30 rounded" />
                  <span className="text-muted-foreground">Concluída</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-red-500/20 border border-red-500/30 rounded" />
                  <span className="text-muted-foreground">Atrasada</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Dia */}
      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Vencimentos de {selectedDay} de {monthNames[month]} de {year}
            </DialogTitle>
            <DialogDescription>{selectedDayItems.length} item(ns) nesta data</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum vencimento nesta data com os filtros aplicados</p> // Mensagem ajustada
            ) : (
              selectedDayItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <span className="mt-1">{getTypeIcon(item.type)}</span> {/* Icone alinhado */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap"> {/* Wrap para badges */}
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(item.type)}
                          </Badge>
                          {item.installmentInfo && <Badge variant="secondary" className="text-xs">Parc. {item.installmentInfo}</Badge>}
                        </div>
                        {item.clientName !== 'N/A' && <p className="text-sm text-muted-foreground">{item.clientName}</p>}
                      </div>
                    </div>
                    <Badge
                      className={`text-xs ${
                        item.status === "completed"
                          ? "bg-green-600"
                          : item.status === "in_progress"
                            ? "bg-blue-600"
                            : item.status === "overdue"
                              ? "bg-red-600"
                              : "bg-yellow-600 text-yellow-900" // Cor de texto para amarelo
                      }`}
                    >
                      {item.status === "completed"
                        ? "Concluída"
                        : item.status === "in_progress"
                          ? "Em Andamento"
                          : item.status === "overdue"
                            ? "Atrasada"
                            : "Pendente"}
                    </Badge>
                  </div>
                  {item.taxName && <p className="text-sm">Imposto: {item.taxName}</p>}
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Vencimento: {formatDate(item.dueDate)}</span>
                    {item.realizationDate && <span>Realizada: {formatDate(item.realizationDate)}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
