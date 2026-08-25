"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  drawingColorPalette,
  drawingStrokeWidths,
  drawingTextSizes,
} from "../tools/drawing-style-config";
import type { DrawingStyle } from "../types";

type DrawingStyleToolbarProps = {
  style: DrawingStyle;
  textMode: boolean;
  position: {
    x: number;
    y: number;
  };
  onStyleChange: (style: Partial<DrawingStyle>) => void;
  onDelete: () => void;
};

type DragSnapshot = {
  originX: number;
  originY: number;
  offsetX: number;
  offsetY: number;
};

const transparencyBackground = {
  backgroundImage:
    "linear-gradient(45deg, rgba(148,163,184,0.35) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.35) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.35) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.35) 75%)",
  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
  backgroundSize: "10px 10px",
};

export function DrawingStyleToolbar({
  style,
  textMode,
  position,
  onStyleChange,
  onDelete,
}: DrawingStyleToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<DragSnapshot | null>(null);
  const sizeValue = textMode ? style.fontSize : style.strokeWidth;
  const sizePresets = textMode ? drawingTextSizes : drawingStrokeWidths;

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      setDragOffset({
        x: drag.offsetX + event.clientX - drag.originX,
        y: drag.offsetY + event.clientY - drag.originY,
      });
    };

    const onPointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const handleDragPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      originX: event.clientX,
      originY: event.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  };

  const handleColorChange = (color: string) => {
    onStyleChange({ strokeColor: color, fillColor: color });
  };

  const handleSizeChange = (value: number) => {
    onStyleChange(textMode ? { fontSize: value } : { strokeWidth: value });
  };

  return (
    <div
      className="pointer-events-auto absolute z-30"
      style={{
        left: position.x + dragOffset.x,
        top: position.y + dragOffset.y,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") setPickerOpen(false);
      }}
    >
      <div className="relative">
        <div className="flex h-11 items-center gap-2 rounded-lg border border-[var(--scanner-toolbar-border)] bg-[var(--scanner-toolbar-bg)] px-1.5 shadow-2xl">
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Move toolbar"
              onPointerDown={handleDragPointerDown}
              className="flex h-8 w-4 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="top" className="scanner-portal">
              Move toolbar
            </TooltipContent>
          </Tooltip>

          <ColorControl
            label="Color"
            value={style.strokeColor}
            active={pickerOpen}
            onClick={() => setPickerOpen((current) => !current)}
          />

          <div className="rounded-md border border-border bg-muted px-2 py-1 text-[0.625rem] font-bold text-foreground">
            {sizeValue}px
          </div>

          <input
            aria-label={textMode ? "Text size" : "Stroke size"}
            type="range"
            min={textMode ? 10 : 1}
            max={textMode ? 48 : 12}
            step={1}
            value={sizeValue}
            list={textMode ? "drawing-text-size-presets" : "drawing-stroke-width-presets"}
            onChange={(event) => handleSizeChange(Number(event.target.value))}
            className="h-2 w-20 accent-primary"
          />
          <datalist
            id={textMode ? "drawing-text-size-presets" : "drawing-stroke-width-presets"}
          >
            {sizePresets.map((width) => (
              <option key={width} value={width} />
            ))}
          </datalist>

          <div className="h-7 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label="Delete drawing"
              onClick={onDelete}
              className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:border-red-400/70 hover:text-red-500"
            >
              <Trash2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="scanner-portal">
              Delete drawing
            </TooltipContent>
          </Tooltip>
        </div>

        {pickerOpen && (
          <ColorPalettePopover
            value={style.strokeColor}
            fillOpacity={style.fillOpacity}
            showTransparency={!textMode}
            onColorChange={handleColorChange}
            onOpacityChange={(fillOpacity) => onStyleChange({ fillOpacity })}
          />
        )}
      </div>
    </div>
  );
}

type ColorControlProps = {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
};

function ColorControl({ label, value, active, onClick }: ColorControlProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={label}
        onClick={onClick}
        className={`relative flex size-7 items-center justify-center rounded-md border bg-muted transition-colors ${
          active
            ? "border-primary/80 bg-primary/10"
            : "border-border hover:border-muted-foreground"
        }`}
      >
        <span
          className="size-4 rounded-sm border border-white/30"
          style={{ backgroundColor: value }}
        />
        <span
          className="absolute bottom-0.5 h-0.5 w-4 rounded-full"
          style={{ backgroundColor: value }}
        />
      </TooltipTrigger>
      <TooltipContent side="top" className="scanner-portal">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type ColorPalettePopoverProps = {
  value: string;
  fillOpacity: number;
  showTransparency: boolean;
  onColorChange: (color: string) => void;
  onOpacityChange: (opacity: number) => void;
};

function ColorPalettePopover({
  value,
  fillOpacity,
  showTransparency,
  onColorChange,
  onOpacityChange,
}: ColorPalettePopoverProps) {
  const transparency = Math.round((1 - fillOpacity) * 100);
  const inputId = "drawing-custom-color";

  return (
    <div
      className="absolute left-0 top-[52px] w-[306px] rounded-sm border border-[var(--scanner-toolbar-border)] bg-[var(--scanner-flyout-bg)] p-3 shadow-2xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="space-y-2">
        {drawingColorPalette.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-10 gap-2">
            {row.map((color) => (
              <button
                key={`${rowIndex}-${color}`}
                type="button"
                title={color}
                aria-label={`Set color ${color}`}
                onClick={() => onColorChange(color)}
                className={`size-5 rounded-[1px] border transition-transform hover:scale-110 ${
                  value.toLowerCase() === color.toLowerCase()
                    ? "border-white"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-foreground">
          {showTransparency ? <span>Transparency</span> : <span>Custom</span>}
          <label
            htmlFor={inputId}
            className="relative cursor-pointer rounded-md border border-border bg-muted px-2 py-1 text-[0.625rem] font-bold text-foreground hover:border-muted-foreground"
          >
            Pick
            <input
              id={inputId}
              aria-label="Custom color"
              type="color"
              value={value}
              onChange={(event) => onColorChange(event.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>

        {showTransparency && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-3 flex-1 items-center rounded-full border border-border"
              style={transparencyBackground}
            >
              <input
                aria-label="Transparency"
                type="range"
                min={0}
                max={100}
                step={1}
                value={transparency}
                onChange={(event) =>
                  onOpacityChange(1 - Number(event.target.value) / 100)
                }
                className="h-3 w-full cursor-pointer accent-primary"
              />
            </div>

            <div className="flex h-8 w-16 items-center justify-end rounded-md border border-border bg-muted px-2 text-xs font-semibold text-foreground">
              {transparency}
              <span className="ml-1 text-muted-foreground">%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
