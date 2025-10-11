import { supabase } from "./supabase"
import type { Tax, Obligation, Installment, RecurrenceType } from "./types"
import { calculateDueDate } from "./date-utils"

export interface RecurrenceResult {
  taxesGenerated: number
  obligationsGenerated: number
  installmentsGenerated: number
  errors: string[]
}

export async function generateRecurringItems(force: boolean = false): Promise<RecurrenceResult> {
  const result: RecurrenceResult = {
    taxesGenerated: 0,
    obligationsGenerated: 0,
    installmentsGenerated: 0,
    errors: []
  }

  try {
    // Gerar impostos recorrentes
    result.taxesGenerated = await generateRecurringTaxes(force)
  } catch (error) {
    result.errors.push(`Erro ao gerar impostos: ${error}`)
  }

  try {
    // Gerar obrigações recorrentes
    result.obligationsGenerated = await generateRecurringObligations(force)
  } catch (error) {
    result.errors.push(`Erro ao gerar obrigações: ${error}`)
  }

  try {
    // Gerar parcelamentos recorrentes
    result.installmentsGenerated = await generateRecurringInstallments(force)
  } catch (error) {
    result.errors.push(`Erro ao gerar parcelamentos: ${error}`)
  }

  return result
}

async function generateRecurringTaxes(force: boolean): Promise<number> {
  const currentDate = new Date()
  const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  
  // Buscar impostos com auto_generate = true
  const { data: taxes, error } = await supabase
    .from('taxes')
    .select('*')
    .eq('auto_generate', true)
    .is('parent_tax_id', null) // Apenas impostos originais, não gerados

  if (error) throw error

  let generated = 0

  for (const tax of taxes || []) {
    try {
      // Verificar se já foi gerado para este período
      if (!force) {
        const { data: existing } = await supabase
          .from('taxes')
          .select('id')
          .eq('parent_tax_id', tax.id)
          .eq('generated_for', currentPeriod)
          .single()

        if (existing) continue
      }

      // Verificar se deve gerar baseado no tipo de recorrência
      if (!shouldGenerateForPeriod(tax.recurrence_type, tax.recurrence_interval, currentDate)) {
        continue
      }

      // Calcular próxima data de vencimento
      const nextDueDate = getNextDueDate(tax.recurrence_type, tax.recurrence_interval, currentDate)
      const calculatedDueDate = calculateDueDate(
        tax.due_day,
        tax.due_month,
        nextDueDate,
        tax.weekend_rule
      )

      // Criar novo imposto
      const { error: insertError } = await supabase
        .from('taxes')
        .insert({
          client_id: tax.client_id,
          name: tax.name,
          description: tax.description,
          federal_tax_code: tax.federal_tax_code,
          due_day: tax.due_day,
          due_month: tax.due_month,
          frequency: tax.frequency,
          recurrence_type: tax.recurrence_type,
          recurrence_interval: tax.recurrence_interval,
          recurrence_end_date: tax.recurrence_end_date,
          auto_generate: tax.auto_generate,
          weekend_rule: tax.weekend_rule,
          amount: tax.amount,
          status: 'pending',
          priority: tax.priority,
          assigned_to: tax.assigned_to,
          protocol: null,
          realization_date: null,
          notes: tax.notes,
          parent_tax_id: tax.id,
          generated_for: currentPeriod,
          tags: tax.tags
        })

      if (insertError) throw insertError
      generated++
    } catch (error) {
      console.error(`Erro ao gerar imposto ${tax.name}:`, error)
    }
  }

  return generated
}

async function generateRecurringObligations(force: boolean): Promise<number> {
  const currentDate = new Date()
  const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  
  // Buscar obrigações com auto_generate = true
  const { data: obligations, error } = await supabase
    .from('obligations')
    .select('*')
    .eq('auto_generate', true)
    .is('parent_obligation_id', null) // Apenas obrigações originais

  if (error) throw error

  let generated = 0

  for (const obligation of obligations || []) {
    try {
      // Verificar se já foi gerado para este período
      if (!force) {
        const { data: existing } = await supabase
          .from('obligations')
          .select('id')
          .eq('parent_obligation_id', obligation.id)
          .eq('generated_for', currentPeriod)
          .single()

        if (existing) continue
      }

      // Verificar se deve gerar baseado no tipo de recorrência
      if (!shouldGenerateForPeriod(obligation.recurrence_type, obligation.recurrence_interval, currentDate)) {
        continue
      }

      // Criar nova obrigação
      const { error: insertError } = await supabase
        .from('obligations')
        .insert({
          client_id: obligation.client_id,
          tax_id: obligation.tax_id,
          name: obligation.name,
          description: obligation.description,
          category: obligation.category,
          due_day: obligation.due_day,
          due_month: obligation.due_month,
          frequency: obligation.frequency,
          recurrence_type: obligation.recurrence_type,
          recurrence_interval: obligation.recurrence_interval,
          recurrence_end_date: obligation.recurrence_end_date,
          auto_generate: obligation.auto_generate,
          weekend_rule: obligation.weekend_rule,
          status: 'pending',
          priority: obligation.priority,
          assigned_to: obligation.assigned_to,
          protocol: null,
          realization_date: null,
          amount: obligation.amount,
          notes: obligation.notes,
          parent_obligation_id: obligation.id,
          generated_for: currentPeriod,
          attachments: obligation.attachments,
          tags: obligation.tags
        })

      if (insertError) throw insertError
      generated++
    } catch (error) {
      console.error(`Erro ao gerar obrigação ${obligation.name}:`, error)
    }
  }

  return generated
}

async function generateRecurringInstallments(force: boolean): Promise<number> {
  const currentDate = new Date()
  const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  
  // Buscar parcelamentos com auto_generate = true
  const { data: installments, error } = await supabase
    .from('installments')
    .select('*')
    .eq('auto_generate', true)
    .is('parent_installment_id', null) // Apenas parcelamentos originais

  if (error) throw error

  let generated = 0

  for (const installment of installments || []) {
    try {
      // Verificar se já foi gerado para este período
      if (!force) {
        const { data: existing } = await supabase
          .from('installments')
          .select('id')
          .eq('parent_installment_id', installment.id)
          .eq('generated_for', currentPeriod)
          .single()

        if (existing) continue
      }

      // Verificar se deve gerar baseado no tipo de recorrência
      if (!shouldGenerateForPeriod(installment.recurrence_type, installment.recurrence_interval, currentDate)) {
        continue
      }

      // Calcular próxima data de vencimento
      const nextDueDate = getNextDueDate(installment.recurrence_type, installment.recurrence_interval, currentDate)
      const calculatedDueDate = calculateDueDate(
        nextDueDate.getDate(),
        nextDueDate.getMonth() + 1,
        nextDueDate,
        installment.weekend_rule
      )

      // Criar novo parcelamento
      const { error: insertError } = await supabase
        .from('installments')
        .insert({
          client_id: installment.client_id,
          description: installment.description,
          installment_number: installment.installment_number + 1,
          total_installments: installment.total_installments,
          due_date: calculatedDueDate.toISOString().split('T')[0],
          amount: installment.amount,
          status: 'pending',
          frequency: installment.frequency,
          recurrence_type: installment.recurrence_type,
          recurrence_interval: installment.recurrence_interval,
          recurrence_end_date: installment.recurrence_end_date,
          auto_generate: installment.auto_generate,
          weekend_rule: installment.weekend_rule,
          parent_installment_id: installment.id,
          generated_for: currentPeriod,
          notes: installment.notes
        })

      if (insertError) throw insertError
      generated++
    } catch (error) {
      console.error(`Erro ao gerar parcelamento ${installment.description}:`, error)
    }
  }

  return generated
}

function shouldGenerateForPeriod(recurrenceType: RecurrenceType, interval: number, currentDate: Date): boolean {
  const day = currentDate.getDate()
  
  // Só gera no dia 1º do mês
  if (day !== 1) return false

  switch (recurrenceType) {
    case 'monthly':
      return true
    case 'bimonthly':
      return currentDate.getMonth() % 2 === 0 // Janeiro, Março, Maio, etc.
    case 'quarterly':
      return currentDate.getMonth() % 3 === 0 // Janeiro, Abril, Julho, Outubro
    case 'semiannual':
      return currentDate.getMonth() % 6 === 0 // Janeiro, Julho
    case 'annual':
      return currentDate.getMonth() === 0 // Janeiro
    case 'custom':
      return currentDate.getMonth() % interval === 0
    default:
      return false
  }
}

function getNextDueDate(recurrenceType: RecurrenceType, interval: number, currentDate: Date): Date {
  const nextDate = new Date(currentDate)
  
  switch (recurrenceType) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
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
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
  }
  
  return nextDate
}
