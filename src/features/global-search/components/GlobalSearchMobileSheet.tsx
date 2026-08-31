"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchModalStore } from "../stores/search-modal-store";

type GlobalSearchMobileSheetProps = {
  className?: string;
};

export function GlobalSearchMobileSheet({ className }: GlobalSearchMobileSheetProps) {
  const openModal = useSearchModalStore((state) => state.open);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={triggerRef}
            type="button"
            variant="ghost"
            size="icon"
            className={className}
            aria-label="Search stocks"
            onClick={() => openModal(triggerRef.current)}
          />
        }
      >
        <Search className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom">Search stocks</TooltipContent>
    </Tooltip>
  );
}
