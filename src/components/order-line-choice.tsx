import { extractPhotoUrls } from "@/lib/product-images";

export function OrderLineChoice({
  variantLabel,
}: {
  variantLabel?: string | null;
}) {
  if (!variantLabel) return null;
  const photos = extractPhotoUrls(variantLabel);
  const text = photos.reduce(
    (current, url) => current.replace(url, "foto bijgevoegd"),
    variantLabel,
  );

  return (
    <span className="block text-xs text-muted-foreground">
      <span>{text}</span>
      {photos.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Foto voor op de taart"
            className="max-h-40 w-auto object-cover"
          />
        </a>
      ))}
    </span>
  );
}
