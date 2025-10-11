"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarView } from "@/components/calendar-view"
import type { Client, Tax, Obligation, Installment } from "@/lib/types"

export default function TestPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar dados das APIs
      const [clientsRes, taxesRes, obligationsRes, installmentsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/taxes'),
        fetch('/api/obligations'),
        fetch('/api/installments')
      ])

      if (!clientsRes.ok || !taxesRes.ok || !obligationsRes.ok || !installmentsRes.ok) {
        throw new Error('Erro ao carregar dados')
      }

      const [clientsData, taxesData, obligationsData, installmentsData] = await Promise.all([
        clientsRes.json(),
        taxesRes.json(),
        obligationsRes.json(),
        installmentsRes.json()
      ])

      setClients(clientsData)
      setTaxes(taxesData)
      setObligations(obligationsData)
      setInstallments(installmentsData)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const generateRecurrence = async () => {
    try {
      const response = await fetch('/api/recurrence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force: true })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar recorrências')
      }

      const result = await response.json()
      alert(`Recorrências geradas: ${result.result.taxesGenerated} impostos, ${result.result.obligationsGenerated} obrigações, ${result.result.installmentsGenerated} parcelamentos`)
      
      // Recarregar dados
      loadData()
    } catch (err) {
      alert('Erro ao gerar recorrências: ' + (err instanceof Error ? err.message : 'Erro desconhecido'))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro ao Carregar Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Converter obrigações para o formato esperado pelo calendário
  const obligationsWithDetails = obligations.map(obl => ({
    ...obl,
    client: clients.find(c => c.id === obl.clientId)!,
    calculatedDueDate: new Date().toISOString().split('T')[0] // Simplificado para teste
  }))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Controle Fiscal</h1>
          <p className="text-muted-foreground">Teste do sistema integrado</p>
        </div>
        <Button onClick={generateRecurrence} className="bg-green-600 hover:bg-green-700">
          Gerar Recorrências
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.status === 'active').length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Impostos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxes.length}</div>
            <p className="text-xs text-muted-foreground">
              {taxes.filter(t => t.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Obrigações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{obligations.length}</div>
            <p className="text-xs text-muted-foreground">
              {obligations.filter(o => o.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parcelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installments.length}</div>
            <p className="text-xs text-muted-foreground">
              {installments.filter(i => i.status === 'pending').length} pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calendário */}
      <CalendarView 
        obligations={obligationsWithDetails}
        taxes={taxes}
        installments={installments}
        clients={clients}
      />

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
          <CardDescription>Lista de todos os clientes no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    CNPJ: {client.cnpj} | Regime: {client.taxRegime}
                  </p>
                </div>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
