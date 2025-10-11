import { NextRequest, NextResponse } from 'next/server'
import { getTaxes, createTax } from '@/lib/supabase-service'

export async function GET() {
  try {
    const taxes = await getTaxes()
    return NextResponse.json(taxes)
  } catch (error) {
    console.error('Erro ao buscar impostos:', error)
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
    if (!body.name || !body.clientId) {
      return NextResponse.json(
        { error: 'Nome e cliente são obrigatórios' },
        { status: 400 }
      )
    }

    const tax = await createTax({
      clientId: body.clientId,
      name: body.name,
      description: body.description,
      federalTaxCode: body.federalTaxCode,
      dueDay: body.dueDay,
      dueMonth: body.dueMonth,
      frequency: body.frequency || 'monthly',
      recurrenceType: body.recurrenceType || 'monthly',
      recurrenceInterval: body.recurrenceInterval || 1,
      recurrenceEndDate: body.recurrenceEndDate,
      autoGenerate: body.autoGenerate || false,
      weekendRule: body.weekendRule || 'postpone',
      amount: body.amount,
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo,
      protocol: body.protocol,
      realizationDate: body.realizationDate,
      notes: body.notes,
      completedAt: body.completedAt,
      completedBy: body.completedBy,
      parentTaxId: body.parentTaxId,
      generatedFor: body.generatedFor,
      tags: body.tags || []
    })

    return NextResponse.json(tax, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar imposto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
