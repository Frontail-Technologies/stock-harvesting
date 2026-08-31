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
