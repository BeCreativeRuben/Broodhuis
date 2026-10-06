"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { cartLineKey, MAX_QUANTITY_PER_LINE, type CartItem } from "@/lib/cart";
import { parseCartSelection } from "@/lib/cart-selection";
import { displayItemCount, lineTotalCents } from "@/lib/weight";

const STORAGE_KEY = "broodhuis-winkelwagen-v4";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  /** false tijdens de eerste render, tot localStorage gelezen is */
  isReady: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  clear: () => void;
  quantityOf: (
    productId: string,
    variantId?: string,
    selection?: CartItem["selection"],
  ) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.productId === "string" &&
    typeof item.quantity === "number" &&
    typeof item.name === "string" &&
    typeof item.priceCents === "number" &&
    typeof item.unit === "string" &&
    (item.variantId === undefined || typeof item.variantId === "string")
  );
}

function withSelection(item: CartItem): CartItem {
  const selection = parseCartSelection(item.selection);
  return selection ? { ...item, selection } : { ...item, selection: undefined };
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map((item) => {
      const next = withSelection(item);
      return {
        ...next,
        quantity: Math.min(
          Math.max(Math.trunc(item.quantity), 1),
          MAX_QUANTITY_PER_LINE,
        ),
      };
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage kan vol of geblokkeerd zijn; de winkelwagen blijft dan
      // enkel in het geheugen bestaan.
    }
  }, [items, isReady]);

  // Winkelwagen gelijk houden over meerdere tabs.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setItems(readStoredCart());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((current) => {
      const key = cartLineKey(item);
      const existing = current.find((line) => cartLineKey(line) === key);
      if (!existing) {
        return [
          ...current,
          {
            ...item,
            quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY_PER_LINE),
          },
        ];
      }
      return current.map((line) =>
        cartLineKey(line) === key
          ? {
              ...line,
              ...item,
              quantity: Math.min(line.quantity + quantity, MAX_QUANTITY_PER_LINE),
            }
          : line,
      );
    });
  }, []);

  const setQuantity = useCallback((lineKey: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((line) => cartLineKey(line) !== lineKey);
      }
      return current.map((line) =>
        cartLineKey(line) === lineKey
          ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY_PER_LINE) }
          : line,
      );
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((current) => current.filter((line) => cartLineKey(line) !== lineKey));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = displayItemCount(items);
    const subtotalCents = items.reduce(
      (total, line) =>
        total + lineTotalCents(line.priceCents, line.quantity, line.unit),
      0,
    );

    return {
      items,
      itemCount,
      subtotalCents,
      isReady,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      setQuantity,
      removeItem,
      clear,
      quantityOf: (productId, variantId, selection) =>
        items.find(
          (line) =>
            cartLineKey(line) === cartLineKey({ productId, variantId, selection }),
        )?.quantity ?? 0,
    };
  }, [items, isReady, isOpen, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart moet binnen een CartProvider gebruikt worden.");
  }
  return context;
}
