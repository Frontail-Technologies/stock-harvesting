"use client";

import { MessageCircle, MessageSquare, Send, Share2, X } from "lucide-react";
import type { Stock } from "@/types/market";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  buildRedditShareUrl,
  buildTelegramShareUrl,
  buildTwitterShareUrl,
  buildWhatsAppShareUrl,
  getScannerShareCaption,
  getScannerShareUrl,
} from "../lib/share-links";

type ShareMenuProps = {
  stock: Stock;
  compact?: boolean;
  className?: string;
};

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ShareMenu({ stock, compact, className }: ShareMenuProps) {
  const shareUrl = getScannerShareUrl(stock);
  const caption = getScannerShareCaption(stock);

  return (
    <DropdownMenu>
      <Tooltip>
        {compact ? (
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                aria-label="Share chart"
                className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 ${className ?? ""}`}
              />
            }
          >
            <Share2 className="size-4" />
          </TooltipTrigger>
        ) : (
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Share chart"
                    className={`cursor-pointer ${className ?? ""}`}
                  />
                }
              />
            }
          >
            <Share2 className="size-4" />
          </TooltipTrigger>
        )}
        <TooltipContent side={compact ? "right" : "bottom"} className="scanner-portal">
          Share chart
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align={compact ? "start" : "end"} side={compact ? "right" : "bottom"} className="scanner-portal w-56">
        <DropdownMenuItem
          onClick={() => openShareWindow(buildWhatsAppShareUrl(caption, shareUrl))}
          className="cursor-pointer gap-2"
        >
          <MessageCircle className="size-4 text-muted-foreground" />
          Share to WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openShareWindow(buildTelegramShareUrl(caption, shareUrl))}
          className="cursor-pointer gap-2"
        >
          <Send className="size-4 text-muted-foreground" />
          Share to Telegram
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openShareWindow(buildTwitterShareUrl(caption, shareUrl))}
          className="cursor-pointer gap-2"
        >
          <X className="size-4 text-muted-foreground" />
          Share to X
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openShareWindow(buildRedditShareUrl(caption, shareUrl))}
          className="cursor-pointer gap-2"
        >
          <MessageSquare className="size-4 text-muted-foreground" />
          Share to Reddit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
