import { AuthGuard } from "@/features/auth";
import { AppHeader } from "./AppHeader";
import { MobileBottomNavigation } from "./MobileBottomNavigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col bg-surface text-foreground">
        <AppHeader />
        <main className="flex flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <MobileBottomNavigation />
      </div>
    </AuthGuard>
  );
}
