// Classic "nice numbers" tick generator (D3/Highcharts-style) - given an
// arbitrary max value, returns a small set of round tick values (0, 20, 40,
// 60, 80, 100 rather than 0, 17.4, 34.8, ...). Used by the Backtest chart's
// Y-axis so it never hardcodes a max like 24 - it always derives clean
// ticks from whatever the visible data currently is.
//
// The axis always represents a whole-number count of stocks, so `step` is
// floored at 1 - without that, a small max (e.g. 1-4, common right after
// solo-filtering the legend down to one sparse sector) could compute a
// sub-1 step, and rounding several distinct raw tick values down to the
// same integer produced literal duplicate ticks (React "two children with
// the same key" - two rendered "0"s, two "1"s). The post-hoc dedupe below
// is kept as a defensive backstop regardless.
export function computeNiceTicks(maxValue: number, targetCount = 5): number[] {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return [0];

  const roughStep = maxValue / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = Math.max(niceNormalized * magnitude, 1);
  const niceMax = Math.ceil(maxValue / step) * step;

  const ticks: number[] = [];
  for (let value = 0; value <= niceMax + step / 2; value += step) {
    const rounded = Math.round(value);
    if (ticks[ticks.length - 1] !== rounded) ticks.push(rounded);
  }
  return ticks;
}
