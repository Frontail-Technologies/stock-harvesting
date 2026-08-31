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
