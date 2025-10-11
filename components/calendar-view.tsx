"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, CalendarIcon, Filter } from "lucide-react"
import type { ObligationWithDetails, Tax, Installment, Client } from "@/lib/types"
import { formatDate, calculateDueDate } from "@/lib/date-utils"

export type CalendarItem = {
  id: string
  name: string
  type: 'obligation' | 'tax' | 'installment'
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  client: Client
  description?: string
  amount?: number
  installmentInfo?: {
    installmentNumber: number
    totalInstallments: number
  }
}

type CalendarViewProps = {
  obligations: ObligationWithDetails[]
  taxes?: Tax[]
  installments?: Installment[]
  clients: Client[]
}

export function CalendarView({ obligations, taxes = [], installments = [], clients }: CalendarViewProps) {
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

  // Converter todos os tipos para CalendarItem
  const calendarItems: CalendarItem[] = [
    // Obrigações
    ...obligations.map(obl => ({
      id: obl.id,
      name: obl.name,
      type: 'obligation' as const,
      dueDate: obl.calculatedDueDate,
      status: obl.status,
      priority: obl.priority,
      client: obl.client,
      description: obl.description,
      amount: obl.amount
    })),
    // Impostos
    ...taxes.map(tax => {
      const client = clients.find(c => c.id === tax.clientId)
      if (!client) return null
      
      const dueDate = calculateDueDate(tax.dueDay, tax.dueMonth, undefined, tax.weekendRule)
      
      return {
        id: tax.id,
        name: tax.name,
        type: 'tax' as const,
        dueDate: dueDate.toISOString().split('T')[0],
        status: tax.status,
        priority: tax.priority,
        client,
        description: tax.description,
        amount: tax.amount
      }
    }).filter(Boolean) as CalendarItem[],
    // Parcelamentos
    ...installments.map(inst => {
      const client = clients.find(c => c.id === inst.clientId)
      if (!client) return null
      
      return {
        id: inst.id,
        name: inst.description,
        type: 'installment' as const,
        dueDate: inst.dueDate,
        status: inst.status,
        priority: 'medium' as const,
        client,
        description: inst.description,
        amount: inst.amount,
        installmentInfo: {
          installmentNumber: inst.installmentNumber,
          totalInstallments: inst.totalInstallments
        }
      }
    }).filter(Boolean) as CalendarItem[]
  ]

  const uniqueClients = Array.from(new Set(calendarItems.map((item) => item.client.name))).sort()

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
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    return calendarItems.filter((item) => {
      const itemDate = new Date(item.dueDate).toISOString().split("T")[0]
      const matchesDate = itemDate === dateStr
      const matchesClient = filterClient === "all" || item.client.name === filterClient
      const matchesStatus = filterStatus === "all" || item.status === filterStatus
      const matchesType = filterType === "all" || item.type === filterType
      return matchesDate && matchesClient && matchesStatus && matchesType
    })
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tax":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30"
      case "obligation":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
      case "installment":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tax":
        return "💰"
      case "obligation":
        return "📄"
      case "installment":
        return "📊"
      default:
        return "📋"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendário de Vencimentos</CardTitle>
              <CardDescription>Visualize impostos, obrigações e parcelamentos por data</CardDescription>
            </div>
            <CalendarIcon className="size-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filterClient} onValueChange={setFilterClient}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
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

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="tax">💰 Impostos</SelectItem>
                    <SelectItem value="obligation">📄 Obrigações</SelectItem>
                    <SelectItem value="installment">📊 Parcelamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const dayItems = getItemsForDay(day)
                const isToday =
                  day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
                const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square border rounded-lg p-1 flex flex-col hover:bg-accent transition-colors ${
                      isToday ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""
                    } ${isWeekend ? "bg-muted/30" : ""} ${dayItems.length > 0 ? "cursor-pointer" : ""}`}
                  >
                    <div className={`text-sm font-medium ${isToday ? "text-primary font-bold" : ""}`}>{day}</div>
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {dayItems.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate border ${getTypeColor(item.type)}`}
                          title={`${getTypeIcon(item.type)} ${item.name} - ${item.client.name}`}
                        >
                          {getTypeIcon(item.type)} {item.name}
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="text-[10px] text-muted-foreground font-medium">
                          +{dayItems.length - 3} mais
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

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
                  <div className="size-4 bg-orange-500/20 border border-orange-500/30 rounded" />
                  <span className="text-muted-foreground">💰 Impostos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-blue-500/20 border border-blue-500/30 rounded" />
                  <span className="text-muted-foreground">📄 Obrigações</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-4 bg-purple-500/20 border border-purple-500/30 rounded" />
                  <span className="text-muted-foreground">📊 Parcelamentos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedDay !== null} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Itens de {selectedDay} de {monthNames[month]} de {year}
            </DialogTitle>
            <DialogDescription>{selectedDayItems.length} item(ns) nesta data</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum item nesta data</p>
            ) : (
              selectedDayItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {getTypeIcon(item.type)} {item.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{item.client.name}</p>
                    </div>
                    <Badge
                      className={
                        item.status === "completed"
                          ? "bg-green-600"
                          : item.status === "in_progress"
                            ? "bg-blue-600"
                            : item.status === "overdue"
                              ? "bg-red-600"
                              : "bg-yellow-600"
                      }
                    >
                      {item.status === "completed"
                        ? "Concluído"
                        : item.status === "in_progress"
                          ? "Em Andamento"
                          : item.status === "overdue"
                            ? "Atrasado"
                            : "Pendente"}
                    </Badge>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  {item.installmentInfo && (
                    <p className="text-sm">
                      Parcela {item.installmentInfo.installmentNumber} de {item.installmentInfo.totalInstallments}
                    </p>
                  )}
                  {item.amount && (
                    <p className="text-sm font-medium">
                      Valor: R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Tipo: {item.type === 'tax' ? 'Imposto' : item.type === 'obligation' ? 'Obrigação' : 'Parcelamento'}</span>
                    <span>Vencimento: {formatDate(item.dueDate)}</span>
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