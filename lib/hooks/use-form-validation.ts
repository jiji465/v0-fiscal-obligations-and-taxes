import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'

/**
 * Generic hook for form validation with Zod schema
 * @param schema - Zod validation schema
 * @param defaultValues - Default form values
 * @returns Form methods and validation state
 */
export function useFormValidation<T extends z.ZodType>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
    mode: 'onChange', // Validate on change for better UX
  })

  const {
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
  } = form

  /**
   * Handle form submission with error handling
   * @param onSubmit - Function to call on successful validation
   */
  const onSubmit = (onSubmit: (data: z.infer<T>) => Promise<void> | void) => {
    return handleSubmit(async (data) => {
      try {
        setIsSubmitting(true)
        setSubmitError(null)
        await onSubmit(data)
      } catch (error) {
        console.error('Form submission error:', error)
        setSubmitError(
          error instanceof Error 
            ? error.message 
            : 'Ocorreu um erro ao salvar. Tente novamente.'
        )
      } finally {
        setIsSubmitting(false)
      }
    })
  }

  /**
   * Reset form with new values
   * @param values - New form values
   */
  const resetForm = (values?: Partial<z.infer<T>>) => {
    reset(values as any)
    setSubmitError(null)
  }

  /**
   * Set a field error manually
   * @param field - Field name
   * @param message - Error message
   */
  const setFieldError = (field: keyof z.infer<T>, message: string) => {
    setError(field as any, { type: 'manual', message })
  }

  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    clearErrors()
    setSubmitError(null)
  }

  return {
    ...form,
    handleSubmit: onSubmit,
    isSubmitting,
    submitError,
    resetForm,
    setFieldError,
    clearAllErrors,
    hasErrors: Object.keys(errors).length > 0,
    canSubmit: isValid && !isSubmitting,
  }
}

/**
 * Hook specifically for client form validation
 */
export function useClientFormValidation(defaultValues?: Partial<z.infer<typeof import('../validation-schemas').clientSchema>>) {
  const { clientSchema } = require('../validation-schemas')
  return useFormValidation(clientSchema, defaultValues)
}

/**
 * Hook specifically for obligation form validation
 */
export function useObligationFormValidation(defaultValues?: Partial<z.infer<typeof import('../validation-schemas').obligationSchema>>) {
  const { obligationSchema } = require('../validation-schemas')
  return useFormValidation(obligationSchema, defaultValues)
}

/**
 * Hook specifically for tax form validation
 */
export function useTaxFormValidation(defaultValues?: Partial<z.infer<typeof import('../validation-schemas').taxSchema>>) {
  const { taxSchema } = require('../validation-schemas')
  return useFormValidation(taxSchema, defaultValues)
}

/**
 * Hook specifically for installment form validation
 */
export function useInstallmentFormValidation(defaultValues?: Partial<z.infer<typeof import('../validation-schemas').installmentSchema>>) {
  const { installmentSchema } = require('../validation-schemas')
  return useFormValidation(installmentSchema, defaultValues)
}
