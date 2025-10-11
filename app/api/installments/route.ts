import { NextRequest, NextResponse } from 'next/server'
import { getInstallments, createInstallment } from '@/lib/supabase-service'

export async function GET() {
  try {
    const installments = await getInstallments()
    return NextResponse.json(installments)
  } catch (error) {
    console.error('Erro ao buscar parcelamentos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação básica
    if (!body.description || !body.clientId) {
      return NextResponse.json(
        { error: 'Descrição e cliente são obrigatórios' },
        { status: 400 }
      )
    }

    const installment = await createInstallment({
      clientId: body.clientId,
      description: body.description,
      installmentNumber: body.installmentNumber || 1,
      totalInstallments: body.totalInstallments || 1,
      dueDate: body.dueDate,
      amount: body.amount,
      status: body.status || 'pending',
      frequency: body.frequency || 'monthly',
      recurrenceType: body.recurrenceType || 'monthly',
      recurrenceInterval: body.recurrenceInterval || 1,
      recurrenceEndDate: body.recurrenceEndDate,
      autoGenerate: body.autoGenerate || false,
      weekendRule: body.weekendRule || 'postpone',
      parentInstallmentId: body.parentInstallmentId,
      generatedFor: body.generatedFor,
      notes: body.notes,
      completedAt: body.completedAt,
      completedBy: body.completedBy
    })

    return NextResponse.json(installment, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar parcelamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
