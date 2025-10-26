"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
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
import type { Obligation, Client, Tax, WeekendRule, Priority, RecurrenceType } from "@/lib/types" // Importa tipos necessários

// Helper para formatar data como YYYY-MM-DD para input type="date"
const formatDateForInput = (date: Date | string | undefined | null): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    // Ajusta para o fuso horário local para evitar problemas de dia +/- 1
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

// Helper para criar uma data inicial baseada em dueDay/dueMonth
const getInitialDueDateString = (obligation?: Partial<Obligation>): string => {
    if (obligation?.realizationDate) { // Usa realizationDate se existir? Ou prefere calcular?
        // return formatDateForInput(obligation.realizationDate);
    }
    // Cria uma data baseada em dueDay/dueMonth para o input
    const today = new Date();
    const day = obligation?.dueDay ?? today.getDate(); // Usa dia atual como fallback
    // Se dueMonth existe, usa ele, senão usa o mês atual (ou próximo se o dia já passou)
    let month = obligation?.dueMonth ? obligation.dueMonth - 1 : today.getMonth();
    let year = today.getFullYear();

    let initialDate = new Date(year, month, day);

    // Se a data calculada for no passado (considerando apenas mês e dia), avança para o próximo período
    const checkDate = new Date();
    checkDate.setHours(0,0,0,0);
     if (initialDate < checkDate && !(obligation?.id)) { // Só avança se for NOVA obrigação
         // Lógica simples: avança um mês ou ano dependendo da recorrência mais comum (mensal)
         initialDate.setMonth(initialDate.getMonth() + 1);
     }


    return formatDateForInput(initialDate);
};


type ObligationFormProps = {
  obligation?: Obligation // Recebe Obligation base
  clients: Client[]
  taxes: Tax[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (obligation: Obligation) => void // Envia Obligation base
}

export function ObligationForm({ obligation, clients, taxes, open, onOpenChange, onSave }: ObligationFormProps) {
  // Estado interno para a data unificada do formulário
  const [dueDateString, setDueDateString] = useState<string>("");

  const [formData, setFormData] = useState<Partial<Obligation>>(
    obligation || {
      name: "",
      description: "",
      clientId: "",
      taxId: "",
      // dueDay e dueMonth não são mais diretamente controlados no estado inicial do form
      frequency: "monthly",
      recurrence: "monthly",
      recurrenceInterval: 1,
      autoGenerate: false,
      weekendRule: "postpone",
      status: "pending",
      priority: "medium",
      assignedTo: "",
      protocol: "",
      amount: undefined, // Usar undefined para número opcional
      notes: "",
      tags: [],
    },
  )

  const [newTag, setNewTag] = useState("")

  // Efeito para inicializar/atualizar dueDateString quando 'obligation' mudar
  useEffect(() => {
     if (obligation) {
       // Tenta usar uma data existente ou calcula uma data inicial
       // Prioridade: realizationDate > calcular com base em dueDay/Month > data atual
       const initialDate = obligation.realizationDate // Ou outra data relevante se existir
                         || getInitialDueDateString(obligation);
       setDueDateString(initialDate);
       setFormData(obligation); // Atualiza o resto do form
     } else {
       // Novo: Calcula data inicial baseada no dia 10 (ou outro padrão) do mês atual/próximo
        const defaultObligation = { dueDay: 10, dueMonth: undefined };
        setDueDateString(getInitialDueDateString(defaultObligation));
        setFormData({ // Reseta o form para novo
            name: "", description: "", clientId: "", taxId: "",
            frequency: "monthly", recurrence: "monthly", recurrenceInterval: 1,
            autoGenerate: false, weekendRule: "postpone", status: "pending",
            priority: "medium", assignedTo: "", protocol: "", amount: undefined,
            notes: "", tags: [],
        });
     }
  }, [obligation, open]); // Re-executa se 'obligation' ou 'open' mudar

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // --- Extrai dia e mês da dueDateString ---
    let dueDayFromDate: number | undefined;
    let dueMonthFromDate: number | undefined;
    if (dueDateString) {
        try {
            // Cria a data ajustando para UTC para evitar problemas de fuso
            const dateParts = dueDateString.split('-'); // YYYY-MM-DD
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10); // 1-12
            const day = parseInt(dateParts[2], 10); // 1-31

            if (!isNaN(day) && !isNaN(month)) {
                 dueDayFromDate = day;
                // Guarda o mês APENAS se a frequência for Anual ou Trimestral (ou outra que use mês fixo)
                if (formData.frequency === 'annual' || formData.frequency === 'quarterly') {
                    dueMonthFromDate = month;
                }
            } else {
                 console.error("Data de vencimento inválida no formulário:", dueDateString);
                 alert("Formato da data de vencimento inválido.");
                 return; // Impede o envio
            }
        } catch (error) {
            console.error("Erro ao processar data de vencimento:", dueDateString, error);
            alert("Erro ao processar a data de vencimento.");
            return; // Impede o envio
        }
    } else {
        alert("Por favor, selecione uma data de vencimento.");
        return; // Impede o envio se a data for obrigatória
    }
    // --- Fim da extração ---


    const history = formData?.history || [] // Usa formData.history
    const newHistoryEntry = {
      id: crypto.randomUUID(),
      action: obligation ? ("updated" as const) : ("created" as const),
      description: obligation ? `Obrigação atualizada` : `Obrigação criada`,
      timestamp: new Date().toISOString(),
    }

    // Monta o objeto final para salvar, usando os valores extraídos
    const obligationData: Obligation = {
      id: obligation?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description,
      clientId: formData.clientId!,
      taxId: formData.taxId || undefined,
      dueDay: dueDayFromDate!, // Usa o dia extraído da data!
      dueMonth: dueMonthFromDate, // Usa o mês extraído (ou undefined)
      frequency: formData.frequency as "monthly" | "quarterly" | "annual" | "custom",
      recurrence: formData.recurrence as RecurrenceType,
      recurrenceInterval: formData.recurrenceInterval,
      recurrenceEndDate: formData.recurrenceEndDate,
      autoGenerate: formData.autoGenerate || false,
      weekendRule: formData.weekendRule as WeekendRule,
      status: formData.status as "pending" | "in_progress" | "completed" | "overdue",
      priority: formData.priority as Priority,
      assignedTo: formData.assignedTo || undefined,
      protocol: formData.protocol || undefined,
      // Mantém realizationDate se já existia ou foi preenchido
      realizationDate: formData.realizationDate || (dueDateString && formData.status === 'completed' ? dueDateString : undefined),
      amount: formData.amount ? Number(formData.amount) : undefined,
      notes: formData.notes,
      createdAt: obligation?.createdAt || new Date().toISOString(),
      completedAt: formData.completedAt, // Pode ser preenchido ao completar
      completedBy: formData.completedBy, // Pode ser preenchido ao completar
      attachments: formData.attachments || [],
      history: [...history, newHistoryEntry],
      parentObligationId: formData.parentObligationId, // Mantém se existir
      generatedFor: formData.generatedFor, // Mantém se existir
      tags: formData.tags || [],
    }
    onSave(obligationData)
    // onOpenChange(false) // Comentado - Fechar o modal deve ser responsabilidade de quem chama onSave
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter((t) => t !== tag) })
  }

  const getPriorityIcon = (priority: string | undefined) => {
    switch (priority) {
      case "urgent":
        return <AlertCircle className="size-4 text-red-600" />
      case "high":
        return <AlertTriangle className="size-4 text-orange-600" />
      case "medium":
        return <Flag className="size-4 text-yellow-600" />
      default: // low or undefined
        return <Flag className="size-4 text-blue-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{obligation ? "Editar Obrigação" : "Nova Obrigação"}</DialogTitle>
          <DialogDescription>Configure a obrigação fiscal com todas as regras e vencimentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Básicas
              </h3>
              {/* Nome */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Obrigação *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: DCTF, EFD-ICMS, SPED Fiscal"
                  required
                />
              </div>
              {/* Descrição */}
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a obrigação..."
                  rows={2}
                />
              </div>
              {/* Cliente e Imposto */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="clientId">Cliente *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    required // Cliente continua obrigatório
                  >
                    <SelectTrigger id="clientId">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="taxId">Imposto (Opcional)</Label>
                  <Select
                    value={formData.taxId || "none"}
                    onValueChange={(value) => setFormData({ ...formData, taxId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="taxId">
                      <SelectValue placeholder="Sem imposto vinculado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem imposto vinculado</SelectItem>
                      {taxes.map((tax) => (
                        <SelectItem key={tax.id} value={tax.id}>
                          {tax.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Vencimentos (Campo de data unificado) */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vencimento</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                 {/* --- Novo Campo de Data Unificado --- */}
                 <div className="grid gap-2">
                    <Label htmlFor="dueDate">Data de Vencimento *</Label>
                    <Input
                        id="dueDate"
                        type="date"
                        value={dueDateString}
                        onChange={(e) => setDueDateString(e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Define o dia e mês (este último apenas para certas recorrências).
                    </p>
                 </div>
                 {/* --- Fim do Novo Campo --- */}

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


            {/* Configuração de Recorrência */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <h3 className="text-sm font-semibold">Configuração de Recorrência</h3>
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
                       <SelectItem value="custom">Personalizado (em meses)</SelectItem> {/* Ajuste texto se necessário */}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define qual mês usar como referência (mensal usa o atual/próximo).
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recurrence">Tipo de Recorrência (para geração automática)</Label>
                  <Select
                    value={formData.recurrence}
                    onValueChange={(value) => setFormData({ ...formData, recurrence: value as RecurrenceType })}
                  >
                    <SelectTrigger id="recurrence">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado (intervalo abaixo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mostra intervalo apenas se recorrência for custom */}
                {(formData.recurrence === "custom") && (
                  <div className="grid gap-2">
                    <Label htmlFor="recurrenceInterval">Intervalo Personalizado (meses)</Label>
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
                  <Label htmlFor="autoGenerate">Gerar Próximas Automaticamente</Label>
                  <p className="text-xs text-muted-foreground">Criar ocorrências futuras baseado na recorrência</p>
                </div>
                <Switch
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoGenerate: checked })}
                />
              </div>

              {formData.autoGenerate && (
                <div className="grid gap-2">
                  <Label htmlFor="recurrenceEndDate">Data Final da Recorrência (Opcional)</Label>
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

            {/* Gestão e Controle */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gestão e Controle</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority" className="flex items-center gap-2">
                    Prioridade *{getPriorityIcon(formData.priority)}
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
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
                      <SelectItem value="completed">Concluída</SelectItem>
                      {/* Status Atrasada é calculado, não selecionável aqui */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="realizationDate">Data de Realização (Conclusão)</Label>
                  <Input
                    id="realizationDate"
                    type="date"
                    value={formatDateForInput(formData.realizationDate)} // Usa helper para formatar
                    onChange={(e) => setFormData({ ...formData, realizationDate: e.target.value || undefined })} // Salva como YYYY-MM-DD
                    disabled={formData.status !== 'completed'} // Desabilita se não estiver concluído
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Responsável</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo || ""}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="protocol">Protocolo/Processo</Label>
                  <Input
                    id="protocol"
                    value={formData.protocol || ""}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                    placeholder="Número do protocolo"
                  />
                </div>
              </div>
            </div>


            {/* Informações Adicionais */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informações Adicionais
              </h3>
              {/* Valor */}
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount === undefined ? "" : formData.amount} // Controla input vazio vs 0
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value === "" ? undefined : Number(e.target.value) })
                  }
                  placeholder="0,00"
                />
              </div>
              {/* Notas */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais, comentários internos..."
                  rows={3}
                />
              </div>
              {/* Tags */}
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { // Adiciona vírgula como gatilho
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Adicionar tag e teclar Enter..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Obrigação</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
