"use client";

import { useState } from "react";

import { ProductImage } from "@/components/product-image";
import { parseProductImages } from "@/lib/product-images";
import { cn } from "@/lib/utils";

export function ProductGallery({
  imageUrl,
  extraUrls,
  alt,
  priority = false,
}: {
  imageUrl: string | null | undefined;
  extraUrls?: string[];
  alt: string;
  priority?: boolean;
}) {
  const images =
    extraUrls && extraUrls.length > 0
      ? extraUrls
      : parseProductImages(imageUrl);
  const unique = images.filter((url, index) => images.indexOf(url) === index);
  const [active, setActive] = useState(0);
  const current = unique[active] ?? unique[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/5 overflow-hidden">
        <ProductImage
          src={current}
          alt={alt}
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
      {unique.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="Productfoto's">
          {unique.map((url, index) => (
            <button
              key={url}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={cn(
                "relative size-16 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-20",
                index === active ? "ring-2 ring-primary ring-offset-2" : "opacity-80",
              )}
            >
              <ProductImage src={url} alt="" sizes="80px" />
              <span className="sr-only">Foto {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
