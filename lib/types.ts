export type Client = {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  status: "active" | "inactive"
  createdAt: string
}

export type Tax = {
  id: string
  name: string
  description: string
  federalTaxCode?: string
  dueDay?: number // Dia do vencimento do imposto (1-31)
  createdAt: string
}

export type WeekendRule = "postpone" | "anticipate" | "keep"

export type RecurrenceType = "monthly" | "bimonthly" | "quarterly" | "semiannual" | "annual" | "custom"

export type Priority = "low" | "medium" | "high" | "urgent"

export type CertificateType = "federal" | "state" | "municipal" | "fgts" | "labor"

export type Certificate = {
  id: string
  clientId: string
  type: CertificateType
  name: string
  issueDate?: string
  expiryDate: string
  status: "valid" | "expired" | "pending"
  documentNumber?: string
  notes?: string
  createdAt: string
}

export type ObligationCategory = "sped" | "tax_guide" | "certificate" | "declaration" | "other"

export type Obligation = {
  id: string
  name: string
  description?: string
  category: ObligationCategory // Nova categoria para organização
  clientId: string
  taxId?: string
  dueDay: number
  dueMonth?: number
  frequency: "monthly" | "quarterly" | "annual" | "custom"
  recurrence: RecurrenceType
  recurrenceInterval?: number
  recurrenceEndDate?: string
  autoGenerate: boolean
  weekendRule: WeekendRule
  status: "pending" | "in_progress" | "completed" | "overdue" // Adicionado status "in_progress"
  priority: Priority
  assignedTo?: string
  protocol?: string
  realizationDate?: string
  amount?: number
  notes?: string
  createdAt: string
  completedAt?: string // Data de quando foi concluída
  completedBy?: string // Quem concluiu (usuário/contador)
  attachments?: string[] // URLs de anexos/documentos
  history?: ObligationHistory[]
  parentObligationId?: string // ID da obrigação original que gerou esta
  generatedFor?: string // Período para qual foi gerada (ex: "2025-01")
  tags?: string[]
}

export type ObligationHistory = {
  id: string
  action: "created" | "updated" | "completed" | "status_changed" | "comment_added"
  description: string
  timestamp: string
  user?: string
}

export type ObligationWithDetails = Obligation & {
  client: Client
  tax?: Tax
  calculatedDueDate: string
}

export type DashboardStats = {
  totalClients: number
  activeClients: number
  totalObligations: number
  pendingObligations: number
  completedThisMonth: number
  overdueObligations: number
  upcomingThisWeek: number
}
