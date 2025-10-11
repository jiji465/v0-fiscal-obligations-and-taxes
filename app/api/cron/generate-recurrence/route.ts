import { NextRequest, NextResponse } from 'next/server'
import { generateRecurringItems } from '@/lib/recurrence-service'

export async function GET() {
  try {
    // Verificar se é dia 1º do mês
    const today = new Date()
    if (today.getDate() !== 1) {
      return NextResponse.json({
        success: true,
        message: 'Não é dia 1º do mês, recorrências não serão geradas',
        result: {
          taxesGenerated: 0,
          obligationsGenerated: 0,
          installmentsGenerated: 0,
          errors: []
        }
      })
    }

    const result = await generateRecurringItems(false)

    return NextResponse.json({
      success: true,
      result,
      message: `Cron job executado: ${result.taxesGenerated} impostos, ${result.obligationsGenerated} obrigações, ${result.installmentsGenerated} parcelamentos gerados`
    })
  } catch (error) {
    console.error('Erro no cron job de recorrências:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
