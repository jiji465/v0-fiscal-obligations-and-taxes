import type { WeekendRule } from "./types"

export const isWeekend = (date: Date): boolean => {
  // Verifica se a data é válida antes de pegar o dia
  if (!date || isNaN(date.getTime())) return false;
  const day = date.getDay()
  return day === 0 || day === 6
}

export const adjustForWeekend = (date: Date, rule: WeekendRule): Date => {
  // Retorna a data original se for inválida
  if (!date || isNaN(date.getTime())) return date;

  if (!isWeekend(date)) return date

  const adjusted = new Date(date)

  if (rule === "anticipate") {
    // Move para o dia útil anterior
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1)
    }
  } else if (rule === "postpone") {
    // Move para o próximo dia útil
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() + 1)
    }
  }
  // 'keep' não muda a data

  return adjusted
}

export const calculateDueDate = (
  dueDay: number,
  dueMonth: number | undefined,
  frequency: string | undefined, // Permite undefined
  weekendRule: WeekendRule | undefined, // Permite undefined
  referenceDate: Date = new Date(),
): Date => {
  // Define padrões se valores críticos forem nulos/inválidos
  const validDueDay = (dueDay >= 1 && dueDay <= 31) ? dueDay : 1; // Padrão dia 1
  const validRule = weekendRule ?? "postpone"; // Padrão postpone
  const validFrequency = frequency ?? "monthly"; // Padrão monthly

  let dueDate: Date;

  // Lógica de cálculo (adaptada para usar valores válidos)
  try {
    if (validFrequency === "annual" && dueMonth && dueMonth >= 1 && dueMonth <= 12) {
      dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, validDueDay);
      // Ajuste para o próximo ano se a data já passou
      const checkDate = new Date(referenceDate); // Cria cópia para não modificar original
      checkDate.setHours(0,0,0,0);
      if (dueDate < checkDate) {
        dueDate.setFullYear(dueDate.getFullYear() + 1);
      }
    } else if (validFrequency === "quarterly" && dueMonth && dueMonth >= 1 && dueMonth <= 12) {
      dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, validDueDay);
      const checkDate = new Date(referenceDate);
      checkDate.setHours(0,0,0,0);
      while (dueDate < checkDate) {
        dueDate.setMonth(dueDate.getMonth() + 3);
      }
    } else { // Mensal ou Padrão
      dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), validDueDay);
      const checkDate = new Date(referenceDate);
      checkDate.setHours(0,0,0,0);
       // Ajusta o mês apenas se a data calculada for estritamente menor que hoje
       // (Ex: Se hoje é dia 15 e dueDay é 10, calcula para o próximo mês)
       // (Ex: Se hoje é dia 5 e dueDay é 10, calcula para este mês)
      if (dueDate.getDate() < checkDate.getDate() && dueDate.getMonth() === checkDate.getMonth() && dueDate.getFullYear() === checkDate.getFullYear()) {
         dueDate.setMonth(dueDate.getMonth() + 1);
      } else if (dueDate < checkDate){ // Se já passou por outros motivos (mês/ano)
         dueDate.setMonth(dueDate.getMonth() + 1);
      }

    }

    // Garante que a data criada é válida antes de ajustar
    if (isNaN(dueDate.getTime())) {
       console.error("calculateDueDate gerou uma data inválida com:", { dueDay, dueMonth, frequency, referenceDate });
       return new Date(); // Retorna data atual como fallback
    }

  } catch (error) {
     console.error("Erro em calculateDueDate:", error);
     return new Date(); // Retorna data atual em caso de erro inesperado
  }


  return adjustForWeekend(dueDate, validRule);
}


// --- Função formatDate Corrigida ---
export const formatDate = (date: string | Date | undefined | null): string => {
  // 1. Verifica se a entrada é nula, indefinida ou vazia
  if (date === null || date === undefined || date === '') {
    return "-"; // Ou string vazia '', dependendo da sua preferência
  }

  try {
    // 2. Tenta criar o objeto Date
    const d = typeof date === "string" ? new Date(date) : date;

    // 3. Verifica se o objeto Date resultante é válido
    if (d instanceof Date && !isNaN(d.getTime())) {
      // 4. Formata apenas se for válido
      return d.toLocaleDateString("pt-BR", {
          // Adiciona timezone para consistência, se necessário
          // timeZone: "America/Sao_Paulo" // Exemplo
      });
    } else {
      // 5. Retorna placeholder se a data for inválida
      console.warn("formatDate recebeu uma data inválida:", date);
      return "-";
    }
  } catch (error) {
    // 6. Captura outros erros inesperados durante a conversão/formatação
    console.error("Erro ao formatar data:", date, error);
    return "-";
  }
}


export const formatCurrency = (value: number | undefined | null): string => {
  // Verifica se o valor é numérico
  if (typeof value !== 'number' || isNaN(value)) {
      return "-"; // Ou "R$ 0,00" se preferir
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export const isOverdue = (dueDate: string | undefined | null): boolean => {
  // Verifica se dueDate é válido antes de comparar
  if (!dueDate) return false;
  try {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) return false; // Data inválida não está atrasada

      const today = new Date();
      // Compara apenas a data, ignorando a hora
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);

      return due < today;
  } catch (e) {
      console.error("Erro ao verificar isOverdue:", dueDate, e);
      return false; // Assume que não está atrasado em caso de erro
  }
}


export const isUpcomingThisWeek = (dueDate: string | undefined | null): boolean => {
   // Verifica se dueDate é válido
  if (!dueDate) return false;
  try {
      const due = new Date(dueDate);
       if (isNaN(due.getTime())) return false; // Data inválida

      const today = new Date()
      const weekFromNow = new Date()
      weekFromNow.setDate(today.getDate() + 7)

      // Compara apenas a data
      today.setHours(0, 0, 0, 0);
      weekFromNow.setHours(23, 59, 59, 999); // Inclui todo o último dia da semana
      due.setHours(0,0,0,0); // Normaliza a data de vencimento

      return due >= today && due <= weekFromNow
  } catch(e) {
      console.error("Erro ao verificar isUpcomingThisWeek:", dueDate, e);
      return false;
  }
}
