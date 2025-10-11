import { NextRequest, NextResponse } from 'next/server'
import { generateRecurringItems } from '@/lib/recurrence-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const force = body.force || false

    const result = await generateRecurringItems(force)

    return NextResponse.json({
      success: true,
      result,
      message: `Recorrências geradas: ${result.taxesGenerated} impostos, ${result.obligationsGenerated} obrigações, ${result.installmentsGenerated} parcelamentos`
    })
  } catch (error) {
    console.error('Erro ao gerar recorrências:', error)
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
