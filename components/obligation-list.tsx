"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ObligationForm } from "./obligation-form"
import { ObligationDetails } from "./obligation-details"
import {
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Plus,
  CheckCircle2,
  PlayCircle,
  Eye,
  Filter,
  AlertTriangle,
  ArrowUpDown,
  Clock,
  Loader2,
} from "lucide-react"
import type { ObligationWithDetails, Client, Tax } from "@/lib/types"
import { saveObligation, deleteObligation } from "@/lib/supabase/database"
import { formatDate, isOverdue } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"
import { getFilteredObligations } from "@/lib/server-actions"
import type { ObligationFilters } from "@/lib/supabase/database"

type ObligationListProps = {
  initialObligations: ObligationWithDetails[]
  clients: Client[]
  taxes: Tax[]
  onUpdate: () => void
}

export function ObligationList({ initialObligations, clients, taxes, onUpdate }: ObligationListProps) {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>(initialObligations)
  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [editingObligation, setEditingObligation] = useState<ObligationWithDetails | undefined>()
  const [viewingObligation, setViewingObligation] = useState<ObligationWithDetails | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dueDay" | "client" | "status" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const ITEMS_PER_PAGE = 20

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFilteredObligations()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, clientFilter, statusFilter, priorityFilter, sortBy, sortOrder])

  const fetchFilteredObligations = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: ObligationFilters = {
        search: search || undefined,
        clientId: clientFilter !== "all" ? clientFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        sortBy,
        sortOrder,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE
      }

      const result = await getFilteredObligations(filters)
      setObligations(result.obligations)
      setTotalCount(result.totalCount)
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Error fetching filtered obligations:", error)
    } finally {
      setIsLoading(false)
    }
  }, [search, clientFilter, statusFilter, priorityFilter, sortBy, sortOrder, currentPage])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(0) // Reset to first page when searching
  }

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'client':
        setClientFilter(value)
        break
      case 'status':
        setStatusFilter(value)
        break
      case 'priority':
        setPriorityFilter(value)
        break
    }
    setCurrentPage(0) // Reset to first page when filtering
  }

  const handleSave = (obligation: any) => {
    saveObligation(obligation)
    onUpdate()
    setEditingObligation(undefined)
  }

  const handleDelete = (id: string) => {
    if (confirm("⚠️ Tem certeza que deseja excluir esta obrigação?\n\nEsta ação não pode ser desfeita.")) {
      deleteObligation(id)
      onUpdate()
    }
  }

  const handleComplete = (obligation: ObligationWithDetails) => {
    const history = obligation.history || []
    const completedDate = new Date().toISOString()
    const updated = {
      ...obligation,
      status: "completed" as const,
      completedAt: completedDate,
      realizationDate: completedDate.split("T")[0],
      completedBy: "Contador",
      history: [
        ...history,
        {
          id: crypto.randomUUID(),
          action: "completed" as const,
          description: `Obrigação concluída em ${formatDate(completedDate.split("T")[0])}`,
          timestamp: completedDate,
        },
      ],
    }
    saveObligation(updated)
    onUpdate()
  }

  const handleInProgress = (obligation: ObligationWithDetails) => {
    const history = obligation.history || []
    const updated = {
      ...obligation,
      status: "in_progress" as const,
      history: [
        ...history,
        {
          id: crypto.randomUUID(),
          action: "status_changed" as const,
          description: "Status alterado para Em Andamento",
          timestamp: new Date().toISOString(),
        },
      ],
    }
    saveObligation(updated)
    onUpdate()
  }

  const handleEdit = (obligation: ObligationWithDetails) => {
    setEditingObligation(obligation)
    setIsFormOpen(true)
  }

  const handleView = (obligation: ObligationWithDetails) => {
    setViewingObligation(obligation)
    setIsDetailsOpen(true)
  }

  const handleNew = () => {
    setEditingObligation(undefined)
    setIsFormOpen(true)
  }

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Amanhã"
    if (diffDays === -1) return "Ontem"
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`
    if (diffDays <= 7) return `Em ${diffDays} dias`

    return formatDate(dateString)
  }

  const getStatusBadge = (obligation: ObligationWithDetails) => {
    if (obligation.status === "completed") {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="size-3 mr-1" />
            Concluída
          </Badge>
          {obligation.completedAt && (
            <span className="text-xs text-muted-foreground">{formatDate(obligation.completedAt.split("T")[0])}</span>
          )}
        </div>
      )
    }
    if (obligation.status === "in_progress") {
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
          <PlayCircle className="size-3 mr-1" />
          Em Andamento
        </Badge>
      )
    }
    if (obligation.status === "overdue" || isOverdue(obligation.calculatedDueDate)) {
      return (
        <Badge variant="destructive" className="bg-red-600 text-white">
          <AlertTriangle className="size-3 mr-1" />
          Atrasada
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="size-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  const toggleSort = (field: "dueDay" | "client" | "status" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const QuickActionButtons = ({ obligation }: { obligation: ObligationWithDetails }) => {
    if (obligation.status === "completed") {
      return null
    }

    return (
      <div className="flex gap-1">
        {obligation.status === "pending" && (
          <Button size="sm" variant="outline" onClick={() => handleInProgress(obligation)} className="h-7 text-xs">
            <PlayCircle className="size-3 mr-1" />
            Iniciar
          </Button>
        )}
        <Button
          size="sm"
          variant="default"
          onClick={() => handleComplete(obligation)}
          className="h-7 text-xs bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="size-3 mr-1" />
          Concluir
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar obrigações..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="size-4 mr-2" />
            Filtros
            {(clientFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all") && (
              <Badge variant="secondary" className="ml-2 size-5 rounded-full p-0 flex items-center justify-center">
                {[clientFilter, statusFilter, priorityFilter].filter(f => f !== "all").length}
              </Badge>
            )}
          </Button>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Nova Obrigação
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="grid sm:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientFilter} onValueChange={(value) => handleFilterChange('client', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="overdue">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Prioridade</label>
            <Select value={priorityFilter} onValueChange={(value) => handleFilterChange('priority', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Obrigação</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("client")} className="-ml-3">
                  Cliente
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>Imposto</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("status")} className="-ml-3">
                  Status
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => toggleSort("dueDay")} className="-ml-3">
                  Vencimento
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>Ações Rápidas</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando obrigações...
                  </div>
                </TableCell>
              </TableRow>
            ) : obligations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma obrigação encontrada
                </TableCell>
              </TableRow>
            ) : (
              obligations.map((obligation) => (
                <TableRow
                  key={obligation.id}
                  className={
                    isOverdue(obligation.calculatedDueDate) && obligation.status !== "completed"
                      ? "bg-red-50/50 dark:bg-red-950/10"
                      : ""
                  }
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{obligation.name}</div>
                        {obligation.priority && obligation.priority !== "medium" && (
                          <Badge
                            variant="outline"
                            className={
                              obligation.priority === "urgent"
                                ? "border-red-500 text-red-700 dark:text-red-400"
                                : obligation.priority === "high"
                                  ? "border-orange-500 text-orange-700 dark:text-orange-400"
                                  : "border-blue-500 text-blue-700 dark:text-blue-400"
                            }
                          >
                            {obligation.priority === "urgent"
                              ? "Urgente"
                              : obligation.priority === "high"
                                ? "Alta"
                                : "Baixa"}
                          </Badge>
                        )}
                      </div>
                      {obligation.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">{obligation.description}</div>
                      )}
                      {obligation.assignedTo && (
                        <div className="text-xs text-muted-foreground">Responsável: {obligation.assignedTo}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{obligation.client.name}</div>
                  </TableCell>
                  <TableCell>
                    {obligation.tax ? (
                      <Badge variant="outline">{obligation.tax.name}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(obligation)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">{formatDate(obligation.calculatedDueDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRelativeDate(obligation.calculatedDueDate)}
                      </div>
                      {obligation.recurrence && obligation.recurrence !== "none" && (
                        <Badge variant="secondary" className="text-xs">
                          {getRecurrenceDescription(obligation)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <QuickActionButtons obligation={obligation} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(obligation)}>
                          <Eye className="size-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(obligation)}>
                          <Pencil className="size-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(obligation.id)} className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {currentPage * ITEMS_PER_PAGE + 1} a {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} de {totalCount} obrigações
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasMore || isLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <ObligationForm
        obligation={editingObligation}
        clients={clients}
        taxes={taxes}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSave}
      />

      {viewingObligation && (
        <ObligationDetails obligation={viewingObligation} open={isDetailsOpen} onOpenChange={setIsDetailsOpen} />
      )}
    </div>
  )
}
