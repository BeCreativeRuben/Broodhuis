import { centsToDecimalString } from "@/lib/money";
import {
  PaymentError,
  type CreatePaymentInput,
  type CreatedPayment,
  type FetchedPayment,
  type PaymentGateway,
  type PaymentStatus,
} from "@/lib/payments/types";
import { SHOP } from "@/lib/shop-config";

const MOLLIE_API = "https://api.mollie.com/v2";

type MollieAmount = { currency: string; value: string };

type MolliePayment = {
  id: string;
  status: string;
  method?: string | null;
  paidAt?: string | null;
  amount: MollieAmount;
  _links?: { checkout?: { href?: string } };
};

/**
 * Mollie-statussen naar onze eigen statussen.
 * "authorized" komt voor bij kaartbetalingen die nog gecaptured moeten worden;
 * die behandelen we als "in verwerking" tot de webhook "paid" doorgeeft.
 */
function mapStatus(status: string): PaymentStatus {
  switch (status) {
    case "paid":
      return "paid";
    case "pending":
    case "authorized":
      return "pending";
    case "canceled":
      return "canceled";
    case "expired":
      return "expired";
    case "failed":
      return "failed";
    default:
      return "open";
  }
}

/** MOLLIE_METHODS beperkt de aangeboden methodes, bv. "bancontact,creditcard". */
function configuredMethods(): string[] | undefined {
  const raw = process.env.MOLLIE_METHODS?.trim();
  if (!raw) return undefined;
  const methods = raw
    .split(",")
    .map((method) => method.trim().toLowerCase())
    .filter((method) => method !== "");
  return methods.length > 0 ? methods : undefined;
}

export function isMollieConfigured(): boolean {
  return (process.env.MOLLIE_API_KEY?.trim() ?? "") !== "";
}

export function mollieIsTestKey(): boolean {
  return (process.env.MOLLIE_API_KEY?.trim() ?? "").startsWith("test_");
}

async function mollieRequest<T>(
  path: string,
  init?: RequestInit & { body?: string },
): Promise<T> {
  const apiKey = process.env.MOLLIE_API_KEY?.trim();
  if (!apiKey) {
    throw new PaymentError("MOLLIE_API_KEY ontbreekt.");
  }

  let response: Response;
  try {
    response = await fetch(`${MOLLIE_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new PaymentError(
      "Mollie is niet bereikbaar. Probeer het opnieuw of bel de bakkerij.",
      error,
    );
  }

  const text = await response.text();
  const payload: unknown = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String((payload as { detail?: unknown }).detail)
        : `HTTP ${response.status}`;
    throw new PaymentError(`Mollie gaf een fout terug: ${detail}`, payload);
  }

  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const mollieGateway: PaymentGateway = {
  id: "mollie",
  label: "Mollie",
  isSandbox: false,

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const methods = configuredMethods();

    const body: Record<string, unknown> = {
      amount: {
        currency: "EUR",
        value: centsToDecimalString(input.amountCents),
      },
      description: input.description,
      redirectUrl: input.redirectUrl,
      cancelUrl: input.cancelUrl,
      locale: "nl_BE",
      metadata: {
        orderId: input.orderId,
        orderNumber: input.orderNumber,
        shop: SHOP.legalName,
      },
    };

    // Zonder publieke URL (lokaal) kan Mollie de webhook niet aanroepen.
    // De terugkeerpagina haalt de status dan zelf op bij Mollie.
    if (input.webhookUrl) {
      body.webhookUrl = input.webhookUrl;
    }
    if (methods) {
      body.method = methods;
    }
    if (input.customerEmail) {
      body.billingEmail = input.customerEmail;
    }

    const payment = await mollieRequest<MolliePayment>("/payments", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      throw new PaymentError(
        "Mollie gaf geen betaallink terug. Probeer het opnieuw.",
        payment,
      );
    }

    return {
      provider: this.id,
      providerPaymentId: payment.id,
      checkoutUrl,
      status: mapStatus(payment.status),
      raw: payment,
    };
  },

  async fetchPayment(providerPaymentId: string): Promise<FetchedPayment> {
    const payment = await mollieRequest<MolliePayment>(
      `/payments/${encodeURIComponent(providerPaymentId)}`,
    );

    return {
      provider: this.id,
      providerPaymentId: payment.id,
      status: mapStatus(payment.status),
      method: payment.method ?? null,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
      raw: payment,
    };
  },
};
