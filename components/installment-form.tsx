"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { X, AlertCircle, AlertTriangle, Flag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Installment, Client, WeekendRule, RecurrenceType } from "@/lib/types"

type InstallmentFormProps = {
  installment?: Installment
  clients: Client[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (installment: Installment) => void
}

export function InstallmentForm({ installment, clients, open, onOpenChange, onSave }: InstallmentFormProps) {
  const [formData, setFormData] = useState<Partial<Installment>>(
    installment || {
      clientId: "",
      description: "",
      installmentNumber: 1,
      totalInstallments: 1,
      dueDate: "",
      amount: 0,
      status: "pending",
      frequency: "monthly",
      recurrenceType: "monthly",
      recurrenceInterval: 1,
      recurrenceEndDate: undefined,
      autoGenerate: false,
      weekendRule: "postpone",
      notes: "",
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const installmentData: Installment = {
      id: installment?.id || crypto.randomUUID(),
      clientId: formData.clientId!,
      description: formData.description!,
      installmentNumber: formData.installmentNumber!,
      totalInstallments: formData.totalInstallments!,
      dueDate: formData.dueDate!,
      amount: formData.amount!,
      status: formData.status || "pending",
      frequency: formData.frequency!,
      recurrenceType: formData.recurrenceType!,
      recurrenceInterval: formData.recurrenceInterval,
      recurrenceEndDate: formData.recurrenceEndDate,
      autoGenerate: formData.autoGenerate || false,
      weekendRule: formData.weekendRule!,
      parentInstallmentId: formData.parentInstallmentId,
      generatedFor: formData.generatedFor,
      notes: formData.notes,
      completedAt: formData.completedAt,
      completedBy: formData.completedBy,
      createdAt: installment?.createdAt || new Date().toISOString(),
    }
    onSave(installmentData)
    onOpenChange(false)
  }

  const getPriorityIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertCircle className="size-4 text-red-600" />
      case "in_progress":
        return <AlertTriangle className="size-4 text-orange-600" />
      case "completed":
        return <Flag className="size-4 text-green-600" />
      default:
        return <Flag className="size-4 text-blue-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installment ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
          <DialogDescription>Configure o parcelamento com todas as regras e vencimentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o parcelamento..."
                  rows={2}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="installmentNumber">Parcela Atual *</Label>
                  <Input
                    id="installmentNumber"
                    type="number"
                    min="1"
                    value={formData.installmentNumber || ""}
                    onChange={(e) => setFormData({ ...formData, installmentNumber: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="totalInstallments">Total de Parcelas *</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    min="1"
                    value={formData.totalInstallments || ""}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gestão e Controle */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gestão e Controle</h3>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    Status *{getPriorityIcon(formData.status || "pending")}
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Data de Vencimento *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate || ""}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Configuração de Recorrência */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="text-sm font-semibold">Configuração de Recorrência</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceType">Tipo de Recorrência *</Label>
                  <Select
                    value={formData.recurrenceType}
                    onValueChange={(value) => setFormData({ ...formData, recurrenceType: value as RecurrenceType })}
                  >
                    <SelectTrigger id="recurrenceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrenceType === "custom" && (
                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceInterval">Intervalo (meses)</Label>
                    <Input
                      id="recurrenceInterval"
                      type="number"
                      min="1"
                      value={formData.recurrenceInterval || 1}
                      onChange={(e) => setFormData({ ...formData, recurrenceInterval: Number(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGenerate">Gerar Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">Criar próximas parcelas automaticamente</p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                />
              </div>

              {formData.autoGenerate && (
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceEndDate">Data Final (Opcional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate || ""}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Deixe em branco para recorrência indefinida</p>
                </div>
              )}
            </div>

            {/* Vencimentos */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vencimentos</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="weekendRule">Regra de Final de Semana *</Label>
                  <Select
                    value={formData.weekendRule}
                    onValueChange={(value) => setFormData({ ...formData, weekendRule: value as WeekendRule })}
                  >
                    <SelectTrigger id="weekendRule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postpone">Postergar</SelectItem>
                      <SelectItem value="anticipate">Antecipar</SelectItem>
                      <SelectItem value="keep">Manter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Adicionais
              </h3>

              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais, comentários internos..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Parcelamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
