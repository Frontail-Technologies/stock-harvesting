import { cn } from "@/utils/cn";

type AppPageProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AppPage({ children, className, contentClassName }: AppPageProps) {
  return (
    <div className={cn("flex-1 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--primary)_10%,var(--background))_0,var(--surface)_11rem)] px-3 py-3 sm:bg-surface sm:px-6 sm:py-6", className)}>
      <div className={cn("mx-auto flex w-full max-w-screen-2xl flex-col gap-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
