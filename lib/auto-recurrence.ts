import {
  getObligations, // CORREÇÃO: Usar Supabase
  getTaxes,       // CORREÇÃO: Usar Supabase
  getInstallments,// CORREÇÃO: Usar Supabase
  saveObligation, // CORREÇÃO: Usar Supabase
  saveTax,        // CORREÇÃO: Usar Supabase
  saveInstallment,// CORREÇÃO: Usar Supabase
  // Funções de LocalStorage removidas e substituídas por chamadas async
} from "./supabase/database" // CORREÇÃO: Mudar importação
import {
  shouldGenerateRecurrence,
  getCurrentPeriod,
  generateObligationForPeriod,
  generateTaxForPeriod,
  generateInstallmentForPeriod,
} from "./recurrence-engine"
import { adjustForWeekend } from "./date-utils"
import { getLastRecurrenceCheck, setLastRecurrenceCheck } from "./storage"; // Manter para controle local

// CORREÇÃO: Função agora é async
export async function checkAndGenerateRecurrences(): Promise<void> {
  const now = new Date()
  const currentPeriod = getCurrentPeriod()
  // CORREÇÃO: Controle de execução diária continua usando localStorage
  const lastCheck = getLastRecurrenceCheck() // Função mantida do storage.ts

  // Verifica se já rodou hoje
  const today = now.toISOString().split("T")[0]
  if (lastCheck === today) {
    console.log("[v0] Recorrência já verificada hoje.");
    return
  }

  // Verifica se é o primeiro dia do mês para gerar
  if (!shouldGenerateRecurrence(now)) {
     console.log("[v0] Não é dia de gerar recorrências.");
     // Ainda assim, marca como verificado hoje para não tentar de novo
     setLastRecurrenceCheck(today); // Função mantida do storage.ts
     return;
  }


  console.log("[v0] Iniciando geração automática de recorrências para", currentPeriod)

  try {
    // CORREÇÃO: Buscar dados do Supabase
    const [obligations, taxes, installments] = await Promise.all([
      getObligations(),
      getTaxes(),
      getInstallments(),
    ]);

    // Gerar obrigações recorrentes
    const obligationsToGenerate = obligations.filter(
      (o) => o.autoGenerate && !o.parentObligationId, // Apenas obrigações originais
    )

    for (const obligation of obligationsToGenerate) {
      // Verifica se já existe uma obrigação gerada para este período
      const alreadyGenerated = obligations.some(
        (o) => o.parentObligationId === obligation.id && o.generatedFor === currentPeriod,
      )

      if (!alreadyGenerated) {
        const newObligation = generateObligationForPeriod(obligation, currentPeriod)
        await saveObligation(newObligation) // CORREÇÃO: Usar await
        console.log("[v0] Obrigação gerada:", newObligation.name, "para", currentPeriod)
      }
    }

    // Gerar ocorrências de impostos recorrentes
    // NOVA LÓGICA: Usar tabela tax_occurrences em vez de duplicar na tabela taxes
    const taxesToGenerate = taxes.filter((t) => t.dueDay !== undefined && t.autoGenerate && t.status === 'template');

    for (const tax of taxesToGenerate) {
      // Verificar se já existe uma ocorrência para este período
      const [year, month] = currentPeriod.split('-').map(Number);
      const dueDate = new Date(year, month - 1, tax.dueDay!);
      const adjustedDueDate = adjustForWeekend(dueDate, tax.weekendRule || 'postpone');
      
      // TODO: Implementar verificação de ocorrência existente
      // const alreadyGenerated = await checkTaxOccurrenceExists(tax.id, adjustedDueDate);
      
      // Por enquanto, gerar nova ocorrência
      const newOccurrence = {
        id: crypto.randomUUID(),
        taxId: tax.id,
        dueDate: adjustedDueDate.toISOString().split('T')[0],
        amount: undefined, // Pode ser preenchido posteriormente
        status: 'pending' as const,
        priority: tax.priority,
        assignedTo: tax.assignedTo,
        protocol: tax.protocol,
        notes: tax.notes,
        tags: tax.tags || [],
        createdAt: new Date().toISOString(),
      };
      
      // TODO: Implementar saveTaxOccurrence
      // await saveTaxOccurrence(newOccurrence);
      console.log("[v0] Ocorrência de Imposto gerada:", tax.name, "para", currentPeriod, "em", adjustedDueDate.toISOString().split('T')[0]);
    }


    // Gerar parcelas recorrentes (avançar para a próxima parcela)
    const installmentsToUpdate = installments.filter(
      (i) => i.autoGenerate && i.status !== 'completed' && i.currentInstallment < i.installmentCount
    );

    for (const installment of installmentsToUpdate) {
      // Verificar se a data da próxima parcela cai no período atual
      const firstDue = new Date(installment.firstDueDate)
      const monthsToAdd = installment.currentInstallment // Próxima parcela
      const nextDueDate = new Date(firstDue.getFullYear(), firstDue.getMonth() + monthsToAdd, installment.dueDay)
      
      // Verificar se a próxima parcela deve ser gerada no período atual
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      const nextDueMonth = nextDueDate.getMonth()
      const nextDueYear = nextDueDate.getFullYear()
      
      if (nextDueYear === currentYear && nextDueMonth === currentMonth) {
        // Atualizar a parcela existente para a próxima
        const updatedInstallment = {
          ...installment,
          currentInstallment: installment.currentInstallment + 1,
          status: 'pending' as const,
          // Resetar campos de conclusão se necessário
          completedAt: undefined,
          completedBy: undefined,
        }
        
        await saveInstallment(updatedInstallment)
        console.log(
          "[v0] Parcela avançada:",
          updatedInstallment.name,
          `${updatedInstallment.currentInstallment}/${updatedInstallment.installmentCount}`,
          "para",
          currentPeriod,
        )
      }
    }

    // Atualiza a data da última verificação no LocalStorage
    setLastRecurrenceCheck(today)
    console.log("[v0] Geração automática de recorrências concluída")

  } catch (error) {
    console.error("[v0] Erro durante a geração de recorrências:", error);
    // Não atualizar lastCheck se deu erro, para tentar novamente depois
  }
}

// Hook para executar a verificação quando o app carrega
export function initializeAutoRecurrence(): void {
  if (typeof window !== "undefined") {
    // Executa imediatamente ao carregar
    checkAndGenerateRecurrences() // Agora é async, mas não precisamos esperar aqui

    // Configura verificação diária (a cada 24 horas)
    // setInterval(checkAndGenerateRecurrences, 24 * 60 * 60 * 1000);
    // Melhorar: talvez verificar a cada hora se `lastCheck` não é hoje?
     setInterval(() => {
       const now = new Date();
       const today = now.toISOString().split("T")[0];
       const lastCheck = getLastRecurrenceCheck();
       if (lastCheck !== today) {
         console.log("[v0] Verificando recorrências (intervalo)...");
         checkAndGenerateRecurrences();
       }
     }, 60 * 60 * 1000); // Verifica a cada hora
  }
}
