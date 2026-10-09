"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number | null;
  label: string;
  size?: "default" | "lg";
  className?: string;
  formatValue?: (value: number) => string;
};

/**
 * Grote plus/min-knoppen: op een telefoon is dat veel vlotter dan een
 * keuzelijst of een tekstveld waar je op moet mikken.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  label,
  size = "default",
  className,
  formatValue,
}: QuantityStepperProps) {
  const upperBound = Math.min(max ?? MAX_QUANTITY_PER_LINE, MAX_QUANTITY_PER_LINE);
  const buttonSize = "size-12";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-none", buttonSize)}
        onClick={() => onChange(Math.max(value - 1, min - 1))}
        aria-label={`Eén ${label} minder`}
      >
        <MinusIcon className="size-4" />
      </Button>
      <span
        aria-live="polite"
        className={cn(
          "min-w-8 text-center font-medium tabular-nums",
          size === "lg" && "min-w-12 text-lg",
          formatValue && "min-w-[4.75rem] px-1 whitespace-nowrap",
        )}
      >
        {formatValue ? formatValue(value) : value}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("rounded-none", buttonSize)}
        onClick={() => onChange(Math.min(value + 1, upperBound))}
        disabled={value >= upperBound}
        aria-label={`Eén ${label} meer`}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
}
