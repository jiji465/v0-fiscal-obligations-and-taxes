"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import type { ObligationWithDetails } from "@/lib/types"

type CalendarViewProps = {
  obligations: ObligationWithDetails[]
}

export function CalendarView({ obligations }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getObligationsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    return obligations.filter((obl) => {
      const oblDate = new Date(obl.calculatedDueDate).toISOString().split("T")[0]
      return oblDate === dateStr && obl.status === "pending"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendário de Vencimentos</CardTitle>
            <CardDescription>Visualize as obrigações por data</CardDescription>
          </div>
          <CalendarIcon className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {monthNames[month]} {year}
            </h3>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
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

              const dayObligations = getObligationsForDay(day)
              const isToday =
                day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
              const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6

              return (
                <div
                  key={day}
                  className={`aspect-square border rounded-lg p-1 flex flex-col ${
                    isToday ? "border-primary bg-primary/5" : ""
                  } ${isWeekend ? "bg-muted/30" : ""}`}
                >
                  <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{day}</div>
                  <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {dayObligations.slice(0, 2).map((obl) => (
                      <div
                        key={obl.id}
                        className="text-[10px] px-1 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded truncate"
                        title={`${obl.name} - ${obl.client.name}`}
                      >
                        {obl.name}
                      </div>
                    ))}
                    {dayObligations.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">+{dayObligations.length - 2}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Legenda</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-4 border-2 border-primary rounded" />
                <span className="text-muted-foreground">Hoje</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 bg-muted/30 rounded" />
                <span className="text-muted-foreground">Final de semana</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 bg-blue-100 dark:bg-blue-950 rounded" />
                <span className="text-muted-foreground">Obrigação pendente</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
