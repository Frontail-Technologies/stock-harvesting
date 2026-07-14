import { cn } from "@/utils/cn";

type AppPageProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AppPage({ children, className, contentClassName }: AppPageProps) {
  return (
    <div className={cn("flex-1 bg-surface px-6 py-6", className)}>
      <div className={cn("mx-auto flex max-w-7xl flex-col gap-6", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
