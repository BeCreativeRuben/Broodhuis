"use client";

import { useRouter } from "next/navigation";

import { rememberFulfillment } from "@/components/checkout/checkout-draft";
import { ButtonLink } from "@/components/ui/button-link";
import type { FulfillmentType } from "@/lib/shop-config";

/**
 * Start een bestelling. Een gewone klik onthoudt afhalen of leveren en opent
 * het assortiment. Openen in een nieuw tabblad volgt de href; de middleware
 * zet dan dezelfde keuze.
 */
export function StartOrderLink({
  intent,
  className,
  children,
}: {
  intent: FulfillmentType;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const href =
    intent === "delivery" ? "/bestellen?levering=1" : "/bestellen?levering=0";

  return (
    <ButtonLink
      href={href}
      prefetch={false}
      variant={intent === "delivery" ? "outline" : "default"}
      size="lg"
      className={className}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        event.preventDefault();
        rememberFulfillment(intent);
        router.push("/assortiment");
      }}
    >
      {children}
    </ButtonLink>
  );
}
