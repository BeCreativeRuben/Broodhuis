import { NextResponse } from "next/server";

import { applyPaymentUpdate } from "@/lib/orders";
import { mollieGateway, isMollieConfigured } from "@/lib/payments/mollie";

export const dynamic = "force-dynamic";

/**
 * Mollie roept deze URL aan bij elke statuswijziging. De melding bevat enkel
 * het betaal-id; de status halen we daarna zelf op bij Mollie. Dat is ook de
 * beveiliging: een verzonnen id levert niets op.
 *
 * Mollie verwacht altijd een 200 zodra we de melding gezien hebben, anders
 * blijft het opnieuw proberen. Bij een echte fout geven we wel een 500 terug,
 * dan komt de melding later opnieuw.
 */
export async function POST(request: Request) {
  if (!isMollieConfigured()) {
    return NextResponse.json(
      { error: "Mollie is niet geconfigureerd." },
      { status: 503 },
    );
  }

  let paymentId: string | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body: unknown = await request.json();
      if (typeof body === "object" && body !== null && "id" in body) {
        paymentId = String((body as { id?: unknown }).id);
      }
    } else {
      const form = await request.formData();
      const value = form.get("id");
      if (typeof value === "string") paymentId = value;
    }
  } catch {
    return NextResponse.json({ error: "Ongeldige melding." }, { status: 400 });
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Geen betaal-id." }, { status: 400 });
  }

  try {
    const fetched = await mollieGateway.fetchPayment(paymentId);
    const order = await applyPaymentUpdate(fetched);

    if (!order) {
      // Betaling hoort niet bij een bestelling van deze webshop. 200 sturen,
      // anders blijft Mollie het eindeloos opnieuw proberen.
      console.warn(`[broodhuis] Webhook voor onbekende betaling ${paymentId}`);
      return NextResponse.json({ ok: true, known: false });
    }

    return NextResponse.json({ ok: true, status: order.status });
  } catch (error) {
    console.error("[broodhuis] Mollie-webhook mislukte:", error);
    return NextResponse.json(
      { error: "Kon de betaling niet verwerken." },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json({
    ok: true,
    message: "Mollie-webhook van 't Broodhuis. Statusmeldingen komen via POST.",
  });
}
