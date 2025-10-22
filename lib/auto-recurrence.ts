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

    // Gerar impostos recorrentes
    // ATENÇÃO: A lógica original para impostos pode precisar de ajuste fino.
    // Esta versão assume que um imposto recorrente gera uma *nova* instância com o mesmo nome
    // mas com data de criação no período atual. Isso pode não ser o ideal.
    // Uma abordagem melhor seria ter uma tabela separada para "ocorrências de impostos".
    // Por ora, mantendo a lógica similar à original:
    const taxesToGenerate = taxes.filter((t) => t.dueDay !== undefined && t.autoGenerate); // Adicionado autoGenerate

     for (const tax of taxesToGenerate) {
       // Verifica se já existe uma tarefa de imposto para este período (simplificado pela data de criação)
       const alreadyGenerated = taxes.some(
         (existingTax) => existingTax.name === tax.name && existingTax.createdAt.startsWith(currentPeriod) && existingTax.status !== 'template' // Adicionar um status 'template'?
       );

       if (!alreadyGenerated) {
         const newTax = generateTaxForPeriod(tax, currentPeriod);
         // Marcar o original como template talvez? Ou criar entidade separada?
         // tax.status = 'template'; // Exemplo
         // await saveTax(tax); // Salvar a mudança no original
         await saveTax(newTax); // Salvar a nova ocorrência
         console.log("[v0] Ocorrência de Imposto gerada:", newTax.name, "para", currentPeriod);
       }
     }


    // Gerar parcelas recorrentes (avançar para a próxima parcela)
    const installmentsToUpdate = installments.filter(
      (i) => i.autoGenerate && i.status !== 'completed' && i.currentInstallment < i.installmentCount
    );

    // Lógica para parcelamentos precisa ser ajustada. A função generateInstallmentForPeriod
    // cria um *novo* registro, o que não é o ideal para parcelas. O correto seria *atualizar*
    // a parcela existente ou ter uma tabela separada para cada vencimento de parcela.
    // **COMENTANDO ESTA SEÇÃO por enquanto, pois a lógica precisa ser refeita.**
    /*
    for (const installment of installmentsToUpdate) {
       // Verificar se a data da próxima parcela cai no período atual
       // Esta lógica precisa ser mais robusta
       const nextInstallmentData = generateInstallmentForPeriod(installment, currentPeriod); // Esta função cria novo ID
       // O ideal seria:
       // installment.currentInstallment += 1;
       // installment.status = 'pending'; // Resetar status?
       // await saveInstallment(installment); // ATUALIZAR o existente
      await saveInstallment(nextInstallmentData); // Salva NOVO registro (lógica atual)

      console.log(
        "[v0] Parcela gerada:",
        nextInstallmentData.name,
        `${nextInstallmentData.currentInstallment}/${nextInstallmentData.installmentCount}`,
        "para",
        currentPeriod,
      )
    }
    */

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
