"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" // Adicionado DialogFooter
// Removido getClients, getTaxes, saveInstallment de storage, usaremos Supabase
import { getClients as getClientsFromDb, getTaxes as getTaxesFromDb, saveInstallment } from "@/lib/supabase/database" // Importa do Supabase
import type { Installment, Client, Tax, WeekendRule, Priority, RecurrenceType } from "@/lib/types"
import { AlertCircle, Flame, TrendingUp, Zap } from "lucide-react"

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


interface InstallmentFormProps {
  installment?: Installment // Recebe Installment base
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void // Apenas notifica que salvou
}

export function InstallmentForm({ installment, open, onOpenChange, onSave }: InstallmentFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  // Estado para o valor total (opcional)
  const [totalAmount, setTotalAmount] = useState<number | undefined>(undefined);
  // Estado para o valor da parcela (calculado ou manual)
  const [installmentAmount, setInstallmentAmount] = useState<number | undefined>(undefined);


  const [formData, setFormData] = useState<Partial<Installment>>({
    name: "",
    description: "",
    clientId: "",
    taxId: "",
    installmentCount: 1,
    currentInstallment: 1,
    dueDay: 10,
    firstDueDate: "", // Mantém como string YYYY-MM-DD
    weekendRule: "postpone",
    status: "pending",
    priority: "medium",
    assignedTo: "",
    protocol: "",
    notes: "",
    tags: [],
    paymentMethod: "",
    referenceNumber: "",
    autoGenerate: true, // Padrão pode ser true
    recurrence: "monthly",
    recurrenceInterval: 1,
  })

  // Busca clientes e impostos do Supabase ao montar
 useEffect(() => {
    const fetchData = async () => {
        try {
            const [clientsData, taxesData] = await Promise.all([
                getClientsFromDb(),
                getTaxesFromDb(),
            ]);
            setClients(clientsData);
            setTaxes(taxesData);
        } catch (error) {
            console.error("Erro ao buscar dados para formulário de parcelamento:", error);
            // Opcional: Mostrar erro ao usuário
        }
    };
    if (open) { // Busca apenas quando o modal abre
        fetchData();
    }
  }, [open]); // Depende de 'open'

  // Preenche o formulário quando 'installment' (para edição) ou 'open' (para reset) mudar
  useEffect(() => {
    if (open) {
        if (installment) {
            setFormData({
                ...installment,
                // Garante que firstDueDate esteja no formato YYYY-MM-DD
                firstDueDate: formatDateForInput(installment.firstDueDate),
            });
             // Tenta extrair valores numéricos se existirem (ex: de um campo de texto 'amount')
             setInstallmentAmount(installment.installmentAmount); // Assume que installmentAmount existe no tipo
             // Não temos 'totalAmount' no tipo Installment, então não preenchemos
             setTotalAmount(undefined);
        } else {
            // Reset para novo parcelamento
            setFormData({
                name: "", description: "", clientId: "", taxId: "",
                installmentCount: 1, currentInstallment: 1, dueDay: 10,
                firstDueDate: formatDateForInput(new Date()), // Define data atual como padrão
                weekendRule: "postpone", status: "pending", priority: "medium",
                assignedTo: "", protocol: "", notes: "", tags: [],
                paymentMethod: "", referenceNumber: "",
                autoGenerate: true, recurrence: "monthly", recurrenceInterval: 1,
            });
            setTotalAmount(undefined);
            setInstallmentAmount(undefined);
        }
    }
  }, [installment, open]);

  // Efeito para auto-calcular valor da parcela
  useEffect(() => {
    if (totalAmount !== undefined && formData.installmentCount && formData.installmentCount > 0) {
      const amount = totalAmount / formData.installmentCount;
      setInstallmentAmount(Number(amount.toFixed(2))); // Atualiza estado do valor da parcela
    } else if (totalAmount === undefined) {
        // Se o total for apagado, permite que o valor da parcela seja editado manualmente (não reseta)
    }
  }, [totalAmount, formData.installmentCount]);

  const handleSubmit = async (e: React.FormEvent) => { // Marca como async
    e.preventDefault()

    // Validar se firstDueDate e dueDay são válidos
    if (!formData.firstDueDate) {
        alert("Por favor, informe a data do primeiro vencimento.");
        return;
    }
     if (!formData.dueDay || formData.dueDay < 1 || formData.dueDay > 31) {
        alert("Por favor, informe um dia de vencimento válido (1-31).");
        return;
    }
     if (!formData.installmentCount || formData.installmentCount < 1) {
        alert("Por favor, informe uma quantidade de parcelas válida (mínimo 1).");
        return;
    }
     if (!installmentAmount || installmentAmount <= 0) {
        alert("Por favor, informe um valor de parcela válido.");
        return;
    }


    const installmentData: Installment = {
      id: installment?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description || undefined, // Usa undefined se vazio
      clientId: formData.clientId!,
      taxId: formData.taxId === "none" ? undefined : formData.taxId, // Converte "none" para undefined
      installmentCount: formData.installmentCount!,
      currentInstallment: formData.currentInstallment || 1, // Garante valor inicial
      installmentAmount: installmentAmount!, // Usa o valor do estado separado
      // totalAmount: totalAmount, // Não salva o totalAmount no banco, só o da parcela
      dueDay: formData.dueDay!,
      firstDueDate: formData.firstDueDate!, // Já está como YYYY-MM-DD
      weekendRule: formData.weekendRule!,
      status: formData.status!,
      priority: formData.priority!,
      assignedTo: formData.assignedTo || undefined,
      protocol: formData.protocol || undefined,
      realizationDate: formData.realizationDate || undefined, // Usa undefined
      notes: formData.notes || undefined, // Usa undefined
      createdAt: installment?.createdAt || new Date().toISOString(),
      completedAt: formData.completedAt,
      completedBy: formData.completedBy,
      history: installment?.history || [],
      tags: formData.tags || [],
      paymentMethod: formData.paymentMethod || undefined,
      referenceNumber: formData.referenceNumber || undefined,
      autoGenerate: formData.autoGenerate === undefined ? true : formData.autoGenerate, // Padrão true
      recurrence: formData.recurrence!,
      recurrenceInterval: formData.recurrence === 'custom' ? formData.recurrenceInterval : undefined, // Só salva se for custom
    }

    try {
        await saveInstallment(installmentData) // Salva no Supabase
        onSave() // Notifica a página pai para recarregar os dados
        onOpenChange(false) // Fecha o modal
    } catch (error) {
         console.error("Erro ao salvar parcelamento:", error)
         alert("Ocorreu um erro ao salvar o parcelamento. Verifique o console.")
    }

  }

  const priorityIcons: { [key in Priority]: React.ReactNode } = { // Tipagem mais forte
    low: <TrendingUp className="h-4 w-4 text-blue-500" />,
    medium: <AlertCircle className="h-4 w-4 text-yellow-500" />,
    high: <Flame className="h-4 w-4 text-orange-500" />,
    urgent: <Zap className="h-4 w-4 text-red-500" />,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installment ? "Editar Parcelamento" : "Novo Parcelamento"}</DialogTitle>
          <DialogDescription>Gerencie parcelamentos de impostos e obrigações fiscais</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4 pb-6">
          {/* Informações Básicas */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Parcelamento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                  required
                >
                  <SelectTrigger id="client">
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
              <Label htmlFor="tax">Imposto Relacionado (Opcional)</Label>
              <Select
                value={formData.taxId || "none"}
                onValueChange={(value) => setFormData({ ...formData, taxId: value === "none" ? "" : value })}
              >
                <SelectTrigger id="tax">
                  <SelectValue placeholder="Selecione o imposto" />
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
          </section>

          {/* Valores e Parcelas */}
           <section className="space-y-4 border-t pt-4">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valores e Parcelas</h3>
             <div className="grid gap-4 md:grid-cols-3">
               <div className="space-y-2">
                 <Label htmlFor="totalAmount">Valor Total (Opcional)</Label>
                 <Input
                   id="totalAmount"
                   type="number"
                   step="0.01"
                   min="0"
                   value={totalAmount === undefined ? "" : totalAmount}
                   onChange={(e) => setTotalAmount(e.target.value === "" ? undefined : Number(e.target.value))}
                   placeholder="0,00"
                 />
                  <p className="text-xs text-muted-foreground">Preencha para calcular a parcela.</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="installmentAmount">Valor da Parcela *</Label>
                 <Input
                   id="installmentAmount"
                   type="number"
                   step="0.01"
                   min="0.01" // Valor mínimo
                   value={installmentAmount === undefined ? "" : installmentAmount}
                   onChange={(e) => {
                       setInstallmentAmount(e.target.value === "" ? undefined : Number(e.target.value));
                       // Se o valor da parcela for editado manualmente, limpa o valor total
                       setTotalAmount(undefined);
                   }}
                   placeholder="0,00"
                   required
                 />
               </div>
                <div className="space-y-2">
                    <Label htmlFor="installmentCount">Quantidade de Parcelas *</Label>
                    <Input
                    id="installmentCount"
                    type="number"
                    min="1"
                    value={formData.installmentCount || ''}
                    onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value ? Number.parseInt(e.target.value) : 1 })}
                    required
                    />
                </div>
             </div>
              <div className="grid gap-4 md:grid-cols-3">
                 <div className="space-y-2">
                    <Label htmlFor="currentInstallment">Parcela Atual *</Label>
                    <Input
                    id="currentInstallment"
                    type="number"
                    min="1"
                    max={formData.installmentCount} // Define o máximo
                    value={formData.currentInstallment || ''}
                    onChange={(e) => setFormData({ ...formData, currentInstallment: e.target.value ? Number.parseInt(e.target.value) : 1 })}
                    required
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                    <Input
                    id="paymentMethod"
                    value={formData.paymentMethod || ''}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="Ex: Boleto, Débito"
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="referenceNumber">Número de Referência</Label>
                    <Input
                        id="referenceNumber"
                        value={formData.referenceNumber || ''}
                        onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                        placeholder="Código de barras, ID, etc."
                    />
                </div>
              </div>
           </section>


          {/* Vencimentos */}
          <section className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vencimentos</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {/* --- Campo firstDueDate (já type="date") --- */}
              <div className="space-y-2">
                <Label htmlFor="firstDueDate">Primeiro Vencimento *</Label>
                <Input
                  id="firstDueDate"
                  type="date"
                  value={formData.firstDueDate} // Já deve estar como YYYY-MM-DD
                  onChange={(e) => setFormData({ ...formData, firstDueDate: e.target.value })}
                  required
                />
              </div>
               {/* --- Campo dueDay (mantido para cálculo das próximas) --- */}
              <div className="space-y-2">
                <Label htmlFor="dueDay">Dia de Vencimento (Próximas) *</Label>
                <Input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dueDay || ''}
                  onChange={(e) => setFormData({ ...formData, dueDay: e.target.value ? Number.parseInt(e.target.value) : undefined })}
                  required
                />
                 <p className="text-xs text-muted-foreground">Dia do mês para parcelas futuras.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekendRule">Regra de Final de Semana *</Label>
                <Select
                  value={formData.weekendRule}
                  onValueChange={(value: WeekendRule) => setFormData({ ...formData, weekendRule: value })}
                  required
                >
                  <SelectTrigger id="weekendRule">
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
          </section>

          {/* Gestão e Controle */}
          <section className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Gestão e Controle</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger id="priority" className="w-full">
                    <div className="flex items-center gap-2">
                       {priorityIcons[formData.priority || 'medium']}
                       <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">{priorityIcons.low}<span>Baixa</span></div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">{priorityIcons.medium}<span>Média</span></div>
                    </SelectItem>
                    <SelectItem value="high">
                     <div className="flex items-center gap-2">{priorityIcons.high}<span>Alta</span></div>
                    </SelectItem>
                    <SelectItem value="urgent">
                     <div className="flex items-center gap-2">{priorityIcons.urgent}<span>Urgente</span></div>
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
               {/* Status não é editável diretamente aqui, é calculado */}
            </div>
          </section>

          {/* Informações Adicionais */}
          <section className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações Adicionais</h3>
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
             {/* Tags (Opcional, pode remover se não usar) */}
             {/* <div className="grid gap-2"> ... Lógica de Tags ... </div> */}
          </section>

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
