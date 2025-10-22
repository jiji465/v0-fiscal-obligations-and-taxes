import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, FileText, Calendar, Receipt, Menu, X, BarChart3, Bell, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

type NavigationServerProps = {
  alertCounts?: {
    overdue: number
    pending: number
    thisWeek: number
  }
}

export function NavigationServer({ alertCounts = { overdue: 0, pending: 0, thisWeek: 0 } }: NavigationServerProps) {
  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: alertCounts.overdue > 0 ? alertCounts.overdue : null,
      badgeVariant: "destructive" as const,
    },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/impostos", label: "Impostos", icon: Receipt },
    {
      href: "/obrigacoes",
      label: "Obrigações",
      icon: FileText,
      badge: alertCounts.pending > 0 ? alertCounts.pending : null,
      badgeVariant: "secondary" as const,
    },
    { href: "/parcelamentos", label: "Parcelamentos", icon: CreditCard },
    {
      href: "/calendario",
      label: "Calendário",
      icon: Calendar,
      badge: alertCounts.thisWeek > 0 ? alertCounts.thisWeek : null,
      badgeVariant: "default" as const,
    },
    { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  ]

  const totalAlerts = alertCounts.overdue + alertCounts.thisWeek

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                <FileText className="size-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">Controle Fiscal</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="gap-2 relative transition-all"
                    >
                      <Icon className="size-4" />
                      {item.label}
                      {item.badge && (
                        <Badge variant={item.badgeVariant} className="ml-1 h-5 min-w-5 px-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalAlerts > 0 && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/20 rounded-full border border-red-200 dark:border-red-800">
                <Bell className="size-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {totalAlerts} {totalAlerts === 1 ? "alerta" : "alertas"}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden relative"
            >
              <Menu className="size-5" />
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {totalAlerts}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
