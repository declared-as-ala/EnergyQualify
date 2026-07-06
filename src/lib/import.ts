import * as XLSX from "xlsx";

export const INTERNAL_FIELDS = [
  { key: "civility", label: "Civilité", required: false },
  { key: "firstName", label: "Prénom", required: true },
  { key: "lastName", label: "Nom", required: true },
  { key: "address", label: "Adresse", required: true },
  { key: "postalCode", label: "Code postal", required: true },
  { key: "city", label: "Ville", required: true },
  { key: "phone", label: "Téléphone", required: true },
  { key: "ageRange", label: "Tranche d'âge", required: false },
] as const;

export type InternalFieldKey = (typeof INTERNAL_FIELDS)[number]["key"];
export type ColumnMapping = Partial<Record<InternalFieldKey, number>>;

const HEADER_HINTS: Record<InternalFieldKey, string[]> = {
  civility: ["civilite", "civilité", "titre", "genre"],
  firstName: ["prenom", "prénom", "firstname", "first name"],
  lastName: ["nom", "lastname", "last name", "nom de famille"],
  address: ["adresse", "address", "rue"],
  postalCode: ["code postal", "cp", "postal", "zip"],
  city: ["ville", "city", "localite", "localité", "commune"],
  phone: ["telephone", "téléphone", "tel", "phone", "gsm", "mobile"],
  ageRange: ["tranche d'age", "tranche d'âge", "age", "âge"],
};

export interface ParsedSpreadsheet {
  fileName: string;
  rows: string[][];
  hasHeader: boolean;
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
  const rows = raw.map((r) => r.map((cell) => String(cell ?? "").trim())).filter((r) => r.some((c) => c.length > 0));

  const firstRow = rows[0] ?? [];
  const looksLikeHeader = firstRow.some((cell) => {
    const c = cell.toLowerCase();
    return Object.values(HEADER_HINTS).some((hints) => hints.some((h) => c.includes(h)));
  });

  return { fileName: file.name, rows, hasHeader: looksLikeHeader };
}

export function guessMapping(rows: string[][], hasHeader: boolean): ColumnMapping {
  const mapping: ColumnMapping = {};
  const columnCount = rows[0]?.length ?? 0;

  if (hasHeader) {
    const header = rows[0].map((h) => h.toLowerCase());
    for (const field of INTERNAL_FIELDS) {
      const idx = header.findIndex((h) => HEADER_HINTS[field.key].some((hint) => h.includes(hint)));
      if (idx >= 0) mapping[field.key] = idx;
    }
    return mapping;
  }

  // No header detected: fall back to the known "pour yanis.xlsx" positional layout when the
  // column count matches, otherwise map fields to columns in declaration order.
  if (columnCount === 8) {
    const order: InternalFieldKey[] = ["civility", "lastName", "firstName", "postalCode", "city", "address", "phone", "ageRange"];
    order.forEach((key, i) => (mapping[key] = i));
  } else {
    INTERNAL_FIELDS.forEach((field, i) => {
      if (i < columnCount) mapping[field.key] = i;
    });
  }
  return mapping;
}

export interface CleanedContactRow {
  rowIndex: number;
  civility?: string;
  firstName: string;
  lastName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  ageRange?: string;
  isDuplicate: boolean;
  isBrusselsGuess: boolean;
  missingPhone: boolean;
  isInvalid: boolean;
  issues: string[];
}

export function isBrusselsPostal(postalCode: string): boolean {
  const n = parseInt(postalCode, 10);
  return Number.isFinite(n) && n >= 1000 && n <= 1299;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export interface ImportValidationResult {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  missingPhone: number;
  brusselsRows: number;
  invalidRows: number;
  cleaned: CleanedContactRow[];
}

export function validateRows(
  rows: string[][],
  mapping: ColumnMapping,
  hasHeader: boolean,
  existingPhones: Set<string>,
): ImportValidationResult {
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const seenPhones = new Map<string, number>();
  const cleaned: CleanedContactRow[] = [];

  const get = (row: string[], key: InternalFieldKey) => (mapping[key] !== undefined ? (row[mapping[key]!] ?? "").trim() : "");

  dataRows.forEach((row, i) => {
    const phoneRaw = get(row, "phone");
    const phoneNorm = normalizePhone(phoneRaw);
    const firstName = get(row, "firstName");
    const lastName = get(row, "lastName");
    const address = get(row, "address");
    const postalCode = get(row, "postalCode");
    const city = get(row, "city");
    const civility = get(row, "civility") || undefined;
    const ageRange = get(row, "ageRange") || undefined;

    const issues: string[] = [];
    const missingPhone = phoneNorm.length === 0;
    if (missingPhone) issues.push("Téléphone manquant");
    const invalidPhone = !missingPhone && (phoneNorm.length < 8 || phoneNorm.length > 12);
    if (invalidPhone) issues.push("Format de téléphone invalide");
    if (!firstName) issues.push("Prénom manquant");
    if (!lastName) issues.push("Nom manquant");
    if (!address) issues.push("Adresse manquante");
    if (!postalCode) issues.push("Code postal manquant");
    if (!city) issues.push("Ville manquante");

    const isDuplicateInFile = phoneNorm.length > 0 && seenPhones.has(phoneNorm);
    const isDuplicateExisting = phoneNorm.length > 0 && existingPhones.has(phoneNorm);
    const isDuplicate = isDuplicateInFile || isDuplicateExisting;
    if (isDuplicate) issues.push("Doublon (numéro déjà présent)");
    if (phoneNorm.length > 0) seenPhones.set(phoneNorm, (seenPhones.get(phoneNorm) ?? 0) + 1);

    const isBrusselsGuess = isBrusselsPostal(postalCode);

    const isInvalid = missingPhone || invalidPhone || !firstName || !lastName || !address || !postalCode || !city;

    cleaned.push({
      rowIndex: i,
      civility,
      firstName,
      lastName,
      address,
      postalCode,
      city,
      phone: phoneRaw,
      ageRange,
      isDuplicate,
      isBrusselsGuess,
      missingPhone,
      isInvalid,
      issues,
    });
  });

  return {
    totalRows: cleaned.length,
    validRows: cleaned.filter((r) => !r.isInvalid && !r.isDuplicate).length,
    duplicateRows: cleaned.filter((r) => r.isDuplicate).length,
    missingPhone: cleaned.filter((r) => r.missingPhone).length,
    brusselsRows: cleaned.filter((r) => r.isBrusselsGuess).length,
    invalidRows: cleaned.filter((r) => r.isInvalid).length,
    cleaned,
  };
}
