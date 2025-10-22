import { z } from 'zod'

/**
 * Utility function to validate CNPJ format
 */
const validateCNPJ = (cnpj: string): boolean => {
  // Remove all non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  
  // Check if it has 14 digits
  if (cleanCNPJ.length !== 14) return false
  
  // Check if all digits are the same (invalid)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // CNPJ validation algorithm
  let sum = 0
  let weight = 2
  
  // Calculate first check digit
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (parseInt(cleanCNPJ[12]) !== firstDigit) return false
  
  // Calculate second check digit
  sum = 0
  weight = 2
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  return parseInt(cleanCNPJ[13]) === secondDigit
}

/**
 * Utility function to format CNPJ
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Utility function to format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }
  return phone
}

/**
 * Client validation schema
 */
export const clientSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  cnpj: z.string()
    .min(1, 'CNPJ é obrigatório')
    .refine(validateCNPJ, 'CNPJ inválido'),
  
  email: z.string()
    .email('E-mail inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .optional()
    .or(z.literal('')),
  
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status deve ser ativo ou inativo' })
  })
})

/**
 * Tax validation schema
 */
export const taxSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  federalTaxCode: z.string()
    .max(50, 'Código deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
  
  dueDay: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31')
    .optional(),
  
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  
  assignedTo: z.string()
    .max(100, 'Responsável deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  protocol: z.string()
    .max(100, 'Protocolo deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  tags: z.array(z.string().max(50, 'Tag deve ter no máximo 50 caracteres'))
    .optional()
    .default([]),
  
  autoGenerate: z.boolean().default(true),
  
  recurrence: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom'], {
    errorMap: () => ({ message: 'Recorrência inválida' })
  }),
  
  recurrenceInterval: z.number()
    .int('Intervalo deve ser um número inteiro')
    .min(1, 'Intervalo deve ser pelo menos 1')
    .max(12, 'Intervalo deve ser no máximo 12')
    .optional(),
  
  weekendRule: z.enum(['postpone', 'anticipate', 'keep'], {
    errorMap: () => ({ message: 'Regra de final de semana inválida' })
  })
})

/**
 * Obligation validation schema
 */
export const obligationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  category: z.enum(['sped', 'tax_guide', 'certificate', 'declaration', 'other'], {
    errorMap: () => ({ message: 'Categoria inválida' })
  }),
  
  clientId: z.string()
    .uuid('ID do cliente inválido'),
  
  taxId: z.string()
    .uuid('ID do imposto inválido')
    .optional(),
  
  dueDay: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  
  dueMonth: z.number()
    .int('Mês deve ser um número inteiro')
    .min(1, 'Mês deve ser entre 1 e 12')
    .max(12, 'Mês deve ser entre 1 e 12')
    .optional(),
  
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'custom'], {
    errorMap: () => ({ message: 'Frequência inválida' })
  }),
  
  recurrence: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom'], {
    errorMap: () => ({ message: 'Recorrência inválida' })
  }),
  
  recurrenceInterval: z.number()
    .int('Intervalo deve ser um número inteiro')
    .min(1, 'Intervalo deve ser pelo menos 1')
    .max(12, 'Intervalo deve ser no máximo 12')
    .optional(),
  
  recurrenceEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  
  autoGenerate: z.boolean().default(true),
  
  weekendRule: z.enum(['postpone', 'anticipate', 'keep'], {
    errorMap: () => ({ message: 'Regra de final de semana inválida' })
  }),
  
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  
  assignedTo: z.string()
    .max(100, 'Responsável deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  protocol: z.string()
    .max(100, 'Protocolo deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  realizationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  amount: z.number()
    .min(0, 'Valor deve ser positivo')
    .optional(),
  
  tags: z.array(z.string().max(50, 'Tag deve ter no máximo 50 caracteres'))
    .optional()
    .default([]),
  
  attachments: z.array(z.string())
    .optional()
    .default([])
})

/**
 * Installment validation schema
 */
export const installmentSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  clientId: z.string()
    .uuid('ID do cliente inválido'),
  
  taxId: z.string()
    .uuid('ID do imposto inválido')
    .optional(),
  
  installmentCount: z.number()
    .int('Número de parcelas deve ser um número inteiro')
    .min(1, 'Deve ter pelo menos 1 parcela')
    .max(60, 'Máximo de 60 parcelas'),
  
  currentInstallment: z.number()
    .int('Parcela atual deve ser um número inteiro')
    .min(1, 'Parcela atual deve ser pelo menos 1'),
  
  dueDay: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia deve ser entre 1 e 31')
    .max(31, 'Dia deve ser entre 1 e 31'),
  
  firstDueDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  
  weekendRule: z.enum(['postpone', 'anticipate', 'keep'], {
    errorMap: () => ({ message: 'Regra de final de semana inválida' })
  }),
  
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridade inválida' })
  }),
  
  assignedTo: z.string()
    .max(100, 'Responsável deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  protocol: z.string()
    .max(100, 'Protocolo deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  tags: z.array(z.string().max(50, 'Tag deve ter no máximo 50 caracteres'))
    .optional()
    .default([]),
  
  paymentMethod: z.string()
    .max(100, 'Método de pagamento deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  referenceNumber: z.string()
    .max(100, 'Número de referência deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  autoGenerate: z.boolean().default(true),
  
  recurrence: z.enum(['monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual', 'custom'], {
    errorMap: () => ({ message: 'Recorrência inválida' })
  }),
  
  recurrenceInterval: z.number()
    .int('Intervalo deve ser um número inteiro')
    .min(1, 'Intervalo deve ser pelo menos 1')
    .max(12, 'Intervalo deve ser no máximo 12')
    .optional(),
  
  installmentAmount: z.number()
    .min(0, 'Valor da parcela deve ser positivo')
    .optional()
})

/**
 * Type exports for use in forms
 */
export type ClientFormData = z.infer<typeof clientSchema>
export type TaxFormData = z.infer<typeof taxSchema>
export type ObligationFormData = z.infer<typeof obligationSchema>
export type InstallmentFormData = z.infer<typeof installmentSchema>
