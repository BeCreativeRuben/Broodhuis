import { CroissantIcon } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { SHOP } from "@/lib/shop-config";

export function NotFoundContent() {
  return (
    <div className="page-shell flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="eyebrow">404</p>
      <span className="mt-4 flex size-16 items-center justify-center bg-secondary text-crust">
        <CroissantIcon className="size-7" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold">
        Deze pagina bestaat niet
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Misschien is het product uit het assortiment gehaald, of klopt de link
        niet meer. Bekijk gerust wat er vandaag wél in de rekken ligt.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink
          href="/assortiment"
          className="h-12 rounded-none px-6 text-base"
        >
          Naar het assortiment
        </ButtonLink>
        <ButtonLink
          href={`tel:${SHOP.phoneHref}`}
          variant="outline"
          className="h-12 rounded-none px-6 text-base"
        >
          Bel {SHOP.phone}
        </ButtonLink>
      </div>
    </div>
  );
}
