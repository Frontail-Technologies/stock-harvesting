"use client";

import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/utils/cn";

type AdminSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  compact?: boolean;
  disabled?: boolean;
};

export function AdminSelect({
  label,
  value,
  onChange,
  options,
  compact = false,
  disabled = false,
}: AdminSelectProps) {
  return (
    <div className={cn("flex flex-col gap-1", compact && "min-w-24")}>
      <label className="sr-only">{label}</label>
      <Select
        value={value}
        options={options}
        onValueChange={onChange}
        placeholder={label}
        disabled={disabled}
        triggerClassName={cn(
          "h-10 rounded-md border-input bg-card text-sm focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30",
          compact && "h-8 rounded-md px-2 font-mono text-xs"
        )}
      />
    </div>
  );
}

