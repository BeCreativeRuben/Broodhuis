"use client";

import { useRef, useState } from "react";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";

import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageUpload({
  name,
  defaultValue,
  productName,
}: {
  name: string;
  defaultValue: string | null;
  productName: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });
      const payload: { url?: string; error?: string } = await response.json();

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "De foto kon niet opgeslagen worden.");
        return;
      }
      setValue(payload.url);
    } catch {
      setError("De foto kon niet opgeslagen worden. Probeer het opnieuw.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={`${name}-url`}>Foto</Label>

      <div className="flex items-start gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary">
          <ProductImage src={value} alt={productName || "Productfoto"} sizes="96px" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" /> Bezig met
                  opladen…
                </>
              ) : (
                <>
                  <ImagePlusIcon className="size-4" /> Foto kiezen
                </>
              )}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-muted-foreground"
                onClick={() => setValue("")}
              >
                <XIcon className="size-4" /> Weghalen
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />

          <Input
            id={`${name}-url`}
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="/uploads/foto.jpg of https://…"
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG of WebP tot 5 MB. Je kan ook de link naar een foto plakken.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
