"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ArrowUpDown,
  Download,
  MoreHorizontal,
  Search,
  ShieldOff,
  Megaphone,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ContactStatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { ContactDetailSheet } from "@/components/contacts/contact-detail-sheet";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";
import type { Contact, ContactStatus } from "@/lib/types";
import { CONTACT_STATUS_META } from "@/lib/status";
import { formatRelative, fullName, initials } from "@/lib/format";
import { campaignById } from "@/lib/selectors";

function ContactsPageInner() {
  const searchParams = useSearchParams();
  const contacts = useAppStore((s) => s.contacts);
  const campaigns = useAppStore((s) => s.campaigns);
  const now = useAppStore((s) => s.now);
  const assignContactsToCampaign = useAppStore((s) => s.assignContactsToCampaign);
  const markDoNotContact = useAppStore((s) => s.markDoNotContact);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(searchParams.get("focus"));
  const [detailOpen, setDetailOpen] = useState(Boolean(searchParams.get("focus")));
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCampaignId, setAssignCampaignId] = useState<string>(campaigns[0]?.id ?? "");
  const [dncOpen, setDncOpen] = useState(false);
  const [dncReason, setDncReason] = useState("Demande explicite lors d'un appel précédent.");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (campaignFilter === "none" && c.campaignId) return false;
      if (campaignFilter !== "all" && campaignFilter !== "none" && c.campaignId !== campaignFilter) return false;
      if (ageFilter !== "all" && c.ageRange !== ageFilter) return false;
      if (q.length > 0) {
        const haystack = `${fullName(c)} ${c.phone} ${c.city} ${c.postalCode}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, search, statusFilter, campaignFilter, ageFilter]);

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            onClick={(e) => e.stopPropagation()}
            aria-label="Tout sélectionner"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            onClick={(e) => e.stopPropagation()}
            aria-label="Sélectionner"
          />
        ),
        enableSorting: false,
        size: 36,
      },
      {
        id: "contact",
        header: "Contact",
        accessorFn: (c) => fullName(c),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">{initials(c.firstName, c.lastName)}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">{fullName(c)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "phone",
        header: "Téléphone",
        cell: ({ row }) => <span className="tabular-nums">{row.original.phone}</span>,
      },
      { accessorKey: "city", header: "Ville" },
      { accessorKey: "postalCode", header: "Code postal" },
      {
        id: "campaign",
        header: "Campagne",
        accessorFn: (c) => (c.campaignId ? campaignById(campaigns, c.campaignId)?.name ?? "—" : "—"),
        cell: ({ row }) => {
          const c = row.original;
          const camp = c.campaignId ? campaignById(campaigns, c.campaignId) : undefined;
          return <span className="text-muted-foreground">{camp?.name ?? "Non assigné"}</span>;
        },
      },
      {
        id: "lastActivity",
        header: "Dernière activité",
        accessorFn: (c) => c.lastActivityAt ?? c.createdAt,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatRelative(row.original.lastActivityAt ?? row.original.createdAt, now)}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Statut",
        cell: ({ row }) => <ContactStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "score",
        header: "Score",
        cell: ({ row }) => <span className="tabular-nums">{row.original.score || "—"}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setDetailId(row.original.id); setDetailOpen(true); }}>
                Ouvrir le profil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => markDoNotContact([row.original.id], "Marqué depuis la liste des contacts.")}
              >
                Ne pas contacter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 40,
      },
    ],
    [campaigns, now, markDoNotContact],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const ageRanges = Array.from(new Set(contacts.map((c) => c.ageRange).filter(Boolean))) as string[];

  function exportSelection() {
    const rows = contacts.filter((c) => selectedIds.includes(c.id));
    const header = ["Prénom", "Nom", "Téléphone", "Ville", "Code postal", "Statut", "Campagne"];
    const lines = rows.map((c) =>
      [
        c.firstName,
        c.lastName,
        c.phone,
        c.city,
        c.postalCode,
        CONTACT_STATUS_META[c.status].label,
        c.campaignId ? campaignById(campaigns, c.campaignId)?.name ?? "" : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} contact(s) exporté(s)`, {
      description: "Export sécurisé — ce fichier contient des données personnelles, traitez-le conformément à votre politique de confidentialité.",
    });
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contacts au total · ${filtered.length} affichés`}
      />

      <div className="flex flex-col lg:flex-row gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un nom, téléphone, ville…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "all")}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {(Object.keys(CONTACT_STATUS_META) as ContactStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {CONTACT_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={campaignFilter} onValueChange={(val) => setCampaignFilter(val ?? "all")}>
          <SelectTrigger className="w-full lg:w-56">
            <SelectValue placeholder="Campagne" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les campagnes</SelectItem>
            <SelectItem value="none">Non assigné</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={(val) => setAgeFilter(val ?? "all")}>
          <SelectTrigger className="w-full lg:w-40">
            <SelectValue placeholder="Âge" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout âge</SelectItem>
            {ageRanges.map((a) => (
              <SelectItem key={a} value={a}>
                {a} ans
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <span className="text-sm font-medium">{selectedIds.length} sélectionné(s)</span>
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <Megaphone className="h-3.5 w-3.5" /> Assigner à une campagne
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDncOpen(true)}>
              <ShieldOff className="h-3.5 w-3.5" /> Marquer Ne pas contacter
            </Button>
            <Button size="sm" variant="outline" onClick={exportSelection}>
              <Download className="h-3.5 w-3.5" /> Exporter la sélection
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setRowSelection({})}>
              Désélectionner
            </Button>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun contact ne correspond à ces filtres"
          description="Essayez d'élargir votre recherche ou de réinitialiser les filtres."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={() => {
                      setDetailId(row.original.id);
                      setDetailOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount() || 1}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      )}

      <ContactDetailSheet contactId={detailId} open={detailOpen} onOpenChange={setDetailOpen} />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner à une campagne</DialogTitle>
            <DialogDescription>{selectedIds.length} contact(s) seront affectés à la campagne sélectionnée.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Campagne</Label>
            <Select value={assignCampaignId} onValueChange={(val) => setAssignCampaignId(val ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                assignContactsToCampaign(selectedIds, assignCampaignId);
                setAssignOpen(false);
                setRowSelection({});
                toast.success(`${selectedIds.length} contact(s) assigné(s)`);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dncOpen} onOpenChange={setDncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer « Ne pas contacter »</DialogTitle>
            <DialogDescription>
              {selectedIds.length} contact(s) ne seront plus jamais appelés, quelle que soit la campagne.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-dnc-reason">Motif</Label>
            <Input id="bulk-dnc-reason" value={dncReason} onChange={(e) => setDncReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDncOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                markDoNotContact(selectedIds, dncReason);
                setDncOpen(false);
                setRowSelection({});
                toast.success(`${selectedIds.length} contact(s) marqué(s) Ne pas contacter`);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={null}>
      <ContactsPageInner />
    </Suspense>
  );
}
