export function CustomChartGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[12] select-none"
      style={{
        backgroundImage:
          "linear-gradient(var(--scanner-chart-grid) 1px, transparent 1px), linear-gradient(90deg, var(--scanner-chart-grid) 1px, transparent 1px)",
        backgroundSize: "72px 54px",
        opacity: "var(--scanner-chart-grid-opacity)",
      }}
    />
  );
}
