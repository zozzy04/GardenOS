"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
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
  SmartphoneIcon,
  UserCheckIcon,
  WalletIcon,
} from "lucide-react"

type NavItem = {
  path: string
  title: string
  icon: React.ReactNode
}

const ADMIN_NAV: NavItem[] = [
  { path: "/", title: "Dashboard", icon: <LayoutDashboardIcon /> },
  { path: "/lavori", title: "Registro lavori", icon: <ClipboardListIcon /> },
  { path: "/calendario", title: "Calendario", icon: <CalendarIcon /> },
  { path: "/spese", title: "Spese condominiali", icon: <ShoppingCartIcon /> },
  { path: "/fattura", title: "Fattura", icon: <ReceiptIcon /> },
  { path: "/meteo", title: "Meteo", icon: <CloudIcon /> },
  { path: "/approvazioni", title: "Approvazioni", icon: <UserCheckIcon /> },
  { path: "/pwa-guida", title: "Installa l'app", icon: <SmartphoneIcon /> },
]

const CONDOMINO_NAV: NavItem[] = [
  { path: "/", title: "Il mio conto", icon: <WalletIcon /> },
  { path: "/pwa-guida", title: "Installa l'app", icon: <SmartphoneIcon /> },
]

type AppUser = {
  username?: string
  email?: string
}

export function AppSidebar({
  user,
  onLogout,
  navVariant = "admin",
  ...props
}: Omit<React.ComponentProps<typeof Sidebar>, "variant"> & {
  user: AppUser | null
  onLogout: () => void | Promise<void>
  navVariant?: "admin" | "condomino"
}) {
  const isCondomino = navVariant === "condomino"
  const navItems = isCondomino ? CONDOMINO_NAV : ADMIN_NAV
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
            <NavLink to="/">
              <SidebarMenuButton
                size="lg"
                tooltip="GardenOS"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-7">
                  <Leaf
                    className="size-[1.15rem] group-data-[collapsible=icon]:size-4"
                    strokeWidth={2.25}
                  />
                </div>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-heading text-base font-semibold tracking-tight">
                    GardenOS
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                </div>
              </SidebarMenuButton>
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <NavLink to={item.path} end={item.path === "/"}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2">
        {navUser ? (
          <NavUser user={navUser} onLogout={onLogout} />
        ) : null}
        <a
          href="https://riccardozozzolotto.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 pb-2 text-center text-[10px] tracking-wide text-muted-foreground/60 hover:text-sidebar-primary group-data-[collapsible=icon]:hidden"
        >
          Powered by{" "}
          <span className="font-medium">R. Zozzolotto</span>
        </a>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
