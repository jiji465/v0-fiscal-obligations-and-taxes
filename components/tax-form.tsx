"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Tax } from "@/lib/types"

type TaxFormProps = {
  tax?: Tax
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (tax: Tax) => void
}

export function TaxForm({ tax, open, onOpenChange, onSave }: TaxFormProps) {
  const [formData, setFormData] = useState<Partial<Tax>>(
    tax || {
      name: "",
      description: "",
      federalTaxCode: "",
      dueDay: undefined,
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const taxData: Tax = {
      id: tax?.id || crypto.randomUUID(),
      name: formData.name!,
      description: formData.description!,
      federalTaxCode: formData.federalTaxCode,
      dueDay: formData.dueDay ? Number(formData.dueDay) : undefined,
      createdAt: tax?.createdAt || new Date().toISOString(),
    }
    onSave(taxData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tax ? "Editar Imposto" : "Novo Imposto"}</DialogTitle>
          <DialogDescription>Cadastre impostos para vincular às obrigações fiscais dos clientes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Imposto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: ICMS, ISS, IRPJ"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o imposto..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDay">Dia de Vencimento (Opcional)</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dueDay: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="Ex: 15"
              />
              <p className="text-xs text-muted-foreground">
                Dia padrão de vencimento deste imposto (pode ser sobrescrito na obrigação)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="federalTaxCode">Código Federal (Opcional)</Label>
              <Input
                id="federalTaxCode"
                value={formData.federalTaxCode}
                onChange={(e) => setFormData({ ...formData, federalTaxCode: e.target.value })}
                placeholder="Ex: 1234"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
