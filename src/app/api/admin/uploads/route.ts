import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/server";
import { slugify } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

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

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Kies een JPG, PNG, WebP of AVIF." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Die foto is groter dan 5 MB. Maak ze wat kleiner." },
      { status: 413 },
    );
  }

  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "foto";
  const fileName = `${baseName}-${randomUUID().slice(0, 8)}.${extension}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(UPLOAD_DIR, fileName),
      Buffer.from(await file.arrayBuffer()),
    );
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
