"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { ClientList } from "@/components/client-list"
// Importa a função correta do Supabase database
import { getClients as getClientsFromDb } from "@/lib/supabase/database"
import type { Client } from "@/lib/types" // Importa o tipo Client

export default function ClientesPage() {
  // Inicializa o estado como um array vazio
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true); // Estado para indicar carregamento

  // Função assíncrona para carregar dados do Supabase
  const loadClients = async () => {
    setLoading(true); // Inicia o carregamento
    try {
      const clientsData = await getClientsFromDb(); // Busca do Supabase
      setClients(clientsData); // Atualiza o estado com os dados do Supabase
    } catch (error) {
      console.error("[v0] Erro ao buscar clientes do Supabase:", error);
      // Opcional: Mostrar uma mensagem de erro para o usuário
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  }

  // useEffect para carregar os dados quando a página montar
  useEffect(() => {
    loadClients();
  }, [])

  // handleUpdate agora chama loadClients para rebuscar do Supabase
  const handleUpdate = () => {
    loadClients();
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

          {/* Mostra mensagem de carregamento ou a lista */}
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando clientes...</p>
          ) : (
            <ClientList clients={clients} onUpdate={handleUpdate} />
          )}

        </div>
      </main>
    </div>
  )
}
