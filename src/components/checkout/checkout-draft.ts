"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { FulfillmentType } from "@/lib/shop-config";

/**
 * Wat de klant in de checkout invulde, bewaard per tabblad.
 *
 * Nodig omdat een serverfout (bv. een postcode buiten het leveringsgebied) de
 * pagina opnieuw laat opbouwen. Zonder dit stond de klant plots weer voor een
 * leeg formulier — precies de mobiele frustratie die we wilden vermijden.
 * sessionStorage: het blijft in dit tabblad en verdwijnt als het sluit.
 */
export type CheckoutDraft = {
  fulfillmentType: FulfillmentType;
  slot: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  deliveryNote: string;
  note: string;
  acceptTerms: boolean;
};

const STORAGE_KEY = "broodhuis-afrekenen-v1";

export const EMPTY_DRAFT: CheckoutDraft = {
  fulfillmentType: "pickup",
  slot: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  deliveryNote: "",
  note: "",
  acceptTerms: false,
};

function readDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const draft = { ...EMPTY_DRAFT };
    for (const key of Object.keys(EMPTY_DRAFT) as Array<keyof CheckoutDraft>) {
      const value = (parsed as Record<string, unknown>)[key];
      if (key === "acceptTerms") {
        if (typeof value === "boolean") draft.acceptTerms = value;
      } else if (key === "fulfillmentType") {
        if (value === "pickup" || value === "delivery") {
          draft.fulfillmentType = value;
        }
      } else if (typeof value === "string") {
        draft[key] = value;
      }
    }
    return draft;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Niets aan te doen; de gegevens verdwijnen dan met het tabblad.
  }
}

export function useCheckoutDraft() {
  const [draft, setDraft] = useState<CheckoutDraft>(EMPTY_DRAFT);
  const isRestoredRef = useRef(false);

  useEffect(() => {
    const stored = readDraft();
    if (stored) setDraft(stored);
    isRestoredRef.current = true;
  }, []);

  useEffect(() => {
    if (!isRestoredRef.current) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // sessionStorage kan geblokkeerd zijn; dan werkt het formulier gewoon
      // zonder bewaren.
    }
  }, [draft]);

  const setField = useCallback(
    <K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) => {
      setDraft((current) =>
        current[key] === value ? current : { ...current, [key]: value },
      );
    },
    [],
  );

  return { draft, setField };
}
