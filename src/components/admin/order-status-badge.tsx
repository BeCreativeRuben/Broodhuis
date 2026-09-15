import { Badge } from "@/components/ui/badge";
import { orderStatusLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";

function tone(status: string): string {
  switch (status) {
    case "paid":
      return "border-success/40 bg-success/10 text-success";
    case "ready":
      return "border-primary/40 bg-primary/10 text-primary";
    case "pending":
      return "border-warning/50 bg-warning/15 text-warning-foreground";
    case "completed":
      return "border-border bg-secondary text-muted-foreground";
    default:
      return "border-destructive/40 bg-destructive/10 text-destructive";
  }
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("rounded-full", tone(status), className)}>
      {orderStatusLabel(status)}
    </Badge>
  );
}
