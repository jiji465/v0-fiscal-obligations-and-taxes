import { getTaxes, saveTax, getObligations, saveObligation, getInstallments, saveInstallment } from './supabase-storage'
import { calculateNextDueDate, adjustForWeekend } from './date-utils'
import type { Tax, Obligation, Installment, RecurrenceType } from './types'

/**
 * Gera automaticamente registros recorrentes para impostos, obrigações e parcelamentos
 * Este job deve ser executado no dia 1 de cada mês
 */
export async function generateRecurringRecords() {
  console.log('Iniciando geração automática de registros recorrentes...')
  
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  const periodKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  
  try {
    // Gerar impostos recorrentes
    await generateRecurringTaxes(periodKey)
    
    // Gerar obrigações recorrentes
    await generateRecurringObligations(periodKey)
    
    // Gerar parcelamentos recorrentes
    await generateRecurringInstallments(periodKey)
    
    console.log('Geração automática concluída com sucesso!')
    return { success: true, period: periodKey }
  } catch (error) {
    console.error('Erro na geração automática:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

/**
 * Gera impostos recorrentes
 */
async function generateRecurringTaxes(periodKey: string) {
  const taxes = await getTaxes()
  const recurringTaxes = taxes.filter(tax => tax.autoGenerate)
  
  console.log(`Encontrados ${recurringTaxes.length} impostos para geração automática`)
  
  for (const tax of recurringTaxes) {
    // Verificar se já foi gerado para este período
    const existingTaxes = await getTaxes()
    const alreadyGenerated = existingTaxes.some(t => 
      t.parentTaxId === tax.id && t.generatedFor === periodKey
    )
    
    if (alreadyGenerated) {
      console.log(`Imposto ${tax.name} já foi gerado para ${periodKey}`)
      continue
    }
    
    // Verificar se deve gerar baseado na data final
    if (tax.recurrenceEndDate && new Date(tax.recurrenceEndDate) < new Date()) {
      console.log(`Imposto ${tax.name} passou da data final de recorrência`)
      continue
    }
    
    // Calcular próxima data de vencimento
    const nextDueDate = calculateNextDueDateForTax(tax)
    const adjustedDueDate = adjustForWeekend(nextDueDate, tax.weekendRule)
    
    // Criar novo imposto
    const newTax: Tax = {
      ...tax,
      id: crypto.randomUUID(),
      parentTaxId: tax.id,
      generatedFor: periodKey,
      status: 'pending',
      completedAt: undefined,
      completedBy: undefined,
      realizationDate: undefined,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: crypto.randomUUID(),
          action: 'created',
          description: `Imposto gerado automaticamente para ${periodKey}`,
          timestamp: new Date().toISOString(),
        }
      ]
    }
    
    await saveTax(newTax)
    console.log(`Imposto ${tax.name} gerado para ${periodKey}`)
  }
}

/**
 * Gera obrigações recorrentes
 */
async function generateRecurringObligations(periodKey: string) {
  const obligations = await getObligations()
  const recurringObligations = obligations.filter(obligation => obligation.autoGenerate)
  
  console.log(`Encontradas ${recurringObligations.length} obrigações para geração automática`)
  
  for (const obligation of recurringObligations) {
    // Verificar se já foi gerada para este período
    const existingObligations = await getObligations()
    const alreadyGenerated = existingObligations.some(o => 
      o.parentObligationId === obligation.id && o.generatedFor === periodKey
    )
    
    if (alreadyGenerated) {
      console.log(`Obrigação ${obligation.name} já foi gerada para ${periodKey}`)
      continue
    }
    
    // Verificar se deve gerar baseado na data final
    if (obligation.recurrenceEndDate && new Date(obligation.recurrenceEndDate) < new Date()) {
      console.log(`Obrigação ${obligation.name} passou da data final de recorrência`)
      continue
    }
    
    // Calcular próxima data de vencimento
    const nextDueDate = calculateNextDueDate(obligation)
    const adjustedDueDate = adjustForWeekend(nextDueDate, obligation.weekendRule)
    
    // Criar nova obrigação
    const newObligation: Obligation = {
      ...obligation,
      id: crypto.randomUUID(),
      parentObligationId: obligation.id,
      generatedFor: periodKey,
      status: 'pending',
      completedAt: undefined,
      completedBy: undefined,
      realizationDate: undefined,
      createdAt: new Date().toISOString(),
      history: [
        {
          id: crypto.randomUUID(),
          action: 'created',
          description: `Obrigação gerada automaticamente para ${periodKey}`,
          timestamp: new Date().toISOString(),
        }
      ]
    }
    
    await saveObligation(newObligation)
    console.log(`Obrigação ${obligation.name} gerada para ${periodKey}`)
  }
}

/**
 * Gera parcelamentos recorrentes
 */
async function generateRecurringInstallments(periodKey: string) {
  const installments = await getInstallments()
  const recurringInstallments = installments.filter(installment => installment.autoGenerate)
  
  console.log(`Encontrados ${recurringInstallments.length} parcelamentos para geração automática`)
  
  for (const installment of recurringInstallments) {
    // Verificar se já foi gerado para este período
    const existingInstallments = await getInstallments()
    const alreadyGenerated = existingInstallments.some(i => 
      i.parentInstallmentId === installment.id && i.generatedFor === periodKey
    )
    
    if (alreadyGenerated) {
      console.log(`Parcelamento ${installment.description} já foi gerado para ${periodKey}`)
      continue
    }
    
    // Verificar se deve gerar baseado na data final
    if (installment.recurrenceEndDate && new Date(installment.recurrenceEndDate) < new Date()) {
      console.log(`Parcelamento ${installment.description} passou da data final de recorrência`)
      continue
    }
    
    // Calcular próxima data de vencimento
    const nextDueDate = calculateNextDueDateForInstallment(installment)
    const adjustedDueDate = adjustForWeekend(nextDueDate, installment.weekendRule)
    
    // Criar novo parcelamento
    const newInstallment: Installment = {
      ...installment,
      id: crypto.randomUUID(),
      parentInstallmentId: installment.id,
      generatedFor: periodKey,
      status: 'pending',
      completedAt: undefined,
      completedBy: undefined,
      createdAt: new Date().toISOString(),
    }
    
    await saveInstallment(newInstallment)
    console.log(`Parcelamento ${installment.description} gerado para ${periodKey}`)
  }
}

/**
 * Calcula a próxima data de vencimento para um imposto
 */
function calculateNextDueDateForTax(tax: Tax): Date {
  const currentDate = new Date()
  const nextDate = new Date(currentDate)

  switch (tax.recurrenceType) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (tax.recurrenceInterval || 1))
      break
    case 'bimonthly':
      nextDate.setMonth(nextDate.getMonth() + 2)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'semiannual':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'custom':
      if (tax.recurrenceInterval) {
        nextDate.setMonth(nextDate.getMonth() + tax.recurrenceInterval)
      }
      break
  }

  // Ajusta para o dia correto do mês
  nextDate.setDate(tax.dueDay)

  // Se tem mês específico, ajusta
  if (tax.dueMonth) {
    nextDate.setMonth(tax.dueMonth - 1)
  }

  return nextDate
}

/**
 * Calcula a próxima data de vencimento para um parcelamento
 */
function calculateNextDueDateForInstallment(installment: Installment): Date {
  const currentDate = new Date()
  const nextDate = new Date(currentDate)

  switch (installment.recurrenceType) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + (installment.recurrenceInterval || 1))
      break
    case 'bimonthly':
      nextDate.setMonth(nextDate.getMonth() + 2)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'semiannual':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    case 'custom':
      if (installment.recurrenceInterval) {
        nextDate.setMonth(nextDate.getMonth() + installment.recurrenceInterval)
      }
      break
  }

  return nextDate
}
