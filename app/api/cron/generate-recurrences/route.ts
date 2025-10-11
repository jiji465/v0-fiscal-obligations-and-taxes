import { NextRequest, NextResponse } from 'next/server'
import { generateRecurringRecords } from '@/lib/auto-generation'

export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma requisição autorizada (opcional: adicionar autenticação)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Executando geração automática de registros recorrentes...')
    
    const result = await generateRecurringRecords()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Geração automática executada com sucesso',
        period: result.period,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro na execução do cron job:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Endpoint para execução manual (GET)
export async function GET(request: NextRequest) {
  try {
    console.log('Executando geração automática manual...')
    
    const result = await generateRecurringRecords()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Geração automática executada com sucesso',
        period: result.period,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro na execução manual:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
