export type RasterImageKind = "jpg" | "png" | "webp" | "avif";

export type ImageUploadRejection = "empty" | "too-large" | "unsupported";

const MIME: Record<RasterImageKind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, index) => bytes[index] === byte);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  if (bytes.length < start + length) return "";
  let value = "";
  for (let index = start; index < start + length; index += 1) {
    value += String.fromCharCode(bytes[index] ?? 0);
  }
  return value;
}

/** Soort op basis van de bytes, niet op de Content-Type die de browser meestuurt. */
export function detectRasterImage(bytes: Uint8Array): RasterImageKind | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (brand === "avif" || brand === "avis") return "avif";
  }
  return null;
}

export function imageMimeType(kind: RasterImageKind): string {
  return MIME[kind];
}

export function inspectImageUpload(
  bytes: Uint8Array,
  declaredSize: number,
  maxBytes: number,
  allowed: readonly RasterImageKind[],
): { kind: RasterImageKind } | { error: ImageUploadRejection } {
  if (declaredSize <= 0 || bytes.byteLength === 0) return { error: "empty" };
  if (declaredSize > maxBytes || bytes.byteLength > maxBytes) return { error: "too-large" };
  if (bytes.byteLength !== declaredSize) return { error: "unsupported" };

  const kind = detectRasterImage(bytes);
  if (!kind || !allowed.includes(kind)) return { error: "unsupported" };
  return { kind };
}
