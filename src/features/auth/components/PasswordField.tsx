"use client";

import { forwardRef, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type"> & {
  toggleClassName?: string;
};

/**
 * Password input + show/hide toggle, shared by every auth form so the
 * masking behavior and button markup exist in exactly one place. Spreads
 * cleanly onto RHF's `register(...)` output (name/onChange/onBlur/ref).
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ className, toggleClassName, ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          className={cn(
            "absolute right-2 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            toggleClassName,
          )}
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
PasswordField.displayName = "PasswordField";
