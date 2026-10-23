import assert from "node:assert/strict";
import test from "node:test";

import { allowsDevAuthFallback, safeAdminNextPath } from "../src/lib/auth/session";
import { detectRasterImage, inspectImageUpload } from "../src/lib/image-bytes";
import { mayApplyPaidStatus } from "../src/lib/payments/consistency";
import { isAllowedPaymentRedirect } from "../src/lib/payments/redirect";
import {
  isDisplayableImageSrc,
  isOptimizableLocalImage,
} from "../src/lib/product-images";
import { productSchema } from "../src/lib/validation";

const SITE = "https://shop.example";

test("dev-login blijft dicht in productie en op een publieke Vercel-omgeving", () => {
  assert.equal(allowsDevAuthFallback({ NODE_ENV: "development" }), true);
  assert.equal(allowsDevAuthFallback({ NODE_ENV: "production" }), false);
  assert.equal(
    allowsDevAuthFallback({ NODE_ENV: "development", VERCEL_ENV: "preview" }),
    false,
  );
  assert.equal(
    allowsDevAuthFallback({ NODE_ENV: "development", VERCEL_ENV: "production" }),
    false,
  );
});

test("admin-redirect blijft binnen /admin", () => {
  assert.equal(safeAdminNextPath("/admin"), "/admin");
  assert.equal(
    safeAdminNextPath("/admin/bestellingen?status=paid"),
    "/admin/bestellingen?status=paid",
  );
  assert.equal(safeAdminNextPath("https://evil.example"), "/admin");
  assert.equal(safeAdminNextPath("//evil.example"), "/admin");
  assert.equal(safeAdminNextPath("/admin\\@evil.example"), "/admin");
  assert.equal(safeAdminNextPath("/admin/../login"), "/admin");
  assert.equal(safeAdminNextPath("/admin.evil.example"), "/admin");
  assert.equal(safeAdminNextPath("/\\evil.example"), "/admin");
});

test("protocol-relatieve en onveilige fotobronnen gaan niet door de optimizer", () => {
  assert.equal(isOptimizableLocalImage("/images/brood.jpg"), true);
  assert.equal(isOptimizableLocalImage("//evil.example/a.svg"), false);
  assert.equal(isOptimizableLocalImage("/\\evil.example/a.svg"), false);
  assert.equal(isDisplayableImageSrc("https://cdn.example/a.jpg"), true);
  assert.equal(isDisplayableImageSrc("http://cdn.example/a.jpg"), true);
  assert.equal(isDisplayableImageSrc("javascript:alert(1)"), false);
  assert.equal(isDisplayableImageSrc("//evil.example/a.svg"), false);
  assert.equal(isDisplayableImageSrc("data:image/svg+xml,xxx"), false);
});

test("productfoto's met een vreemd schema worden geweigerd", () => {
  const parsed = productSchema.safeParse({
    name: "Wit brood",
    categoryId: "cat",
    price: "3,50",
    imageUrl: "javascript:alert(1)",
  });
  assert.equal(parsed.success, false);
});

test("uploads volgen de bestandsbytes, niet de opgegeven content-type", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const svg = Uint8Array.from(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"));
  const webp = Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);

  assert.equal(detectRasterImage(jpeg), "jpg");
  assert.equal(detectRasterImage(png), "png");
  assert.equal(detectRasterImage(webp), "webp");
  assert.equal(detectRasterImage(svg), null);
  assert.deepEqual(inspectImageUpload(jpeg, jpeg.byteLength, 1024, ["jpg", "png"]), {
    kind: "jpg",
  });
  assert.deepEqual(inspectImageUpload(svg, svg.byteLength, 1024, ["jpg", "png", "webp"]), {
    error: "unsupported",
  });
  assert.deepEqual(inspectImageUpload(png, png.byteLength, 4, ["png"]), {
    error: "too-large",
  });
});

test("betaallinks blijven bij Mollie of de eigen sandbox", () => {
  assert.equal(
    isAllowedPaymentRedirect(
      "https://www.mollie.com/checkout/select-method/tr_abc",
      SITE,
    ),
    true,
  );
  assert.equal(
    isAllowedPaymentRedirect("https://evil.example/checkout", SITE),
    false,
  );
  assert.equal(
    isAllowedPaymentRedirect("https://www.mollie.com.evil.example/checkout", SITE),
    false,
  );
  assert.equal(
    isAllowedPaymentRedirect("http://www.mollie.com/checkout", SITE),
    false,
  );
  assert.equal(
    isAllowedPaymentRedirect(`${SITE}/betaling/sandbox/token?betaling=sbx_1`, SITE),
    true,
  );
  assert.equal(
    isAllowedPaymentRedirect(`${SITE}/bestelling/token`, SITE),
    false,
  );
  assert.equal(
    isAllowedPaymentRedirect("javascript:alert(1)", SITE),
    false,
  );
});

test("een echte betaling telt alleen bij het opgeslagen bedrag in euro", () => {
  assert.equal(
    mayApplyPaidStatus({
      provider: "mollie",
      storedAmountCents: 1250,
      status: "paid",
      amountCents: 1250,
      currency: "EUR",
    }),
    true,
  );
  assert.equal(
    mayApplyPaidStatus({
      provider: "mollie",
      storedAmountCents: 1250,
      status: "paid",
      amountCents: 1,
      currency: "EUR",
    }),
    false,
  );
  assert.equal(
    mayApplyPaidStatus({
      provider: "mollie",
      storedAmountCents: 1250,
      status: "paid",
      amountCents: 1250,
      currency: "USD",
    }),
    false,
  );
  assert.equal(
    mayApplyPaidStatus({
      provider: "mollie",
      storedAmountCents: 1250,
      status: "paid",
      currency: "EUR",
    }),
    false,
  );
  assert.equal(
    mayApplyPaidStatus({
      provider: "sandbox",
      storedAmountCents: 1250,
      status: "paid",
    }),
    true,
  );
  assert.equal(
    mayApplyPaidStatus({
      provider: "mollie",
      storedAmountCents: 1250,
      status: "failed",
      amountCents: 1,
      currency: "EUR",
    }),
    true,
  );
});
