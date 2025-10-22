import type { WeekendRule } from "./types"

/**
 * Checks if a given date falls on a weekend (Saturday or Sunday)
 * @param date - The date to check
 * @returns True if the date is a weekend, false otherwise
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Adjusts a date based on weekend rules
 * @param date - The date to adjust
 * @param rule - The weekend rule to apply ('postpone', 'anticipate', or 'keep')
 * @returns The adjusted date
 */
export const adjustForWeekend = (date: Date, rule: WeekendRule): Date => {
  if (!isWeekend(date) || rule === 'keep') return date

  const adjusted = new Date(date)

  if (rule === "anticipate") {
    // Move to previous business day
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() - 1)
    }
  } else if (rule === "postpone") {
    // Move to next business day
    while (isWeekend(adjusted)) {
      adjusted.setDate(adjusted.getDate() + 1)
    }
  }

  return adjusted
}

/**
 * Calculates the next due date for an obligation based on its configuration
 * @param dueDay - Day of the month when the obligation is due
 * @param dueMonth - Specific month (for annual/quarterly obligations)
 * @param frequency - Frequency of the obligation ('monthly', 'quarterly', 'annual', 'custom')
 * @param weekendRule - How to handle weekends
 * @param referenceDate - Reference date for calculation (defaults to today)
 * @returns The calculated due date
 */
export const calculateDueDate = (
  dueDay: number,
  dueMonth: number | undefined,
  frequency: string,
  weekendRule: WeekendRule,
  referenceDate: Date = new Date(),
): Date => {
  let dueDate: Date

  if (frequency === "annual" && dueMonth) {
    // Annual obligation with specific month
    dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, dueDay)
    if (dueDate < referenceDate) {
      dueDate.setFullYear(dueDate.getFullYear() + 1)
    }
  } else if (frequency === "quarterly" && dueMonth) {
    // Quarterly obligation
    dueDate = new Date(referenceDate.getFullYear(), dueMonth - 1, dueDay)
    while (dueDate < referenceDate) {
      dueDate.setMonth(dueDate.getMonth() + 3)
    }
  } else {
    // Monthly or custom
    dueDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), dueDay)
    if (dueDate < referenceDate) {
      dueDate.setMonth(dueDate.getMonth() + 1)
    }
  }

  return adjustForWeekend(dueDate, weekendRule)
}

/**
 * Formats a date to Brazilian format (DD/MM/YYYY)
 * @param date - Date to format (string or Date object)
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR")
}

/**
 * Formats a number as Brazilian currency
 * @param value - Number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Checks if a due date has passed
 * @param dueDate - Due date to check (ISO string)
 * @returns True if the date is overdue, false otherwise
 */
export const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date()
}

/**
 * Checks if a due date is within the next 7 days
 * @param dueDate - Due date to check (ISO string)
 * @returns True if the date is upcoming this week, false otherwise
 */
export const isUpcomingThisWeek = (dueDate: string): boolean => {
  const due = new Date(dueDate)
  const today = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(today.getDate() + 7)
  return due >= today && due <= weekFromNow
}
