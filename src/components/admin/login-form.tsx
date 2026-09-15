"use client";

import { useActionState } from "react";
import { Loader2Icon, LogInIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMPTY_LOGIN_STATE, login } from "@/server/actions/admin-auth";

export function LoginForm({ next }: { next: string | null }) {
  const [state, formAction, isPending] = useActionState(login, EMPTY_LOGIN_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="volgende" value={next} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2">
        <Label htmlFor="user">Gebruikersnaam</Label>
        <Input
          id="user"
          name="user"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="h-11"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Wachtwoord</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11"
        />
      </div>

      <Button type="submit" disabled={isPending} className="h-11 w-full rounded-full">
        {isPending ? (
          <>
            <Loader2Icon className="size-4 animate-spin" /> Bezig…
          </>
        ) : (
          <>
            <LogInIcon className="size-4" /> Inloggen
          </>
        )}
      </Button>
    </form>
  );
}
