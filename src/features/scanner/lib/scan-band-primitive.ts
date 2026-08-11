import type { BitmapCoordinatesRenderingScope, CanvasRenderingTarget2D } from "fancy-canvas";
import type {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";

const WIDTH_MULTIPLIER = 0.92;
const MIN_COLUMN_WIDTH_PX = 1;
const EDGE_WIDTH_PX = 1;

type HighlightRect = { left: number; right: number; selected: boolean };

type ScanBandColors = {
  fill: string;
  edge: string;
  fillSelected: string;
  edgeSelected: string;
};

// Draws one filled rectangle per highlighted candle directly on the chart's
// own canvas (via drawBackground, so it renders behind the candles) instead
// of one positioned <div> per candle. The chart's native render loop calls
// updateAllViews()/draw() on every pan/zoom/resize frame on its own — no
// React state, no RAF loop, no per-candle DOM nodes to reposition. This is
// what makes per-candle highlighting affordable again: the previous
// per-candle DOM version repositioned N elements through React on every
// drag frame (laggy), and CSS-tiled each one's background independently
// (which drifted out of phase into a shimmering seam as the chart panned).
// A canvas fillRect per candle has neither cost.
class ScanBandPaneRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly rects: readonly HighlightRect[],
    private readonly colors: ScanBandColors
  ) {}

  draw() {}

  drawBackground(target: CanvasRenderingTarget2D) {
    if (this.rects.length === 0) return;

    target.useBitmapCoordinateSpace(({
      context,
      bitmapSize,
      horizontalPixelRatio,
    }: BitmapCoordinatesRenderingScope) => {
      context.save();

      const edgeWidth = Math.max(1, Math.round(EDGE_WIDTH_PX * horizontalPixelRatio));

      // Normal zones first, then the hovered/selected zone (if any) drawn
      // last so its slightly stronger tint isn't undercut by a neighbouring
      // normal rect's edge lines.
      for (const rect of this.rects) {
        if (rect.selected) continue;
        this.paintRect(context, rect, this.colors.fill, this.colors.edge, edgeWidth, horizontalPixelRatio, bitmapSize.height);
      }
      for (const rect of this.rects) {
        if (!rect.selected) continue;
        this.paintRect(context, rect, this.colors.fillSelected, this.colors.edgeSelected, edgeWidth, horizontalPixelRatio, bitmapSize.height);
      }

      context.restore();
    });
  }

  private paintRect(
    context: CanvasRenderingContext2D,
    rect: HighlightRect,
    fill: string,
    edge: string,
    edgeWidth: number,
    horizontalPixelRatio: number,
    height: number
  ) {
    const x1 = Math.round(rect.left * horizontalPixelRatio);
    const x2 = Math.round(rect.right * horizontalPixelRatio);
    const width = Math.max(1, x2 - x1);

    context.fillStyle = fill;
    context.fillRect(x1, 0, width, height);

    context.fillStyle = edge;
    context.fillRect(x1, 0, edgeWidth, height);
    context.fillRect(x2 - edgeWidth, 0, edgeWidth, height);
  }
}

class ScanBandPaneView implements IPrimitivePaneView {
  private rects: HighlightRect[] = [];

  constructor(private readonly primitive: ScanBandPrimitive) {}

  update() {
    this.rects = this.primitive.computeVisibleRects();
  }

  renderer() {
    return new ScanBandPaneRenderer(this.rects, this.primitive.colors);
  }
}

export class ScanBandPrimitive implements ISeriesPrimitive<Time> {
  colors: ScanBandColors = {
    fill: "transparent",
    edge: "transparent",
    fillSelected: "transparent",
    edgeSelected: "transparent",
  };

  private chart: IChartApi | null = null;
  private requestUpdateFn: (() => void) | null = null;
  private highlightedTimes: Time[] = [];
  private hoveredTime: Time | null = null;
  private readonly paneView = new ScanBandPaneView(this);

  attached({ chart, requestUpdate }: SeriesAttachedParameter<Time, SeriesType>) {
    this.chart = chart as unknown as IChartApi;
    this.requestUpdateFn = requestUpdate;
  }

  detached() {
    this.chart = null;
    this.requestUpdateFn = null;
  }

  setData(times: string[], colors: ScanBandColors) {
    this.highlightedTimes = times as Time[];
    this.colors = colors;
    this.requestUpdateFn?.();
  }

  // Marks whichever highlighted band the crosshair currently sits over so
  // it paints with the stronger "selected" tint — separate from setData so
  // hover changes (which happen far more often than the detected-band list
  // itself) don't need to re-resolve highlightedTimes/colors each time.
  setHoveredTime(time: string | null) {
    const next = (time as Time | null) ?? null;
    if (this.hoveredTime === next) return;
    this.hoveredTime = next;
    this.requestUpdateFn?.();
  }

  updateAllViews() {
    this.paneView.update();
  }

  paneViews() {
    return [this.paneView];
  }

  computeVisibleRects(): HighlightRect[] {
    if (!this.chart || this.highlightedTimes.length === 0) return [];

    const timeScale = this.chart.timeScale();
    const barSpacing = timeScale.options().barSpacing;
    const halfWidth = Math.max(barSpacing * WIDTH_MULTIPLIER, MIN_COLUMN_WIDTH_PX) / 2;
    const rects: HighlightRect[] = [];

    for (const time of this.highlightedTimes) {
      const x = timeScale.timeToCoordinate(time);
      if (x === null) continue;
      rects.push({ left: x - halfWidth, right: x + halfWidth, selected: time === this.hoveredTime });
    }

    return rects;
  }
}
