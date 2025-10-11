"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ClientList } from "@/components/client-list"
import { getClients } from "@/lib/storage"
import type { Client } from "@/lib/types"

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const handleUpdate = async () => {
    try {
      const clientsData = await Promise.resolve(getClients())
      setClients(clientsData || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    handleUpdate()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando clientes...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-2">Gerencie os clientes e suas informações</p>
          </div>

          <ClientList clients={clients} onUpdate={handleUpdate} />
        </div>
      </main>
    </div>
  )
}
