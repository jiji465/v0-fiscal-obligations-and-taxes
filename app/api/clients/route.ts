import { NextRequest, NextResponse } from 'next/server'
import { getClients, createClient } from '@/lib/supabase-service'

export async function GET() {
  try {
    const clients = await getClients()
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
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
    if (!body.name || !body.cnpj) {
      return NextResponse.json(
        { error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      )
    }

    const client = await createClient({
      name: body.name,
      cnpj: body.cnpj,
      email: body.email,
      phone: body.phone,
      taxRegime: body.taxRegime || 'simples_nacional',
      status: body.status || 'active'
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
