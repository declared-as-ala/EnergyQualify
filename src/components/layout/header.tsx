"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  Plus,
  Search,
  ChevronDown,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  CheckCircle2,
  PauseCircle,
  CalendarDays,
  Megaphone,
  Sparkles,
  Building
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { fullName, formatRelative } from "@/lib/format";
import { NAV_ITEMS } from "./sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/campagnes": "Campagnes",
  "/contacts": "Contacts",
  "/dossiers": "Dossiers qualifiés",
  "/appels": "Historique des appels",
  "/import": "Importer une liste",
  "/agent": "Script de l'agent IA",
  "/conformite": "Conformité",
  "/parametres": "Paramètres",
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const now = useAppStore((s) => s.now);

  const title = PAGE_TITLES[pathname] ?? (pathname.startsWith("/") ? "EnergyQualify AI" : "");

  const results = useMemo(() => {
    if (query.trim().length < 2) return { contacts: [], campaigns: [] };
    const q = query.toLowerCase();
    return {
      contacts: contacts
        .filter(
          (c) =>
            fullName(c).toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.city.toLowerCase().includes(q),
        )
        .slice(0, 6),
      campaigns: campaigns.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, contacts, campaigns]);

  const notifications = [
    { id: 1, title: "Dossier Qualifié", desc: "3 nouveaux dossiers prêts à fermer", when: formatRelative(now, now), tone: "success", icon: CheckCircle2 },
    { id: 2, title: "Campagne Suspendue", desc: "ClearWatt a été mis en pause", when: "il y a 3 j", tone: "warning", icon: PauseCircle },
    { id: 3, title: "Rappel Client", desc: "12 rappels programmés aujourd'hui", when: "il y a 1 j", tone: "info", icon: CalendarDays },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 lg:px-6 shadow-2xs">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <nav className="flex flex-col gap-0.5 p-3 pt-6">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="hidden lg:block">
        <h1 className="text-base font-heading font-black tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex-1 flex justify-center lg:justify-start lg:ml-6 max-w-sm">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger render={<div className="relative w-full group" />} nativeButton={false}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
            <Input
              placeholder="Rechercher... (Ctrl+K)"
              className="pl-9 pr-14 h-9 w-full rounded-full bg-muted/20 border-border/40 focus:border-primary/40 hover:bg-muted/40 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all duration-300"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(e.target.value.length >= 2);
              }}
              onFocus={() => query.length >= 2 && setSearchOpen(true)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none gap-0.5 opacity-50 group-focus-within:opacity-100 transition-opacity">
              <kbd className="text-[9px] font-mono font-bold bg-muted border border-border/50 shadow-3xs px-1.5 py-0.5 rounded">Ctrl</kbd>
              <kbd className="text-[9px] font-mono font-bold bg-muted border border-border/50 shadow-3xs px-1.5 py-0.5 rounded">K</kbd>
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-96 p-2 border-border/50 bg-card/95 backdrop-blur-md shadow-lg rounded-xl">
            {results.contacts.length === 0 && results.campaigns.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-heading font-semibold text-foreground/80">Aucun résultat</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Essayez de taper un autre terme...</p>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {results.campaigns.length > 0 && (
                  <div>
                    <p className="px-2 pb-1.5 text-[9px] font-heading font-black uppercase tracking-wider text-muted-foreground border-b border-border/30 mb-1">Campagnes</p>
                    {results.campaigns.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted text-xs font-heading font-semibold text-foreground/80 flex items-center gap-2 transition-colors"
                        onClick={() => {
                          router.push(`/campagnes/${c.id}`);
                          setSearchOpen(false);
                          setQuery("");
                        }}
                      >
                        <Megaphone className="h-3.5 w-3.5 text-primary" />
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {results.contacts.length > 0 && (
                  <div>
                    <p className="px-2 pb-1.5 text-[9px] font-heading font-black uppercase tracking-wider text-muted-foreground border-b border-border/30 mb-1">Contacts</p>
                    {results.contacts.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-2 py-2 rounded-lg hover:bg-muted text-xs font-heading font-semibold text-foreground/80 flex items-center justify-between transition-colors"
                        onClick={() => {
                          router.push(`/contacts?focus=${c.id}`);
                          setSearchOpen(false);
                          setQuery("");
                        }}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-primary/10 text-primary font-bold">
                              {c.firstName[0]}{c.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{fullName(c)}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{c.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      <div className="hidden md:block">
        <Select defaultValue="30d">
          <SelectTrigger className="h-9 w-[160px] rounded-full bg-muted/20 border-border/40 hover:bg-muted/40 transition-colors font-heading text-xs font-bold text-foreground/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d" className="text-xs font-heading">7 derniers jours</SelectItem>
            <SelectItem value="30d" className="text-xs font-heading">30 derniers jours</SelectItem>
            <SelectItem value="90d" className="text-xs font-heading">90 derniers jours</SelectItem>
            <SelectItem value="all" className="text-xs font-heading">Depuis le début</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button size="sm" className="gap-1.5 hidden sm:inline-flex rounded-full font-heading font-bold shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-100 transition-all duration-200" render={<Link href="/campagnes/nouveau" />} nativeButton={false}>
        <Plus className="h-4 w-4" />
        Campagne
      </Button>

      <Popover>
        <PopoverTrigger render={<button className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative hover:bg-muted/60 transition-colors rounded-full")} />}>
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_var(--color-destructive)] animate-pulse" />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-2 border-border/50 bg-card/95 backdrop-blur-md shadow-lg rounded-xl">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/40 mb-1">
            <p className="text-xs font-heading font-black uppercase tracking-wider text-foreground">Notifications</p>
            <span className="text-[10px] font-heading font-bold text-primary hover:underline cursor-pointer">Tout marquer lu</span>
          </div>
          <div className="space-y-0.5">
            {notifications.map((n) => {
              const Icon = n.icon;
              const toneColors: Record<string, string> = {
                success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                warning: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              };
              return (
                <div key={n.id} className="flex gap-3 items-start p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className={cn("p-1.5 rounded-lg shrink-0", toneColors[n.tone])}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-xs font-heading font-bold text-foreground/90 truncate">{n.title}</p>
                      <span className="text-[9px] text-muted-foreground shrink-0">{n.when}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">{n.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu open={profileOpen} onOpenChange={setProfileOpen}>
        <DropdownMenuTrigger render={
          <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-border/40 bg-muted/10 hover:bg-muted/30 outline-none group transition-all duration-200" />
        }>
          <div className="relative">
            <Avatar className="h-7 w-7 border border-border/50 group-hover:border-primary/40 transition-colors shadow-2xs">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-heading font-black">SL</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background shadow-xs shadow-emerald-500/50" />
          </div>
          <span className="hidden sm:inline text-xs font-heading font-bold text-foreground/80 truncate max-w-[100px]">Simon L.</span>
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground group-hover:text-foreground transition-transform duration-350 ease-out", profileOpen && "rotate-180")} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 border-border/50 bg-card/95 backdrop-blur-md rounded-xl p-1.5 shadow-lg">
          <div className="px-2 py-2 flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border border-border/30">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-heading font-black">SL</AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-heading font-black text-foreground truncate">Simon Lefèvre</p>
              <p className="text-[10px] text-muted-foreground truncate">simon@ecofix.fr</p>
            </div>
          </div>
          
          <DropdownMenuSeparator />

          <DropdownMenuLabel className="flex items-center gap-1.5 text-[9px] font-heading font-black uppercase tracking-wider text-muted-foreground/80">
            <Building className="h-3 w-3" /> Espace de travail
          </DropdownMenuLabel>
          <div className="px-1.5 py-1 flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-foreground/90">Ecofix Energie</span>
            <span className="text-[8px] font-heading font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">PRO</span>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2.5 font-heading font-semibold text-xs py-2 rounded-lg cursor-pointer">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/parametres" />} className="gap-2.5 font-heading font-semibold text-xs py-2 rounded-lg cursor-pointer">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Paramètres
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5 font-heading font-semibold text-xs py-2 rounded-lg cursor-pointer">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> Facturation
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2.5 font-heading font-semibold text-xs py-2 rounded-lg cursor-pointer">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /> FAQ & Support
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2.5 font-heading font-semibold text-xs py-2 rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
