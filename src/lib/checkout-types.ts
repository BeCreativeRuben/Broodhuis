import type { PricedCart } from "@/lib/cart";
import type { FulfillmentType } from "@/lib/shop-config";

/** Tijdslot zonder Date-velden, klaar om naar de browser te sturen. */
export type SlotOption = {
  value: string;
  date: string;
  dateLabel: string;
  dateLabelShort: string;
  timeLabel: string;
  label: string;
};

export type CheckoutData = {
  cart: PricedCart;
  slots: Record<FulfillmentType, SlotOption[]>;
  deliveryFeeCents: number;
  deliveryMinimumCents: number;
  deliveryPostalCodes: string[];
  /** Vroegste datum door de bestelperiode van de producten */
  earliestDate: string | null;
  payment: {
    label: string;
    isSandbox: boolean;
    isTestKey: boolean;
  };
};
