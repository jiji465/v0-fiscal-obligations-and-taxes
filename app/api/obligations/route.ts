import { NextRequest, NextResponse } from 'next/server'
import { getObligations, createObligation } from '@/lib/supabase-service'

export async function GET() {
  try {
    const obligations = await getObligations()
    return NextResponse.json(obligations)
  } catch (error) {
    console.error('Erro ao buscar obrigações:', error)
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

    const obligation = await createObligation({
      name: body.name,
      description: body.description,
      category: body.category || 'other',
      clientId: body.clientId,
      taxId: body.taxId,
      dueDay: body.dueDay,
      dueMonth: body.dueMonth,
      frequency: body.frequency || 'monthly',
      recurrence: body.recurrence || 'monthly',
      recurrenceInterval: body.recurrenceInterval || 1,
      recurrenceEndDate: body.recurrenceEndDate,
      autoGenerate: body.autoGenerate || false,
      weekendRule: body.weekendRule || 'postpone',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo,
      protocol: body.protocol,
      realizationDate: body.realizationDate,
      amount: body.amount,
      notes: body.notes,
      completedAt: body.completedAt,
      completedBy: body.completedBy,
      attachments: body.attachments || [],
      parentObligationId: body.parentObligationId,
      generatedFor: body.generatedFor,
      tags: body.tags || []
    })

    return NextResponse.json(obligation, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar obrigação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
