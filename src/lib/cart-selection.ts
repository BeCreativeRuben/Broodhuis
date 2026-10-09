import { isAllowedCustomerPhotoUrl } from "@/lib/product-images";

/**
 * Extra keuze bij een lijn (opschrift, personen, deeg, fototaart),
 * los van een ProductVariant-rij. De server laat alleen bekende velden door.
 */
export type CartSelection = {
  personen?: string;
  deeg?: string;
  opschrift?: string;
  photoUrl?: string;
};

const PERSONEN = /^(4|6|8|10|12) personen$/;
const DEEG = /^(Bladerdeeg|Zanddeeg)$/;
const OPSCHRIFT_MAX = 80;

export function parseCartSelection(raw: unknown): CartSelection | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const input = raw as Record<string, unknown>;
  const selection: CartSelection = {};

  if (typeof input.personen === "string" && PERSONEN.test(input.personen.trim())) {
    selection.personen = input.personen.trim();
  }
  if (typeof input.deeg === "string" && DEEG.test(input.deeg.trim())) {
    selection.deeg = input.deeg.trim();
  }
  if (typeof input.opschrift === "string") {
    const text = input.opschrift.trim().slice(0, OPSCHRIFT_MAX);
    if (text !== "") selection.opschrift = text;
  }
  if (typeof input.photoUrl === "string" && isAllowedCustomerPhotoUrl(input.photoUrl)) {
    selection.photoUrl = input.photoUrl;
  }

  return Object.keys(selection).length > 0 ? selection : undefined;
}

export function selectionKey(selection?: CartSelection | null): string {
  if (!selection) return "";
  return [
    selection.personen ?? "",
    selection.deeg ?? "",
    selection.opschrift ?? "",
    selection.photoUrl ?? "",
  ].join("|");
}

export function formatSelectionLabel(selection?: CartSelection | null): string | null {
  if (!selection) return null;
  const parts: string[] = [];
  if (selection.personen) parts.push(selection.personen);
  if (selection.deeg) parts.push(selection.deeg);
  if (selection.opschrift) parts.push(`Opschrift: ${selection.opschrift}`);
  if (selection.photoUrl) parts.push(`Foto: ${selection.photoUrl}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatSelectionSummary(selection?: CartSelection | null): string | null {
  if (!selection) return null;
  const parts: string[] = [];
  if (selection.personen) parts.push(selection.personen);
  if (selection.deeg) parts.push(selection.deeg);
  if (selection.opschrift) parts.push(`Opschrift: ${selection.opschrift}`);
  if (selection.photoUrl) parts.push("Foto bijgevoegd");
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function combineVariantLabel(
  variantLabel: string | null | undefined,
  selection?: CartSelection | null,
): string | null {
  const extra = formatSelectionLabel(selection);
  if (variantLabel && extra) return `${variantLabel} · ${extra}`;
  return variantLabel || extra || null;
}

/** Zelfde tekst als op de bestelling, maar zonder de ruwe fotolink. */
export function combineVariantSummary(
  variantLabel: string | null | undefined,
  selection?: CartSelection | null,
): string | null {
  const extra = formatSelectionSummary(selection);
  if (variantLabel && extra) return `${variantLabel} · ${extra}`;
  return variantLabel || extra || null;
}
