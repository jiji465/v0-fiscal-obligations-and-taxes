"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getClients, getTaxes, saveInstallment } from "@/lib/supabase/database" // CORREÇÃO: Usar supabase
import type { Installment, Client, Tax, WeekendRule, Priority, RecurrenceType } from "@/lib/types"
import { AlertCircle, Flame, TrendingUp, Zap } from "lucide-react"

interface InstallmentFormProps {
  installment?: Installment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void // onSave deve apenas sinalizar para recarregar, não passar dados
}

export function InstallmentForm({ installment, open, onOpenChange, onSave }: InstallmentFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [formData, setFormData] = useState<Partial<Installment>>({}) // Iniciar vazio
  const [loading, setLoading] = useState(false); // Loading state

  // CORREÇÃO: Buscar clientes e impostos do Supabase de forma assíncrona
  useEffect(() => {
     const loadDropdownData = async () => {
         const [clientsData, taxesData] = await Promise.all([getClients(), getTaxes()]);
         setClients(clientsData);
         setTaxes(taxesData);
     }
     if (open) { // Carrega só quando o modal abre
        loadDropdownData();
     }
  }, [open]) // Dependência no `open`

  // CORREÇÃO: Atualizar formData quando `installment` ou `open` mudar
  useEffect(() => {
    if (open) {
        setFormData(
          installment || { // Resetar para default se for novo
            name: "",
            description: "",
            clientId: "",
            taxId: "",
            installmentCount: 1,
            currentInstallment: 1,
            dueDay: 10,
            firstDueDate: "",
            weekendRule: "postpone",
            status: "pending",
            priority: "medium",
            assignedTo: "",
            protocol: "",
            notes: "",
            tags: [],
            paymentMethod: "",
            referenceNumber: "",
            autoGenerate: true,
            recurrence: "monthly",
            recurrenceInterval: 1,
          }
        );
    }
  }, [installment, open])

  // Lógica do installmentAmount removida, pois não existe no tipo Installment

  // CORREÇÃO: Função async para salvar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true);

    // Validação básica (pode adicionar mais)
    if (!formData.name || !formData.clientId || !formData.installmentCount || !formData.currentInstallment || !formData.dueDay || !formData.firstDueDate) {
        alert("Preencha todos os campos obrigatórios (*).");
        setLoading(false);
        return;
    }


    const installmentData: Installment = {
      id: installment?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description,
      clientId: formData.clientId!,
      taxId: formData.taxId || undefined, // Garantir que "" vira undefined
      installmentCount: Number(formData.installmentCount!), // Garantir que é número
      currentInstallment: Number(formData.currentInstallment!), // Garantir que é número
      dueDay: Number(formData.dueDay!), // Garantir que é número
      firstDueDate: formData.firstDueDate!,
      weekendRule: formData.weekendRule || 'postpone',
      status: formData.status || 'pending',
      priority: formData.priority || 'medium',
      assignedTo: formData.assignedTo || undefined,
      protocol: formData.protocol || undefined,
      realizationDate: formData.realizationDate, // Vem do tipo base
      notes: formData.notes,
      createdAt: installment?.createdAt || new Date().toISOString(),
      completedAt: formData.completedAt,
      completedBy: formData.completedBy,
      history: installment?.history || [], // Adicionar histórico aqui se necessário
      tags: formData.tags || [],
      paymentMethod: formData.paymentMethod || undefined,
      referenceNumber: formData.referenceNumber || undefined,
      autoGenerate: formData.autoGenerate === undefined ? true : formData.autoGenerate, // Default true
      recurrence: formData.recurrence || 'monthly',
      recurrenceInterval: formData.recurrenceInterval ? Number(formData.recurrenceInterval) : undefined,
       // Adicionar campos faltantes se houver no tipo Installment
    }

    try {
        await saveInstallment(installmentData)
        onSave() // Avisa a página pai para recarregar os dados
        onOpenChange(false) // Fecha o modal
    } catch (error) {
        console.error("[v0] Erro ao salvar parcelamento:", error);
        alert("Erro ao salvar parcelamento. Verifique o console.");
    } finally {
        setLoading(false);
    }
  }

  const priorityIcons = {
    low: <TrendingUp className="h-4 w-4" />,
    medium: <AlertCircle className="h-4 w-4" />,
    high: <Flame className="h-4 w-4" />,
    urgent: <Zap className="h-4 w-4" />,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installment ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
          <DialogDescription>Gerencie parcelamentos de impostos e obrigações fiscais</DialogDescription>
        </DialogHeader>
        {/* Formulário continua igual visualmente */}
         <form onSubmit={handleSubmit} className="space-y-6">
           {/* Informações Básicas */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Informações Básicas</h3>
             <div className="grid gap-4 md:grid-cols-2">
               <div className="space-y-2">
                 <Label htmlFor="name">Nome do Parcelamento *</Label>
                 <Input
                   id="name"
                   value={formData.name || ''}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="client">Cliente *</Label>
                 <Select
                   value={formData.clientId || ''}
                   onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                   required
                 >
                   <SelectTrigger>
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
             </div>

             <div className="space-y-2">
               <Label htmlFor="description">Descrição</Label>
               <Textarea
                 id="description"
                 value={formData.description || ''}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 rows={2}
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="tax">Imposto Relacionado</Label>
               <Select
                 value={formData.taxId || "none"} // Usa "none" para representar vazio no select
                 onValueChange={(value) => setFormData({ ...formData, taxId: value === "none" ? "" : value })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o imposto (opcional)" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Nenhum</SelectItem>
                   {taxes.map((tax) => (
                     <SelectItem key={tax.id} value={tax.id}>
                       {tax.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           {/* Controle de Parcelas */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Controle de Parcelas</h3>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="installmentCount">Quantidade de Parcelas *</Label>
                 <Input
                   id="installmentCount"
                   type="number"
                   min="1"
                   value={formData.installmentCount || 1}
                   onChange={(e) => setFormData({ ...formData, installmentCount: Number.parseInt(e.target.value) || 1 })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="currentInstallment">Parcela Atual *</Label>
                 <Input
                   id="currentInstallment"
                   type="number"
                   min="1"
                   max={formData.installmentCount}
                   value={formData.currentInstallment || 1}
                   onChange={(e) => setFormData({ ...formData, currentInstallment: Number.parseInt(e.target.value) || 1 })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                 <Input
                   id="paymentMethod"
                   value={formData.paymentMethod || ''}
                   onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                   placeholder="Ex: Boleto, Débito Automático"
                 />
               </div>
             </div>
           </div>

           {/* Recorrência Automática - REVISAR SE É NECESSÁRIO PARA PARCELAMENTO */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Recorrência (Avanço Automático)</h3>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="autoGenerate">Avançar Parcela Automaticamente</Label>
                 <Select
                   value={formData.autoGenerate ? "yes" : "no"}
                   onValueChange={(value) => setFormData({ ...formData, autoGenerate: value === "yes" })}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="yes">Sim</SelectItem>
                     <SelectItem value="no">Não</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
                {/* Campos de tipo de recorrência e intervalo podem não fazer sentido aqui,
                    já que o avanço é geralmente mensal baseado no firstDueDate.
                    Removidos para simplificar, mas podem ser readicionados se a lógica mudar. */}
             </div>
           </div>


           {/* Vencimentos */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Vencimentos</h3>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="firstDueDate">Data da Primeira Parcela *</Label>
                 <Input
                   id="firstDueDate"
                   type="date"
                   value={formData.firstDueDate || ''}
                   onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="dueDay">Dia de Vencimento Mensal *</Label>
                 <Input
                   id="dueDay"
                   type="number"
                   min="1"
                   max="31"
                   value={formData.dueDay || 10}
                   onChange={(e) => setFormData({ ...formData, dueDay: Number.parseInt(e.target.value) || 1 })}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="weekendRule">Regra de Final de Semana *</Label>
                 <Select
                   value={formData.weekendRule || 'postpone'}
                   onValueChange={(value: WeekendRule) => setFormData({ ...formData, weekendRule: value })}
                   required
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="postpone">Postergar (próximo dia útil)</SelectItem>
                     <SelectItem value="anticipate">Antecipar (dia útil anterior)</SelectItem>
                     <SelectItem value="keep">Manter (mesmo dia)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </div>

           {/* Gestão e Controle */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Gestão e Controle</h3>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="priority">Prioridade *</Label>
                 <Select
                   value={formData.priority || 'medium'}
                   onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}
                   required
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="low">
                       <div className="flex items-center gap-2">
                         {priorityIcons.low}
                         <span>Baixa</span>
                       </div>
                     </SelectItem>
                     <SelectItem value="medium">
                       <div className="flex items-center gap-2">
                         {priorityIcons.medium}
                         <span>Média</span>
                       </div>
                     </SelectItem>
                     <SelectItem value="high">
                       <div className="flex items-center gap-2">
                         {priorityIcons.high}
                         <span>Alta</span>
                       </div>
                     </SelectItem>
                     <SelectItem value="urgent">
                       <div className="flex items-center gap-2">
                         {priorityIcons.urgent}
                         <span>Urgente</span>
                       </div>
                     </SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="assignedTo">Responsável</Label>
                 <Input
                   id="assignedTo"
                   value={formData.assignedTo || ''}
                   onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                   placeholder="Nome do responsável"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="protocol">Protocolo/Número</Label>
                 <Input
                   id="protocol"
                   value={formData.protocol || ''}
                   onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                   placeholder="Número do protocolo"
                 />
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="referenceNumber">Número de Referência</Label>
               <Input
                 id="referenceNumber"
                 value={formData.referenceNumber || ''}
                 onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                 placeholder="Código de barras, linha digitável, etc."
               />
             </div>
           </div>

           {/* Informações Adicionais */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-foreground">Informações Adicionais</h3>
             <div className="space-y-2">
               <Label htmlFor="notes">Observações</Label>
               <Textarea
                 id="notes"
                 value={formData.notes || ''}
                 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                 rows={3}
                 placeholder="Observações adicionais sobre o parcelamento"
               />
             </div>
           </div>

           <div className="flex justify-end gap-2">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
               Cancelar
             </Button>
             <Button type="submit" disabled={loading}>
               {loading ? "Salvando..." : "Salvar"}
             </Button>
           </div>
         </form>
      </DialogContent>
    </Dialog>
  )
}
