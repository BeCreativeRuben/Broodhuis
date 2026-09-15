"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[broodhuis] Fout in de webshop:", error);
  }, [error]);

  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlertIcon className="size-7" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold">
        Er ging iets mis
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Sorry, deze pagina kon niet geladen worden. Probeer het opnieuw — je
        winkelwagen blijft bewaard.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          onClick={reset}
          className="h-12 rounded-full px-6 text-base"
        >
          <RefreshCwIcon className="size-4" /> Opnieuw proberen
        </Button>
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="h-12 rounded-full px-6 text-base"
        >
          Naar de startpagina
        </Button>
      </div>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Referentie: {error.digest}
        </p>
      )}
    </div>
  );
}
