import type { Client, Tax, Obligation } from "./types"

const USE_KV = typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_KV === "1"

async function api<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${path} ${res.status}`)
  return (await res.json()) as T
}

const STORAGE_KEYS = {
  CLIENTS: "fiscal_clients",
  TAXES: "fiscal_taxes",
  OBLIGATIONS: "fiscal_obligations",
}

// Client Storage
export const getClients = (): Client[] => {
  if (USE_KV) {
    // will be ignored on server components; consumers devem usar via hooks/efeitos
    // NOTE: chamadas assíncronas não cabem aqui synchronamente; forneceremos versões assíncronas abaixo
  }
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.CLIENTS)
  return data ? JSON.parse(data) : []
}

export const getClientsAsync = async (): Promise<Client[]> => {
  if (USE_KV) return await api<Client[]>("/api/clients", "GET")
  return getClients()
}

export const saveClient = (client: Client): void => {
  const clients = getClients()
  const index = clients.findIndex((c) => c.id === client.id)
  if (index >= 0) {
    clients[index] = client
  } else {
    clients.push(client)
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

export const saveClientAsync = async (client: Client): Promise<void> => {
  if (USE_KV) {
    await api<Client>("/api/clients", "POST", client)
    return
  }
  return saveClient(client)
}

export const deleteClient = (id: string): void => {
  const clients = getClients().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients))
}

export const deleteClientAsync = async (id: string): Promise<void> => {
  if (USE_KV) {
    const clients = await getClientsAsync()
    const filtered = clients.filter((c) => c.id !== id)
    // store back whole array
    // simple approach: overwrite all
    for (const c of filtered) await api<Client>("/api/clients", "POST", c)
    return
  }
  return deleteClient(id)
}

// Tax Storage
export const getTaxes = (): Tax[] => {
  if (USE_KV) {
    // async path via getTaxesAsync
  }
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.TAXES)
  return data ? JSON.parse(data) : []
}

export const getTaxesAsync = async (): Promise<Tax[]> => {
  if (USE_KV) return await api<Tax[]>("/api/taxes", "GET")
  return getTaxes()
}

export const saveTax = (tax: Tax): void => {
  const taxes = getTaxes()
  const index = taxes.findIndex((t) => t.id === tax.id)
  if (index >= 0) {
    taxes[index] = tax
  } else {
    taxes.push(tax)
  }
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

export const saveTaxAsync = async (tax: Tax): Promise<void> => {
  if (USE_KV) {
    await api<Tax>("/api/taxes", "POST", tax)
    return
  }
  return saveTax(tax)
}

export const deleteTax = (id: string): void => {
  const taxes = getTaxes().filter((t) => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TAXES, JSON.stringify(taxes))
}

export const deleteTaxAsync = async (id: string): Promise<void> => {
  if (USE_KV) {
    const taxes = await getTaxesAsync()
    const filtered = taxes.filter((t) => t.id !== id)
    for (const t of filtered) await api<Tax>("/api/taxes", "POST", t)
    return
  }
  return deleteTax(id)
}

// Obligation Storage
export const getObligations = (): Obligation[] => {
  if (USE_KV) {
    // async path via getObligationsAsync
  }
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(STORAGE_KEYS.OBLIGATIONS)
  return data ? JSON.parse(data) : []
}

export const getObligationsAsync = async (): Promise<Obligation[]> => {
  if (USE_KV) return await api<Obligation[]>("/api/obligations", "GET")
  return getObligations()
}

export const saveObligation = (obligation: Obligation): void => {
  const obligations = getObligations()
  const index = obligations.findIndex((o) => o.id === obligation.id)
  if (index >= 0) {
    obligations[index] = obligation
  } else {
    obligations.push(obligation)
  }
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

export const saveObligationAsync = async (obligation: Obligation): Promise<void> => {
  if (USE_KV) {
    await api<Obligation>("/api/obligations", "POST", obligation)
    return
  }
  return saveObligation(obligation)
}

export const deleteObligation = (id: string): void => {
  const obligations = getObligations().filter((o) => o.id !== id)
  localStorage.setItem(STORAGE_KEYS.OBLIGATIONS, JSON.stringify(obligations))
}

export const deleteObligationAsync = async (id: string): Promise<void> => {
  if (USE_KV) {
    const obligations = await getObligationsAsync()
    const filtered = obligations.filter((o) => o.id !== id)
    for (const o of filtered) await api<Obligation>("/api/obligations", "POST", o)
    return
  }
  return deleteObligation(id)
}
