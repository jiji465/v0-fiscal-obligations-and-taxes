"use client"

import type React from "react"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Client } from "@/lib/types"
import { useClientFormValidation } from "@/lib/hooks/use-form-validation"
import { formatCNPJ, formatPhone } from "@/lib/validation-schemas"

type ClientFormProps = {
  client?: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (client: Client) => void
}

export function ClientForm({ client, open, onOpenChange, onSave }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, submitError },
    reset,
    setValue,
    watch,
    canSubmit,
  } = useClientFormValidation({
    name: client?.name || "",
    cnpj: client?.cnpj || "",
    email: client?.email || "",
    phone: client?.phone || "",
    status: client?.status || "active",
  })

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        cnpj: client.cnpj,
        email: client.email,
        phone: client.phone,
        status: client.status,
      })
    } else {
      reset({
        name: "",
        cnpj: "",
        email: "",
        phone: "",
        status: "active",
      })
    }
  }, [client, reset])

  const onSubmit = handleSubmit(async (data) => {
    const clientData: Client = {
      id: client?.id || crypto.randomUUID(),
      name: data.name,
      cnpj: data.cnpj,
      email: data.email || "",
      phone: data.phone || "",
      status: data.status,
      createdAt: client?.createdAt || new Date().toISOString(),
    }
    await onSave(clientData)
    onOpenChange(false)
  })

  // Format CNPJ as user types
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setValue('cnpj', formatted)
  }

  // Format phone as user types
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setValue('phone', formatted)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente para gerenciar suas obrigações fiscais.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Nome / Razão Social *</Label>
              <Input
                id="name"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                {...register('cnpj')}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
                className={errors.cnpj ? 'border-red-500' : ''}
              />
              {errors.cnpj && (
                <p className="text-sm text-red-500">{errors.cnpj.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail (Opcional)</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone (Opcional)</Label>
              <Input
                id="phone"
                {...register('phone')}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger id="status" className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
