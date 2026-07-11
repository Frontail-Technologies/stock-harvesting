"use client";

import {
  Eye,
  Lock,
  Magnet,
  Minus,
  MousePointer2,
  MoveUpRight,
  Paintbrush,
  Ruler,
  Square,
  Star,
  Trash2,
  TrendingUp,
  Type,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type ToolId =
  | "crosshair"
  | "trendline"
  | "brush"
  | "arrow"
  | "horizontal-line"
  | "measure"
  | "rectangle"
  | "text"
  | "star"
  | "magnet"
  | "lock"
  | "eye";

const TOOLS: { id: ToolId; label: string; icon: typeof MousePointer2 }[] = [
  { id: "crosshair", label: "Cursor", icon: MousePointer2 },
  { id: "trendline", label: "Trend Line", icon: TrendingUp },
  { id: "brush", label: "Brush", icon: Paintbrush },
  { id: "arrow", label: "Arrow", icon: MoveUpRight },
  { id: "horizontal-line", label: "Horizontal Line", icon: Minus },
  { id: "measure", label: "Measure", icon: Ruler },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "text", label: "Text", icon: Type },
  { id: "star", label: "Favorite", icon: Star },
  { id: "magnet", label: "Magnet", icon: Magnet },
  { id: "lock", label: "Lock", icon: Lock },
  { id: "eye", label: "Eye", icon: Eye },
];

type ChartToolsBarProps = {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  onDelete: () => void;
};

function ToolButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof MousePointer2;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(
          "flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "bg-primary/15 text-primary"
        )}
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ChartToolsBar({
  activeTool,
  onToolChange,
  onDelete,
}: ChartToolsBarProps) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-2">
      {TOOLS.map((tool) => (
        <ToolButton
          key={tool.id}
          label={tool.label}
          icon={tool.icon}
          active={activeTool === tool.id}
          onClick={() => onToolChange(tool.id)}
        />
      ))}

      <Separator className="my-1 w-6 bg-border" />

      <ToolButton label="Delete" icon={Trash2} active={false} onClick={onDelete} />
    </div>
  );
}
