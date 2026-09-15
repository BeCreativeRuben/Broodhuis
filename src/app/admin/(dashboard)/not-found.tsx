import { ButtonLink } from "@/components/ui/button-link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="font-heading text-2xl font-semibold">Niet gevonden</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Dit product, deze categorie of deze bestelling bestaat niet (meer).
      </p>
      <ButtonLink href="/admin" className="mt-5 h-11 rounded-full px-5">
        Terug naar het overzicht
      </ButtonLink>
    </div>
  );
}
