export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
  }
  return phone;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string | undefined, nowIso: string): string {
  if (!iso) return "—";
  const diffMs = new Date(nowIso).getTime() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (Math.abs(diffMin) < 1) return "à l'instant";
  const future = diffMin < 0;
  const abs = Math.abs(diffMin);
  let value: string;
  if (abs < 60) value = `${abs} min`;
  else if (abs < 60 * 24) value = `${Math.round(abs / 60)} h`;
  else value = `${Math.round(abs / (60 * 24))} j`;
  return future ? `dans ${value}` : `il y a ${value}`;
}

export function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function maskAddress(address: string): string {
  const parts = address.split(" ");
  if (parts.length <= 1) return "•••• ••••";
  return parts
    .map((p, i) => (i === parts.length - 1 ? "••" : p))
    .join(" ");
}

export function maskEan(ean: string | undefined): string {
  if (!ean) return "—";
  return `•••• •••• •••• ${ean.slice(-4)}`;
}

export function maskDateOfBirth(dob: string | undefined): string {
  if (!dob) return "—";
  return `••/••/${dob.slice(-4)}`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function fullName(c: { firstName: string; lastName: string; civility?: string }): string {
  return `${c.firstName} ${c.lastName}`;
}
