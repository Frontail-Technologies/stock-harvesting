import { TableBody, TableCell, TableRow } from "@/components/ui/table";

function SkeletonBlock({ className = "" }: { className?: string }) {
  // bg-muted is nearly identical to bg-card in the dark theme (#111827 vs
  // #0f172a), so the pulse had no visible contrast to animate against.
  // foreground/10 always contrasts with the surface it sits on, in either
  // theme, since it's derived from the text color rather than a separate
  // muted token that happens to collide with the card color.
  return <div className={`h-3 animate-pulse rounded-full bg-foreground/10 ${className}`} />;
}

export function StocksTableSkeleton({ rows }: { rows: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index} className={index % 2 === 1 ? "bg-muted/35" : undefined}>
          <TableCell>
            <SkeletonBlock className="w-4" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="w-14" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="w-32" />
          </TableCell>
          <TableCell>
            <SkeletonBlock className="w-10" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end">
              <SkeletonBlock className="w-14" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-end">
              <SkeletonBlock className="w-14" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-end">
              <SkeletonBlock className="w-16" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-end">
              <SkeletonBlock className="w-12" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
