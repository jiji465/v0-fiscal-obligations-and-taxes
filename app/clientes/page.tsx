"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ClientList } from "@/components/client-list"
import { getClients } from "@/lib/supabase/database" // CORREÇÃO: Importado do supabase
import type { Client } from "@/lib/types" // CORREÇÃO: Importado o tipo

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]) // CORREÇÃO: Tipagem explícita
  const [loading, setLoading] = useState(true) // CORREÇÃO: Estado de carregamento

  // CORREÇÃO: Função async para buscar dados
  const handleUpdate = async () => {
    setLoading(true)
    const clientsData = await getClients()
    setClients(clientsData)
    setLoading(false)
  }

  useEffect(() => {
    handleUpdate()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-2">Gerencie os clientes e suas informações</p>
          </div>
          
          {/* CORREÇÃO: Adicionado loader */}
          {loading ? <p>Carregando clientes...</p> : <ClientList clients={clients} onUpdate={handleUpdate} />}
        </div>
      </main>
    </div>
  )
}
