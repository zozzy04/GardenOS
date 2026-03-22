"use client"

import * as React from "react"
import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  CalendarIcon,
  ClipboardListIcon,
  CloudIcon,
  LayoutDashboardIcon,
  Leaf,
  ReceiptIcon,
  ShoppingCartIcon,
  UserCheckIcon,
  WalletIcon,
} from "lucide-react"

const ADMIN_MAIN: NavMainItem[] = [
  { id: "dashboard", title: "Dashboard", icon: <LayoutDashboardIcon /> },
  { id: "lavori", title: "Registro lavori", icon: <ClipboardListIcon /> },
  { id: "calendario", title: "Calendario", icon: <CalendarIcon /> },
  { id: "spese", title: "Spese condominiali", icon: <ShoppingCartIcon /> },
  { id: "fattura", title: "Fattura", icon: <ReceiptIcon /> },
  { id: "meteo", title: "Statistiche meteo", icon: <CloudIcon /> },
  { id: "approvazioni", title: "Approvazioni", icon: <UserCheckIcon /> },
]

const CONDOMINO_MAIN: NavMainItem[] = [
  { id: "mio-conto", title: "Il mio conto", icon: <WalletIcon /> },
]

type AppUser = {
  username?: string
  email?: string
}

export function AppSidebar({
  currentPage,
  onPageChange,
  user,
  onLogout,
  navVariant = "admin",
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, "variant"> & {
  currentPage: string
  onPageChange: (id: string) => void
  user: AppUser | null
  onLogout: () => void | Promise<void>
  navVariant?: "admin" | "condomino"
}) {
  const isCondomino = navVariant === "condomino"
  const navMain = isCondomino ? CONDOMINO_MAIN : ADMIN_MAIN
  const subtitle = isCondomino ? "Area condomino" : "Gestione giardino"

  const navUser = user
    ? {
        name: user.username || user.email?.split("@")[0] || "Utente",
        email: user.email || "",
        avatar: undefined as string | undefined,
      }
    : null

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="GardenOS"
              onClick={() =>
                onPageChange(isCondomino ? "mio-conto" : "dashboard")
              }
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm ring-1 ring-sidebar-primary/20 group-data-[collapsible=icon]:size-7">
                <Leaf
                  className="size-[1.15rem] group-data-[collapsible=icon]:size-4"
                  strokeWidth={2.25}
                />
              </div>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold tracking-tight">
                  GardenOS
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navMain}
          currentPage={currentPage}
          onPageChange={onPageChange}
          showQuickActions={false}
        />
      </SidebarContent>
      <SidebarFooter className="gap-2">
        {navUser ? (
          <NavUser user={navUser} onLogout={onLogout} />
        ) : null}
        <p className="px-2 pb-2 text-center text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          Powered by{" "}
          <span className="font-medium text-sidebar-primary">R. Zozzolotto</span>
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
