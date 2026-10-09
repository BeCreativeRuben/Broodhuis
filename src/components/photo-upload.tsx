"use client";

import { useRef, useState } from "react";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";

import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";

/**
 * Foto bij een biscuittaart. De URL gaat mee in de winkelwagen en de
 * bestelling. Nooit een mailadres tonen.
 */
export function PhotoUpload({
  value,
  onChange,
  label = "Foto voor op de taart",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads/fototaart", {
        method: "POST",
        body,
      });
      const payload: { url?: string; error?: string } = await response.json();
      if (!response.ok || !payload.url) {
        setError(
          payload.error ??
            "De foto kon niet worden opgeladen. Probeer het opnieuw of bel de bakkerij.",
        );
        return;
      }
      onChange(payload.url);
    } catch {
      setError("De foto kon niet worden opgeladen. Probeer het opnieuw of bel de bakkerij.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <fieldset>
      <legend className="font-heading text-lg font-semibold">{label}</legend>
      <p className="mt-1 text-sm text-muted-foreground">
        Enkel bij biscuittaarten. Stuur een staande foto mee, dan bakken we die
        erin.
      </p>
      <div className="mt-3 flex items-start gap-3">
        {value ? (
          <div className="relative size-20 overflow-hidden">
            <ProductImage src={value} alt="Jouw foto voor op de taart" sizes="80px" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 min-h-12 rounded-none"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" /> Bezig…
                </>
              ) : (
                <>
                  <ImagePlusIcon className="size-4" /> Foto kiezen
                </>
              )}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                className="h-12 min-h-12 rounded-none text-muted-foreground"
                onClick={() => onChange("")}
              >
                <XIcon className="size-4" /> Weghalen
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={label}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}
