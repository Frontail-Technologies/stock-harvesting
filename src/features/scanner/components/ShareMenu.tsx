"use client";

import { useState } from "react";
import { Download, MessageCircle, MessageSquare, Send, Share2, X } from "lucide-react";
import type { Stock } from "@/types/market";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onNativeShare: () => void;
  onDownload: () => void;
};

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ShareMenu({ stock, compact, className, onNativeShare, onDownload }: ShareMenuProps) {
  // DropdownMenuContent is only mounted once the menu is actually opened
  // (well after hydration), so reading navigator here doesn't risk a
  // server/client markup mismatch the way it would in always-rendered JSX.
  const [hasNativeShare] = useState(
    () => typeof navigator !== "undefined" && typeof navigator.share === "function"
  );

  const shareUrl = getScannerShareUrl(stock);
  const caption = getScannerShareCaption(stock);

  return (
    <DropdownMenu>
      {compact ? (
        <DropdownMenuTrigger
          aria-label="Share"
          title="Share"
          className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${className ?? ""}`}
        >
          <Share2 className="size-4" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Share"
              title="Share"
              className={`cursor-pointer ${className ?? ""}`}
            />
          }
        >
          <Share2 className="size-4" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={compact ? "start" : "end"} side={compact ? "right" : "bottom"} className="scanner-portal w-56">
        {hasNativeShare && (
          <>
            <DropdownMenuItem onClick={onNativeShare} className="cursor-pointer gap-2">
              <Share2 className="size-4 text-muted-foreground" />
              Share via device...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onDownload} className="cursor-pointer gap-2">
          <Download className="size-4 text-muted-foreground" />
          Download image
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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

