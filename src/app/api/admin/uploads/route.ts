import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/server";
import {
  imageMimeType,
  inspectImageUpload,
  type RasterImageKind,
} from "@/lib/image-bytes";
import { slugify } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED: readonly RasterImageKind[] = ["jpg", "png", "webp", "avif"];

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Productfoto's belanden in /public/uploads. Dat werkt lokaal en op een eigen
 * server met schijfruimte. Op een read-only omgeving (bv. Vercel) geeft dit een
 * duidelijke fout: gebruik daar Vercel Blob of een andere opslag — zie README.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Niet aangemeld." }, { status: 401 });
  }

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
      { error: "Kies een JPG, PNG, WebP of AVIF." },
      { status: 415 },
    );
  }

  const extension = inspected.kind;
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "foto";
  const fileName = `${baseName}-${randomUUID().slice(0, 8)}.${extension}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const payload = Buffer.from(bytes);

  if (token) {
    try {
      const { put } = await import("@vercel/blob");
      const stored = await put(`producten/${fileName}`, payload, {
        access: "public",
        token,
        addRandomSuffix: false,
        contentType: imageMimeType(extension),
      });
      return NextResponse.json({ url: stored.url });
    } catch (error) {
      console.error("[broodhuis] Blob-upload mislukte:", error);
      return NextResponse.json(
        {
          error:
            "De foto kon niet naar Vercel Blob. Plak in plaats daarvan de link naar een foto.",
        },
        { status: 500 },
      );
    }
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, fileName), payload);
  } catch (error) {
    console.error("[broodhuis] Upload mislukte:", error);
    return NextResponse.json(
      {
        error:
          "Deze server kan geen bestanden opslaan. Plak in plaats daarvan de link naar een foto, of stel Vercel Blob in (zie README).",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: `/uploads/${fileName}` });
}
