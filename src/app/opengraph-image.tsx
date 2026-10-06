import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { SHOP } from "@/lib/shop-config";

export const alt = `${SHOP.name} — vers brood en gebak in ${SHOP.city}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(
    join(process.cwd(), "public/brand/logo-zwart.png"),
  );
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffcf6",
        }}
      >
        <div
          style={{
            width: 1136,
            height: 566,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#fffcf6",
            border: "24px solid #ece8de",
          }}
        >
          <img src={logoSrc} height={150} alt="" />
          <div
            style={{
              display: "flex",
              marginTop: 36,
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#6b645b",
            }}
          >
            {SHOP.tagline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 28,
              color: "#121313",
            }}
          >
            {SHOP.city} · online bestellen
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
