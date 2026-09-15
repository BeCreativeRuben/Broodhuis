import { ALLERGENS, allergenLabel, type AllergenCode } from "@/lib/allergens";

export function AllergenList({ codes }: { codes: AllergenCode[] }) {
  if (codes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Voor dit product zijn geen van de 14 wettelijke allergenen aangeduid.
        Twijfel je? Bel ons even.
      </p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {codes.map((code) => (
        <li
          key={code}
          className="flex items-center gap-2 rounded-lg bg-secondary/70 px-3 py-2 text-sm"
        >
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-crust" />
          {allergenLabel(code)}
        </li>
      ))}
    </ul>
  );
}

/** Compacte lijst met alle 14 allergenen — voor de infopagina. */
export function AllergenReference() {
  return (
    <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
      {ALLERGENS.map((allergen) => (
        <li key={allergen.code}>{allergen.label}</li>
      ))}
    </ul>
  );
}
