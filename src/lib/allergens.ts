/**
 * De 14 wettelijk verplichte allergenen (EU-verordening 1169/2011),
 * met de Nederlandse benamingen die op een Belgisch bakkerijlabel horen.
 * In de database worden de codes komma-gescheiden bewaard, zodat hetzelfde
 * model op SQLite én Postgres werkt.
 */
export const ALLERGENS = [
  { code: "gluten", label: "Glutenbevattende granen", short: "Gluten" },
  { code: "eieren", label: "Eieren", short: "Eieren" },
  { code: "melk", label: "Melk (incl. lactose)", short: "Melk" },
  { code: "noten", label: "Noten (schaalvruchten)", short: "Noten" },
  { code: "pinda", label: "Pinda's", short: "Pinda" },
  { code: "soja", label: "Soja", short: "Soja" },
  { code: "sesam", label: "Sesamzaad", short: "Sesam" },
  { code: "lupine", label: "Lupine", short: "Lupine" },
  { code: "selderij", label: "Selderij", short: "Selderij" },
  { code: "mosterd", label: "Mosterd", short: "Mosterd" },
  { code: "sulfiet", label: "Zwaveldioxide en sulfieten", short: "Sulfiet" },
  { code: "vis", label: "Vis", short: "Vis" },
  { code: "schaaldieren", label: "Schaaldieren", short: "Schaaldieren" },
  { code: "weekdieren", label: "Weekdieren", short: "Weekdieren" },
] as const;

export type AllergenCode = (typeof ALLERGENS)[number]["code"];

const BY_CODE = new Map(ALLERGENS.map((allergen) => [allergen.code, allergen]));

export function isAllergenCode(value: string): value is AllergenCode {
  return BY_CODE.has(value as AllergenCode);
}

/** "gluten,melk" -> ["gluten", "melk"], onbekende codes worden genegeerd */
export function parseAllergens(value: string | null | undefined): AllergenCode[] {
  if (!value) return [];
  const seen = new Set<AllergenCode>();
  for (const part of value.split(",")) {
    const code = part.trim().toLowerCase();
    if (isAllergenCode(code)) seen.add(code);
  }
  // Bewaar de wettelijke volgorde in plaats van de invoervolgorde
  return ALLERGENS.filter((allergen) => seen.has(allergen.code)).map(
    (allergen) => allergen.code,
  );
}

export function serialiseAllergens(codes: readonly string[]): string {
  return parseAllergens(codes.join(",")).join(",");
}

export function allergenLabel(code: AllergenCode): string {
  return BY_CODE.get(code)?.label ?? code;
}

export function allergenShortLabel(code: AllergenCode): string {
  return BY_CODE.get(code)?.short ?? code;
}

/** "Gluten, Melk, Noten" — voor compacte weergave in lijsten en e-mails */
export function allergenSummary(value: string | null | undefined): string {
  const codes = parseAllergens(value);
  if (codes.length === 0) return "";
  return codes.map(allergenShortLabel).join(", ");
}
