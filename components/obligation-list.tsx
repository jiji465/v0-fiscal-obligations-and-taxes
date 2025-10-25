"use client"

import { useState } from "react"
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
} from "lucide-react"
import type { Obligation, ObligationWithDetails, Client, Tax } from "@/lib/types" // Adicionado Obligation
import { saveObligation, deleteObligation } from "@/lib/supabase/database"
import { formatDate, isOverdue } from "@/lib/date-utils"
import { getRecurrenceDescription } from "@/lib/recurrence-utils"

type ObligationListProps = {
  obligations: ObligationWithDetails[]
  clients: Client[]
  taxes: Tax[]
  onUpdate: () => void
}

export function ObligationList({ obligations, clients, taxes, onUpdate }: ObligationListProps) {
  const [search, setSearch] = useState("")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [editingObligation, setEditingObligation] = useState<ObligationWithDetails | undefined>()
  const [viewingObligation, setViewingObligation] = useState<ObligationWithDetails | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<"dueDate" | "client" | "status">("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // --- Verificação Reforçada na Filtragem ---
  const filteredObligations = obligations.filter((obl) => {
    // Garante que obl não seja null/undefined antes de acessar propriedades
    if (!obl) return false;

    // Acesso seguro às propriedades com fallback para string vazia
    const clientNameLower = obl.client?.name?.toLowerCase() ?? ""; // ?? em vez de ||
    const taxNameLower = obl.tax?.name?.toLowerCase() ?? ""; // ?? em vez de ||
    const oblNameLower = obl.name?.toLowerCase() ?? ""; // ?? em vez de ||
    const oblDescriptionLower = obl.description?.toLowerCase() ?? ""; // ?? em vez de ||
    const oblProtocolLower = obl.protocol?.toLowerCase() ?? ""; // ?? em vez de ||
    const searchLower = search.toLowerCase();

    const matchesSearch =
      oblNameLower.includes(searchLower) ||
      clientNameLower.includes(searchLower) ||
      (obl.tax && taxNameLower.includes(searchLower)) || // Já verifica se obl.tax existe
      oblDescriptionLower.includes(searchLower) ||
      oblProtocolLower.includes(searchLower);


    const matchesClient = clientFilter === "all" || obl.clientId === clientFilter

    return matchesSearch && matchesClient
  })

  // --- Verificação na Ordenação ---
  const sortedObligations = [...filteredObligations].sort((a, b) => {
    // Garante que a e b não sejam null/undefined
    if (!a || !b) return 0;

    let comparison = 0;

    if (sortBy === "dueDate") {
        // Assume que calculatedDueDate sempre existe em ObligationWithDetails válidas
        comparison = new Date(a.calculatedDueDate).getTime() - new Date(b.calculatedDueDate).getTime();
    } else if (sortBy === "client") {
        const clientAName = a.client?.name ?? ''; // Usa ??
        const clientBName = b.client?.name ?? ''; // Usa ??
        comparison = clientAName.localeCompare(clientBName);
    } else if (sortBy === "status") {
        const statusOrder = { overdue: 0, pending: 1, in_progress: 2, completed: 3 } as const; // Adiciona 'as const'
        // Determina o status real, considerando o overdue baseado na data
        const getRealStatus = (obl: ObligationWithDetails | null | undefined): keyof typeof statusOrder => { // Define o tipo de retorno
            if (!obl) return 'pending'; // Valor padrão se obl for inválido
            if (obl.status !== 'completed' && isOverdue(obl.calculatedDueDate)) {
                return 'overdue';
            }
            // Retorna o status existente se for válido, senão 'pending'
            return statusOrder.hasOwnProperty(obl.status) ? obl.status : 'pending';
        }
        comparison = statusOrder[getRealStatus(a)] - statusOrder[getRealStatus(b)]
    }

    return sortOrder === "asc" ? comparison : -comparison
  })


  // --- Funções handleSave, handleDelete, handleComplete, handleInProgress ---
    const handleSave = async (obligationData: Obligation) => { // Aceita Obligation base
    try {
        await saveObligation(obligationData) // Salva no Supabase
        onUpdate() // Atualiza a lista na UI
        setEditingObligation(undefined)
        setIsFormOpen(false) // Fecha o formulário
    } catch (error) {
        console.error("[v0] Erro ao salvar obrigação:", error)
        alert("Erro ao salvar obrigação. Verifique o console para detalhes.")
    }
  }


  const handleDelete = async (id: string) => {
    if (confirm("⚠️ Tem certeza que deseja excluir esta obrigação?\n\nEsta ação não pode ser desfeita.")) {
      try {
        await deleteObligation(id)
        onUpdate()
      } catch (error) {
        console.error("[v0] Erro ao deletar obrigação:", error)
        alert("Erro ao deletar obrigação. Verifique o console para detalhes.")
      }
    }
  }

  const handleComplete = async (obligation: ObligationWithDetails) => {
    const history = obligation.history || []
    const completedDate = new Date().toISOString()
    // Cria um novo objeto omitindo as propriedades extras
     const { client, tax, calculatedDueDate, ...baseObligation } = obligation;
     const updatedObligation: Obligation = {
        ...baseObligation, // Espalha apenas as propriedades base
        status: "completed" as const,
        completedAt: completedDate,
        realizationDate: completedDate.split("T")[0],
        completedBy: "Usuário",
        history: [
            ...history,
            {
            id: crypto.randomUUID(),
            action: "completed" as const,
            description: `Obrigação concluída em ${formatDate(completedDate.split("T")[0])}`,
            timestamp: completedDate,
            },
        ],
    };
    await handleSave(updatedObligation);
  }

  const handleInProgress = async (obligation: ObligationWithDetails) => {
     const history = obligation.history || []
     // Cria um novo objeto omitindo as propriedades extras
     const { client, tax, calculatedDueDate, ...baseObligation } = obligation;
     const updatedObligation: Obligation = {
        ...baseObligation, // Espalha apenas as propriedades base
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
    };
    await handleSave(updatedObligation);
  }

  // --- Funções handleEdit, handleView, handleNew ---
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

  // --- Funções getRelativeDate, getStatusBadge ---
  const getRelativeDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "-";

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
    } catch (e) {
        console.error("Erro ao formatar data relativa:", dateString, e);
        return "-";
    }
  }


  const getStatusBadge = (obligation: ObligationWithDetails) => {
    // Garante que obligation não seja null/undefined
    if (!obligation) return null;

    const overdue = obligation.status !== 'completed' && isOverdue(obligation.calculatedDueDate);

    if (obligation.status === "completed") {
      return (
        <div className="flex flex-col items-start gap-1">
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
    if (overdue) { // Verifica se está atrasada
      return (
        <Badge variant="destructive" className="bg-red-600 text-white">
          <AlertTriangle className="size-3 mr-1" />
          Atrasada
        </Badge>
      )
    }
    // Se não for nenhuma das anteriores, é pendente
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="size-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  // --- Função toggleSort ---
  const toggleSort = (field: "dueDate" | "client" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // --- Componente QuickActionButtons ---
    const QuickActionButtons = ({ obligation }: { obligation: ObligationWithDetails }) => {
    // Garante que obligation não seja null/undefined
    if (!obligation) return null;

    const isCompleted = obligation.status === "completed";
    const isInProgress = obligation.status === "in_progress";
    // Considera 'overdue' como um estado implícito que ainda está pendente ou em progresso para ações
    const isEffectivelyPending = obligation.status === "pending" || (obligation.status !== 'completed' && obligation.status !== 'in_progress');

    if (isCompleted) {
        // Pode adicionar um botão "Reabrir" aqui se necessário
        return null;
    }

    return (
        <div className="flex gap-1">
        {/* Mostra 'Iniciar' apenas se estiver efetivamente pendente */}
        {isEffectivelyPending && !isInProgress && (
            <Button size="sm" variant="outline" onClick={() => handleInProgress(obligation)} className="h-7 text-xs">
            <PlayCircle className="size-3 mr-1" />
            Iniciar
            </Button>
        )}
        {/* Mostra 'Concluir' se estiver em progresso ou efetivamente pendente */}
        {(isInProgress || isEffectivelyPending) && (
            <Button
            size="sm"
            variant="default"
            onClick={() => handleComplete(obligation)}
            className="h-7 text-xs bg-green-600 hover:bg-green-700"
            >
            <CheckCircle2 className="size-3 mr-1" />
            Concluir
            </Button>
        )}
        </div>
    );
    } // <- Certifique-se que esta chave está fechando a função QuickActionButtons


  // --- JSX de Renderização ---
  return (
    <div className="space-y-4">
      {/* Barra de busca e botões */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar obrigações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="size-4 mr-2" />
            Filtros
            {clientFilter !== "all" && (
              <Badge variant="secondary" className="ml-2 size-5 rounded-full p-0 flex items-center justify-center">
                1
              </Badge>
            )}
          </Button>
          <Button onClick={handleNew}>
            <Plus className="size-4 mr-2" />
            Nova Obrigação
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {/* Acesso seguro ao nome do cliente no filtro */}
                {clients.map((client) => (
                  <SelectItem key={client?.id ?? crypto.randomUUID()} value={client?.id ?? ''}> {/* Usa ID ou chave única */}
                    {client?.name ?? `Cliente ID: ${client?.id ?? 'inválido'}`} {/* Fallback */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Tabela */}
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
                <Button variant="ghost" size="sm" onClick={() => toggleSort("dueDate")} className="-ml-3">
                  Vencimento
                  <ArrowUpDown className="ml-2 size-3" />
                </Button>
              </TableHead>
              <TableHead>Ações Rápidas</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedObligations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma obrigação encontrada
                </TableCell>
              </TableRow>
            ) : (
              // --- Verificação Reforçada na Renderização (map) ---
              sortedObligations.map((obligation) => {
                 // Pula a renderização se obligation for null/undefined (pouco provável, mas seguro)
                 if (!obligation) return null;

                const overdue = obligation.status !== 'completed' && isOverdue(obligation.calculatedDueDate);
                return (
                <TableRow
                  key={obligation.id} // Usa o ID da obrigação
                  className={ overdue ? "bg-red-50/50 dark:bg-red-950/10" : "" }
                >
                  {/* Célula Obrigação */}
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
                                  : "border-blue-500 text-blue-700 dark:text-blue-400" // Assumindo 'low' é azul
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
                  {/* Célula Cliente */}
                  <TableCell>
                     <div className="font-medium">{obligation.client?.name ?? 'Cliente Inválido'}</div>
                  </TableCell>
                  {/* Célula Imposto */}
                  <TableCell>
                    {obligation.tax ? (
                      <Badge variant="outline">{obligation.tax?.name ?? 'Imposto Inválido'}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {/* Célula Status */}
                  <TableCell>{getStatusBadge(obligation)}</TableCell>
                  {/* Célula Vencimento */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">{formatDate(obligation.calculatedDueDate)}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRelativeDate(obligation.calculatedDueDate)}
                      </div>
                      {/* Acesso seguro à recorrência */}
                      {obligation.recurrence &&
                        <Badge variant="secondary" className="text-xs">
                          {getRecurrenceDescription(obligation)}
                        </Badge>
                      }
                    </div>
                  </TableCell>
                  {/* Célula Ações Rápidas */}
                  <TableCell>
                    <QuickActionButtons obligation={obligation} />
                  </TableCell>
                  {/* Célula Menu */}
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

       {/* Formulário e Detalhes (passa handleSave corrigida) */}
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
} // <- Certifique-se que esta chave fecha o componente ObligationList
