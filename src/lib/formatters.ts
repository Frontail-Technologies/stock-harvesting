export function formatCurrency(value: number): string {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactVolume(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(0);
}

export function formatSignedChange(
  absolute: number,
  percent: number
): { text: string; isPositive: boolean } {
  const isPositive = absolute >= 0;
  const sign = isPositive ? "+" : "";
  return {
    text: `${sign}${absolute.toFixed(2)} (${sign}${percent.toFixed(2)}%)`,
    isPositive,
  };
}

export function changeColorClass(isPositive: boolean): string {
  return isPositive ? "text-brand-green" : "text-brand-red";
}
