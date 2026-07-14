import type { ComponentType, SVGProps } from "react";
import type { DrawingToolId } from "../types";

export type ToolIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type ToolMenuItem = {
  kind: "tool";
  id: DrawingToolId;
  label: string;
  icon: ToolIcon;
};

export type ActionMenuItem = {
  kind: "action";
  id:
    | "crosshair"
    | "lock-selected"
    | "hide-selected"
    | "magnet"
    | "clear-drawings";
  label: string;
  icon: ToolIcon;
  disabled?: boolean;
  active?: boolean;
};

export type ToolbarMenuItem = ToolMenuItem | ActionMenuItem;

export type ToolbarSection = {
  label: string;
  items: ToolbarMenuItem[];
};

export type ToolbarGroup = {
  id: string;
  label: string;
  icon: ToolIcon;
  toolIds: DrawingToolId[];
  sections: ToolbarSection[];
};

export type ToolbarGroupState = {
  crosshairActive: boolean;
  magnetActive: boolean;
  hasSelectedDrawing: boolean;
  hasDrawings: boolean;
};
