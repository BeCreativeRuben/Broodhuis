import Image from "next/image";

import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Productfoto's kunnen uit drie hoeken komen: meegeleverde bestanden in
 * /public, een upload van de bakker in /public/uploads, of een externe URL die
 * ze in de admin plakt. Voor de eerste twee gebruiken we next/image; een
 * externe URL laten we gewoon door de browser laden, zodat de bakker niet eerst
 * een domein moet whitelisten in next.config.ts.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
}: ProductImageProps) {
  if (!src || src.trim() === "") {
    return <ProductImageFallback alt={alt} className={className} />;
  }

  const isLocal = src.startsWith("/");

  if (isLocal) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- externe URL uit de admin, bewust zonder optimalisatie
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("absolute inset-0 size-full object-cover", className)}
    />
  );
}

export function ProductImageFallback({
  className,
}: {
  alt?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-background",
        className,
      )}
    >
      <Image
        src="/brand/logo-zwart.png"
        alt=""
        width={168}
        height={70}
        className="h-[28%] w-auto max-h-12 opacity-[0.14]"
      />
    </div>
  );
}
