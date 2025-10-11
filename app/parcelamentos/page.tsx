"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { InstallmentForm } from "@/components/installment-form"
import { getInstallmentsWithDetails, getClients, saveInstallment, deleteInstallment } from "@/lib/supabase-storage"
import { formatDate, formatCurrency } from "@/lib/date-utils"
import { Plus, Edit, Trash2, Calendar, DollarSign, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InstallmentWithDetails, Client } from "@/lib/types"

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<InstallmentWithDetails[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<InstallmentWithDetails | undefined>()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  const loadData = async () => {
    const [installmentsData, clientsData] = await Promise.all([
      getInstallmentsWithDetails(),
      getClients()
    ])
    setInstallments(installmentsData)
    setClients(clientsData)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (installment: any) => {
    await saveInstallment(installment)
    await loadData()
    setIsFormOpen(false)
    setEditingInstallment(undefined)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este parcelamento?")) {
      await deleteInstallment(id)
      await loadData()
    }
  }

  const handleEdit = (installment: InstallmentWithDetails) => {
    setEditingInstallment(installment)
    setIsFormOpen(true)
  }

  const filteredInstallments = installments.filter(installment => {
    const matchesSearch = installment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         installment.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || installment.status === statusFilter
    const matchesClient = clientFilter === "all" || installment.clientId === clientFilter
    
    return matchesSearch && matchesStatus && matchesClient
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      in_progress: "default",
      completed: "default",
      overdue: "destructive"
    } as const

    const labels = {
      pending: "Pendente",
      in_progress: "Em Andamento", 
      completed: "Concluído",
      overdue: "Atrasado"
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-balance">Parcelamentos</h1>
              <p className="text-lg text-muted-foreground">Controle de parcelamentos dos clientes</p>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="size-4 mr-2" />
              Novo Parcelamento
            </Button>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <Input
                    placeholder="Descrição ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Parcelamentos */}
          <div className="grid gap-4">
            {filteredInstallments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum parcelamento encontrado</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || statusFilter !== "all" || clientFilter !== "all"
                      ? "Tente ajustar os filtros para encontrar parcelamentos."
                      : "Comece criando seu primeiro parcelamento."}
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Novo Parcelamento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredInstallments.map((installment) => (
                <Card key={installment.id} className={isOverdue(installment.dueDate) ? "border-red-200" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{installment.description}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <User className="size-4" />
                          {installment.client.name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(installment.status)}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(installment)}
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(installment.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Parcela</p>
                        <p className="text-lg font-semibold">
                          {installment.installmentNumber} / {installment.totalInstallments}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Vencimento</p>
                        <p className="text-lg font-semibold flex items-center gap-1">
                          <Calendar className="size-4" />
                          {formatDate(installment.dueDate)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Valor</p>
                        <p className="text-lg font-semibold flex items-center gap-1">
                          <DollarSign className="size-4" />
                          {formatCurrency(installment.amount)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Progresso</p>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(installment.installmentNumber / installment.totalInstallments) * 100}%`
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((installment.installmentNumber / installment.totalInstallments) * 100)}% concluído
                        </p>
                      </div>
                    </div>
                    {installment.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{installment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <InstallmentForm
        installment={editingInstallment}
        clients={clients}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditingInstallment(undefined)
        }}
        onSave={handleSave}
      />
    </div>
  )
}
