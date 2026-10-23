import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  imageMimeType,
  inspectImageUpload,
  type RasterImageKind,
} from "@/lib/image-bytes";
import { slugify } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: readonly RasterImageKind[] = ["jpg", "png", "webp"];

/**
 * Klantupload voor een biscuittaart. Gaat naar Vercel Blob als de token
 * er is; anders een duidelijke fout zonder mailadres.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ongeldige upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand gekozen." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const inspected = inspectImageUpload(bytes, file.size, MAX_BYTES, ALLOWED);
  if ("error" in inspected) {
    if (inspected.error === "too-large") {
      return NextResponse.json(
        { error: "Die foto is groter dan 5 MB. Maak ze wat kleiner." },
        { status: 413 },
      );
    }
    if (inspected.error === "empty") {
      return NextResponse.json({ error: "Geen bestand gekozen." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Kies een JPG, PNG of WebP." },
      { status: 415 },
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json(
      {
        error:
          "Foto meesturen lukt hier nog niet. Bel de bakkerij, dan zetten we het manueel in orde.",
      },
      { status: 503 },
    );
  }

  const extension = inspected.kind;
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "fototaart";
  const fileName = `fototaarten/${baseName}-${randomUUID().slice(0, 8)}.${extension}`;

  try {
    const { put } = await import("@vercel/blob");
    const stored = await put(fileName, Buffer.from(bytes), {
      access: "public",
      token,
      addRandomSuffix: false,
      contentType: imageMimeType(extension),
    });
    return NextResponse.json({ url: stored.url });
  } catch (error) {
    console.error("[broodhuis] Fototaart-upload mislukte:", error);
    return NextResponse.json(
      {
        error:
          "De foto kon niet worden opgeladen. Probeer het opnieuw of bel de bakkerij.",
      },
      { status: 500 },
    );
  }
}
