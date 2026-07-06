// Fixed "now" anchor so all generated relative timestamps are deterministic
// between server render and client hydration.
export const NOW = new Date("2026-07-06T10:00:00.000Z");

export function isoDaysAgo(days: number, hourOffset = 0): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(9 + hourOffset, (hourOffset * 37) % 60, 0, 0);
  return d.toISOString();
}

export function isoDaysFromNow(days: number, hourOffset = 0): string {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(9 + hourOffset, (hourOffset * 23) % 60, 0, 0);
  return d.toISOString();
}

export const SUPPLIERS = [
  "Engie",
  "Luminus",
  "TotalEnergies",
  "Mega Energie",
  "Octa+",
  "Bolt Energie",
  "Trevion",
  "Aspiravi Energy",
];

export const BRUSSELS_LOCATIONS: { city: string; postalCode: string }[] = [
  { city: "Bruxelles", postalCode: "1000" },
  { city: "Ixelles", postalCode: "1050" },
  { city: "Saint-Gilles", postalCode: "1060" },
  { city: "Schaerbeek", postalCode: "1030" },
  { city: "Jette", postalCode: "1090" },
  { city: "Evere", postalCode: "1140" },
  { city: "Uccle", postalCode: "1180" },
  { city: "Anderlecht", postalCode: "1070" },
  { city: "Woluwe-Saint-Lambert", postalCode: "1200" },
  { city: "Molenbeek-Saint-Jean", postalCode: "1080" },
];

export const BRUSSELS_STREETS = [
  "Rue de la Loi",
  "Chaussée d'Ixelles",
  "Avenue Louise",
  "Rue Neuve",
  "Chaussée de Waterloo",
  "Rue du Midi",
  "Avenue de Tervueren",
  "Rue Antoine Dansaert",
];

export const CLOSERS = [
  { id: "closer-1", name: "Camille Dubuisson" },
  { id: "closer-2", name: "Yanis Bertrand" },
  { id: "closer-3", name: "Sophie Lambert" },
];
