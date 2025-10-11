import { supabase } from "./supabase"
import type { 
  Client, 
  Tax, 
  Obligation, 
  Installment, 
  TaxRegime, 
  WeekendRule, 
  RecurrenceType, 
  Priority,
  ObligationCategory 
} from "./types"
import { calculateDueDate, formatDate } from "./date-utils"

// ===== CLIENTES =====

export async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    throw error
  }
}

export async function getClient(id: string): Promise<Client | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    throw error
  }
}

export async function createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: client.name,
        cnpj: client.cnpj,
        email: client.email,
        phone: client.phone,
        tax_regime: client.taxRegime,
        status: client.status
      })
      .select()
      .single()

    if (error) throw error
    
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
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    throw error
  }
}

export async function updateClient(id: string, client: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: client.name,
        cnpj: client.cnpj,
        email: client.email,
        phone: client.phone,
        tax_regime: client.taxRegime,
        status: client.status
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
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
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    throw error
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar cliente:', error)
    throw error
  }
}

// ===== IMPOSTOS =====

export async function getTaxes(): Promise<Tax[]> {
  try {
    const { data, error } = await supabase
      .from('taxes')
      .select(`
        *,
        clients!inner(name, cnpj)
      `)
      .order('due_day')

    if (error) throw error
    
    return (data || []).map(tax => ({
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
      createdAt: tax.created_at,
      tags: tax.tags || []
    }))
  } catch (error) {
    console.error('Erro ao buscar impostos:', error)
    throw error
  }
}

export async function createTax(tax: Omit<Tax, 'id' | 'createdAt'>): Promise<Tax> {
  try {
    const { data, error } = await supabase
      .from('taxes')
      .insert({
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
        tags: tax.tags
      })
      .select()
      .single()

    if (error) throw error
    
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
      parentTaxId: data.parent_tax_id,
      generatedFor: data.generated_for,
      createdAt: data.created_at,
      tags: data.tags || []
    }
  } catch (error) {
    console.error('Erro ao criar imposto:', error)
    throw error
  }
}

// ===== OBRIGAÇÕES =====

export async function getObligations(): Promise<Obligation[]> {
  try {
    const { data, error } = await supabase
      .from('obligations')
      .select(`
        *,
        clients!inner(name, cnpj),
        taxes(name, federal_tax_code)
      `)
      .order('due_day')

    if (error) throw error
    
    return (data || []).map(obligation => ({
      id: obligation.id,
      name: obligation.name,
      description: obligation.description,
      category: obligation.category,
      clientId: obligation.client_id,
      taxId: obligation.tax_id,
      dueDay: obligation.due_day,
      dueMonth: obligation.due_month,
      frequency: obligation.frequency,
      recurrence: obligation.recurrence_type,
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
      createdAt: obligation.created_at,
      completedAt: obligation.completed_at,
      completedBy: obligation.completed_by,
      attachments: obligation.attachments || [],
      parentObligationId: obligation.parent_obligation_id,
      generatedFor: obligation.generated_for,
      tags: obligation.tags || []
    }))
  } catch (error) {
    console.error('Erro ao buscar obrigações:', error)
    throw error
  }
}

export async function createObligation(obligation: Omit<Obligation, 'id' | 'createdAt'>): Promise<Obligation> {
  try {
    const { data, error } = await supabase
      .from('obligations')
      .insert({
        client_id: obligation.clientId,
        tax_id: obligation.taxId,
        name: obligation.name,
        description: obligation.description,
        category: obligation.category,
        due_day: obligation.dueDay,
        due_month: obligation.dueMonth,
        frequency: obligation.frequency,
        recurrence_type: obligation.recurrence,
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
        attachments: obligation.attachments,
        tags: obligation.tags
      })
      .select()
      .single()

    if (error) throw error
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      category: data.category,
      clientId: data.client_id,
      taxId: data.tax_id,
      dueDay: data.due_day,
      dueMonth: data.due_month,
      frequency: data.frequency,
      recurrence: data.recurrence_type,
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
      createdAt: data.created_at,
      completedAt: data.completed_at,
      completedBy: data.completed_by,
      attachments: data.attachments || [],
      parentObligationId: data.parent_obligation_id,
      generatedFor: data.generated_for,
      tags: data.tags || []
    }
  } catch (error) {
    console.error('Erro ao criar obrigação:', error)
    throw error
  }
}

// ===== PARCELAMENTOS =====

export async function getInstallments(): Promise<Installment[]> {
  try {
    const { data, error } = await supabase
      .from('installments')
      .select(`
        *,
        clients!inner(name, cnpj)
      `)
      .order('due_date')

    if (error) throw error
    
    return (data || []).map(installment => ({
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
    }))
  } catch (error) {
    console.error('Erro ao buscar parcelamentos:', error)
    throw error
  }
}

export async function createInstallment(installment: Omit<Installment, 'id' | 'createdAt'>): Promise<Installment> {
  try {
    const { data, error } = await supabase
      .from('installments')
      .insert({
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
        completed_by: installment.completedBy
      })
      .select()
      .single()

    if (error) throw error
    
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
  } catch (error) {
    console.error('Erro ao criar parcelamento:', error)
    throw error
  }
}
