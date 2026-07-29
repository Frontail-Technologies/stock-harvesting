import { AuthGuard } from "@/features/auth";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col bg-surface text-foreground">
        <AppHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </AuthGuard>
  );
}
