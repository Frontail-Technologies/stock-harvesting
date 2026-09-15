"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type CreateAdminUserSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  error: string | null;
  onSubmit: (input: { name: string; email: string; password: string }) => void;
};

const MIN_PASSWORD_LENGTH = 8;

export function CreateAdminUserSheet({
  open,
  onOpenChange,
  pending,
  error,
  onSubmit,
}: CreateAdminUserSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setName("");
      setEmail("");
      setPassword("");
    }
    onOpenChange(nextOpen);
  };

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && !pending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader>
            <SheetTitle>New admin</SheetTitle>
            <SheetDescription>
              Create an admin account. They can sign in immediately with this password.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Doe"
                autoComplete="off"
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@example.com"
                autoComplete="off"
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Password</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
                disabled={pending}
              />
            </div>
          </div>

          <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col sm:items-stretch">
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" size="sm" className="gap-1.5" disabled={!canSubmit}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
              Create admin
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
