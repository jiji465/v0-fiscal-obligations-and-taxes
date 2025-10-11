import { supabase } from './supabase'
import type { Client, Tax, Obligation, Installment, ObligationWithDetails, InstallmentWithDetails } from './types'
import { calculateDueDate } from './date-utils'

// Client Storage
export const getClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data || []
}

export const saveClient = async (client: Client): Promise<Client | null> => {
  const { data, error } = await supabase
    .from('clients')
    .upsert({
      id: client.id,
      name: client.name,
      cnpj: client.cnpj,
      email: client.email,
      phone: client.phone,
      tax_regime: client.taxRegime,
      status: client.status,
      created_at: client.createdAt
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving client:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    cnpj: data.cnpj,
    email: data.email,
    phone: data.phone,
    taxRegime: data.tax_regime,
    status: data.status,
    createdAt: data.created_at
  }
}

export const deleteClient = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting client:', error)
    return false
  }

  return true
}

// Tax Storage
export const getTaxes = async (): Promise<Tax[]> => {
  const { data, error } = await supabase
    .from('taxes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching taxes:', error)
    return []
  }

  return data?.map(tax => ({
    id: tax.id,
    clientId: tax.client_id,
    name: tax.name,
    description: tax.description,
    federalTaxCode: tax.federal_tax_code,
    dueDay: tax.due_day,
    dueMonth: tax.due_month,
    frequency: tax.frequency,
    recurrenceType: tax.recurrence_type,
    recurrenceInterval: tax.recurrence_interval,
    recurrenceEndDate: tax.recurrence_end_date,
    autoGenerate: tax.auto_generate,
    weekendRule: tax.weekend_rule,
    amount: tax.amount,
    status: tax.status,
    priority: tax.priority,
    assignedTo: tax.assigned_to,
    protocol: tax.protocol,
    realizationDate: tax.realization_date,
    notes: tax.notes,
    completedAt: tax.completed_at,
    completedBy: tax.completed_by,
    parentTaxId: tax.parent_tax_id,
    generatedFor: tax.generated_for,
    createdAt: tax.created_at
  })) || []
}

export const saveTax = async (tax: Tax): Promise<Tax | null> => {
  const { data, error } = await supabase
    .from('taxes')
    .upsert({
      id: tax.id,
      client_id: tax.clientId,
      name: tax.name,
      description: tax.description,
      federal_tax_code: tax.federalTaxCode,
      due_day: tax.dueDay,
      due_month: tax.dueMonth,
      frequency: tax.frequency,
      recurrence_type: tax.recurrenceType,
      recurrence_interval: tax.recurrenceInterval,
      recurrence_end_date: tax.recurrenceEndDate,
      auto_generate: tax.autoGenerate,
      weekend_rule: tax.weekendRule,
      amount: tax.amount,
      status: tax.status,
      priority: tax.priority,
      assigned_to: tax.assignedTo,
      protocol: tax.protocol,
      realization_date: tax.realizationDate,
      notes: tax.notes,
      completed_at: tax.completedAt,
      completed_by: tax.completedBy,
      parent_tax_id: tax.parentTaxId,
      generated_for: tax.generatedFor,
      created_at: tax.createdAt
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving tax:', error)
    return null
  }

  return {
    id: data.id,
    clientId: data.client_id,
    name: data.name,
    description: data.description,
    federalTaxCode: data.federal_tax_code,
    dueDay: data.due_day,
    dueMonth: data.due_month,
    frequency: data.frequency,
    recurrenceType: data.recurrence_type,
    recurrenceInterval: data.recurrence_interval,
    recurrenceEndDate: data.recurrence_end_date,
    autoGenerate: data.auto_generate,
    weekendRule: data.weekend_rule,
    amount: data.amount,
    status: data.status,
    priority: data.priority,
    assignedTo: data.assigned_to,
    protocol: data.protocol,
    realizationDate: data.realization_date,
    notes: data.notes,
    completedAt: data.completed_at,
    completedBy: data.completed_by,
    createdAt: data.created_at
  }
}

export const deleteTax = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('taxes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting tax:', error)
    return false
  }

  return true
}

// Obligation Storage
export const getObligations = async (): Promise<Obligation[]> => {
  const { data, error } = await supabase
    .from('obligations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching obligations:', error)
    return []
  }

  return data?.map(obligation => ({
    id: obligation.id,
    clientId: obligation.client_id,
    taxId: obligation.tax_id,
    name: obligation.name,
    description: obligation.description,
    category: obligation.category,
    dueDay: obligation.due_day,
    dueMonth: obligation.due_month,
    frequency: obligation.frequency,
    recurrenceType: obligation.recurrence_type,
    recurrenceInterval: obligation.recurrence_interval,
    recurrenceEndDate: obligation.recurrence_end_date,
    autoGenerate: obligation.auto_generate,
    weekendRule: obligation.weekend_rule,
    status: obligation.status,
    priority: obligation.priority,
    assignedTo: obligation.assigned_to,
    protocol: obligation.protocol,
    realizationDate: obligation.realization_date,
    amount: obligation.amount,
    notes: obligation.notes,
    completedAt: obligation.completed_at,
    completedBy: obligation.completed_by,
    parentObligationId: obligation.parent_obligation_id,
    generatedFor: obligation.generated_for,
    createdAt: obligation.created_at
  })) || []
}

export const saveObligation = async (obligation: Obligation): Promise<Obligation | null> => {
  const { data, error } = await supabase
    .from('obligations')
    .upsert({
      id: obligation.id,
      client_id: obligation.clientId,
      tax_id: obligation.taxId,
      name: obligation.name,
      description: obligation.description,
      category: obligation.category,
      due_day: obligation.dueDay,
      due_month: obligation.dueMonth,
      frequency: obligation.frequency,
      recurrence_type: obligation.recurrenceType,
      recurrence_interval: obligation.recurrenceInterval,
      recurrence_end_date: obligation.recurrenceEndDate,
      auto_generate: obligation.autoGenerate,
      weekend_rule: obligation.weekendRule,
      status: obligation.status,
      priority: obligation.priority,
      assigned_to: obligation.assignedTo,
      protocol: obligation.protocol,
      realization_date: obligation.realizationDate,
      amount: obligation.amount,
      notes: obligation.notes,
      completed_at: obligation.completedAt,
      completed_by: obligation.completedBy,
      parent_obligation_id: obligation.parentObligationId,
      generated_for: obligation.generatedFor,
      created_at: obligation.createdAt
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving obligation:', error)
    return null
  }

  return {
    id: data.id,
    clientId: data.client_id,
    taxId: data.tax_id,
    name: data.name,
    description: data.description,
    category: data.category,
    dueDay: data.due_day,
    dueMonth: data.due_month,
    frequency: data.frequency,
    recurrenceType: data.recurrence_type,
    recurrenceInterval: data.recurrence_interval,
    recurrenceEndDate: data.recurrence_end_date,
    autoGenerate: data.auto_generate,
    weekendRule: data.weekend_rule,
    status: data.status,
    priority: data.priority,
    assignedTo: data.assigned_to,
    protocol: data.protocol,
    realizationDate: data.realization_date,
    amount: data.amount,
    notes: data.notes,
    completedAt: data.completed_at,
    completedBy: data.completed_by,
    parentObligationId: data.parent_obligation_id,
    generatedFor: data.generated_for,
    createdAt: data.created_at
  }
}

export const deleteObligation = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('obligations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting obligation:', error)
    return false
  }

  return true
}

// Installment Storage
export const getInstallments = async (): Promise<Installment[]> => {
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching installments:', error)
    return []
  }

  return data?.map(installment => ({
    id: installment.id,
    clientId: installment.client_id,
    description: installment.description,
    installmentNumber: installment.installment_number,
    totalInstallments: installment.total_installments,
    dueDate: installment.due_date,
    amount: installment.amount,
    status: installment.status,
    frequency: installment.frequency,
    recurrenceType: installment.recurrence_type,
    recurrenceInterval: installment.recurrence_interval,
    recurrenceEndDate: installment.recurrence_end_date,
    autoGenerate: installment.auto_generate,
    weekendRule: installment.weekend_rule,
    parentInstallmentId: installment.parent_installment_id,
    generatedFor: installment.generated_for,
    notes: installment.notes,
    completedAt: installment.completed_at,
    completedBy: installment.completed_by,
    createdAt: installment.created_at
  })) || []
}

export const saveInstallment = async (installment: Installment): Promise<Installment | null> => {
  const { data, error } = await supabase
    .from('installments')
    .upsert({
      id: installment.id,
      client_id: installment.clientId,
      description: installment.description,
      installment_number: installment.installmentNumber,
      total_installments: installment.totalInstallments,
      due_date: installment.dueDate,
      amount: installment.amount,
      status: installment.status,
      frequency: installment.frequency,
      recurrence_type: installment.recurrenceType,
      recurrence_interval: installment.recurrenceInterval,
      recurrence_end_date: installment.recurrenceEndDate,
      auto_generate: installment.autoGenerate,
      weekend_rule: installment.weekendRule,
      parent_installment_id: installment.parentInstallmentId,
      generated_for: installment.generatedFor,
      notes: installment.notes,
      completed_at: installment.completedAt,
      completed_by: installment.completedBy,
      created_at: installment.createdAt
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving installment:', error)
    return null
  }

  return {
    id: data.id,
    clientId: data.client_id,
    description: data.description,
    installmentNumber: data.installment_number,
    totalInstallments: data.total_installments,
    dueDate: data.due_date,
    amount: data.amount,
    status: data.status,
    frequency: data.frequency,
    recurrenceType: data.recurrence_type,
    recurrenceInterval: data.recurrence_interval,
    recurrenceEndDate: data.recurrence_end_date,
    autoGenerate: data.auto_generate,
    weekendRule: data.weekend_rule,
    parentInstallmentId: data.parent_installment_id,
    generatedFor: data.generated_for,
    notes: data.notes,
    completedAt: data.completed_at,
    completedBy: data.completed_by,
    createdAt: data.created_at
  }
}

export const deleteInstallment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('installments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting installment:', error)
    return false
  }

  return true
}

// Helper functions for getting data with details
export const getObligationsWithDetails = async (): Promise<ObligationWithDetails[]> => {
  const [obligations, clients, taxes] = await Promise.all([
    getObligations(),
    getClients(),
    getTaxes()
  ])

  return obligations.map(obligation => {
    const client = clients.find(c => c.id === obligation.clientId)
    const tax = taxes.find(t => t.id === obligation.taxId)
    
    const calculatedDueDate = calculateDueDate(
      obligation.dueDay,
      obligation.dueMonth,
      obligation.frequency,
      obligation.weekendRule
    ).toISOString()

    return {
      ...obligation,
      client: client!,
      tax,
      calculatedDueDate
    }
  })
}

export const getInstallmentsWithDetails = async (): Promise<InstallmentWithDetails[]> => {
  const [installments, clients] = await Promise.all([
    getInstallments(),
    getClients()
  ])

  return installments.map(installment => {
    const client = clients.find(c => c.id === installment.clientId)
    
    const calculatedDueDate = new Date(installment.dueDate).toISOString()

    return {
      ...installment,
      client: client!,
      calculatedDueDate
    }
  })
}
