"use client";

import { useActionState } from "react";
import { CheckCircle2Icon, Loader2Icon, SaveIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { saveClosedDates } from "@/server/actions/admin-catalog";

export function ClosedDatesForm({ dates }: { dates: string[] }) {
  const [state, formAction, isPending] = useActionState(
    saveClosedDates,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} className="space-y-3">
      {state.ok && (
        <Alert className="border-success/40 bg-success/10">
          <CheckCircle2Icon />
          <AlertDescription>Sluitingsdagen bijgewerkt.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="closedDates">Sluitingsdagen</Label>
        <Textarea
          id="closedDates"
          name="closedDates"
          defaultValue={dates.join("\n")}
          rows={5}
          placeholder={"25/12/2026\n26/12/2026"}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Eén datum per lijn, als 25/12/2026 of 2026-12-25. Op die dagen kan er niet
          afgehaald of geleverd worden.
        </p>
        {state.errors.closedDates && (
          <p className="text-sm text-destructive">{state.errors.closedDates}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="h-11 rounded-full px-5">
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" /> Bewaren…
          </>
        ) : (
          <>
            <SaveIcon className="size-4" /> Sluitingsdagen opslaan
          </>
        )}
      </Button>
    </form>
  );
}
