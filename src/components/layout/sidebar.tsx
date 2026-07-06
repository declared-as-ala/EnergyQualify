"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  FolderCheck,
  PhoneCall,
  Upload,
  Bot,
  ShieldCheck,
  Settings,
  ChevronsUpDown,
  Bell,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const NAV_ITEMS = [
  { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/campagnes", label: "Campagnes", icon: Megaphone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/dossiers", label: "Dossiers qualifiés", icon: FolderCheck },
  { href: "/appels", label: "Historique des appels", icon: PhoneCall },
  { href: "/import", label: "Importer une liste", icon: Upload },
  { href: "/agent", label: "Script de l'agent IA", icon: Bot },
  { href: "/conformite", label: "Conformité", icon: ShieldCheck },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const demoMode = useAppStore((s) => s.demoMode);
  const setDemoMode = useAppStore((s) => s.setDemoMode);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground h-screen sticky top-0">
      <div className="group/brand flex items-center gap-3 px-5 h-16 border-b border-sidebar-border/80 hover:bg-sidebar-accent/10 transition-colors duration-300 cursor-pointer">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sidebar-primary to-primary/30 p-0.5 shadow-md shadow-primary/10 group-hover/brand:scale-105 transition-all duration-300">
          {/* Glowing back-light */}
          <div className="absolute inset-0 bg-sidebar-primary/20 blur-md rounded-xl group-hover/brand:bg-sidebar-primary/45 transition-all duration-300 -z-10 animate-pulse" />
          
          {/* Logo SVG Icon - Energy Bolt & Shield design */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 text-sidebar-primary-foreground drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              fill="currentColor"
              className="fill-current text-sidebar-primary-foreground group-hover/brand:animate-pulse"
            />
          </svg>
        </div>
        <div className="leading-tight flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-heading font-black tracking-tight text-sidebar-foreground truncate">
              EnergyQualify
            </span>
            <span className="text-[8px] font-heading font-black px-1 py-0.5 rounded-sm bg-sidebar-primary/30 text-sidebar-primary-foreground border border-sidebar-primary/40 uppercase tracking-wider">
              AI
            </span>
          </div>
          <span className="text-[9px] font-heading font-semibold text-sidebar-foreground/40 tracking-wider uppercase mt-0.5 truncate">
            Pré-qualification IA
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-heading font-medium tracking-tight transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border/80 p-3 space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sidebar-foreground/70" />
            <div className="leading-tight">
              <p className="text-xs font-heading font-semibold">Mode démo</p>
              <p className="text-[10px] text-sidebar-foreground/50">Aucun appel réel</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger render={<Switch checked={demoMode} onCheckedChange={setDemoMode} />} />
            <TooltipContent side="top">
              {demoMode ? "Les appels sont simulés" : "Attention : appels réels activés"}
            </TooltipContent>
          </Tooltip>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent transition-colors" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-heading font-bold">
                ES
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-heading font-semibold">Ecofix Energie SA</p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">Simon Lefèvre · Admin</p>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Espace de travail</DropdownMenuLabel>
            <DropdownMenuItem>Ecofix Energie SA</DropdownMenuItem>
            <DropdownMenuItem disabled className="text-muted-foreground">
              + Ajouter un espace de travail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Compte</DropdownMenuLabel>
            <DropdownMenuItem>Mon profil</DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              Notifications <Bell className="h-3.5 w-3.5" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
