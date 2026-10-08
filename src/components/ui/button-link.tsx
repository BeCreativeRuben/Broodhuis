import Link from "next/link";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  className?: string;
  children?: React.ReactNode;
  /** Alleen voor interne routes. `false` voorkomt dat Next de link al ophaalt. */
  prefetch?: boolean;
} & VariantProps<typeof buttonVariants> &
  Omit<React.ComponentProps<"a">, "href" | "className">;

/**
 * Een link die eruitziet als een knop. Bewust géén <Button> met een link erin:
 * Base UI verwacht daar een echt <button>, en een link die zich als knop
 * voordoet verwart schermlezers en toetsenbordgebruik.
 *
 * Interne paden gaan via next/link (met prefetch), tel:- en mailto:-links en
 * externe adressen via een gewone <a>.
 */
export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  prefetch,
  ...props
}: ButtonLinkProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  const isInternalRoute = href.startsWith("/") && !href.startsWith("//");

  if (isInternalRoute) {
    return (
      <Link href={href} className={classes} prefetch={prefetch} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...props}>
      {children}
    </a>
  );
}
