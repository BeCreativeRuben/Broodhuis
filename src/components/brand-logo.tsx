import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Officieel woordmerk van bakkerij-tbroodhuis.be — het zwarte
 * kalligrafische "'t Broodhuis".
 */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo-zwart.png"
      alt="'t Broodhuis"
      width={842}
      height={351}
      priority={priority}
      className={cn("h-10 w-auto lg:h-12", className)}
    />
  );
}

/** Rond icoon, voor favicon-achtige plekken (admin, login). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/icon-180.jpg"
      alt=""
      width={180}
      height={180}
      className={cn("size-10 rounded-full bg-white object-cover", className)}
    />
  );
}
