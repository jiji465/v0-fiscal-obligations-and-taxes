"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TaxForm } from "@/components/tax-form"
import { MoreVertical, Pencil, Trash2, Search, Plus } from "lucide-react"
import { getTaxes, saveTax, deleteTax } from "@/lib/storage"
import type { Tax } from "@/lib/types"

export default function ImpostosPage() {
  const [taxes, setTaxes] = useState(getTaxes())
  const [search, setSearch] = useState("")
  const [editingTax, setEditingTax] = useState<Tax | undefined>()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleUpdate = () => {
    setTaxes(getTaxes())
  }

  const handleSave = (tax: Tax) => {
    saveTax(tax)
    handleUpdate()
    setEditingTax(undefined)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este imposto?")) {
      deleteTax(id)
      handleUpdate()
    }
  }

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax)
    setIsFormOpen(true)
  }

  const handleNew = () => {
    setEditingTax(undefined)
    setIsFormOpen(true)
  }

  const filteredTaxes = taxes.filter((tax) => tax.name.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    handleUpdate()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Impostos</h1>
            <p className="text-muted-foreground mt-2">Cadastre e gerencie os impostos para vincular às obrigações</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar impostos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleNew}>
                <Plus className="size-4 mr-2" />
                Novo Imposto
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Código Federal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum imposto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTaxes.map((tax) => (
                      <TableRow key={tax.id}>
                        <TableCell className="font-medium">{tax.name}</TableCell>
                        <TableCell>{tax.description}</TableCell>
                        <TableCell className="font-mono text-sm">{tax.federalTaxCode || "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(tax)}>
                                <Pencil className="size-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(tax.id)} className="text-destructive">
                                <Trash2 className="size-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <TaxForm tax={editingTax} open={isFormOpen} onOpenChange={setIsFormOpen} onSave={handleSave} />
        </div>
      </main>
    </div>
  )
}
