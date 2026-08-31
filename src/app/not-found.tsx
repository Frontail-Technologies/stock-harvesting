import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-10 text-foreground">
      <section className="relative flex w-full max-w-3xl flex-col items-center text-center">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-0 -translate-x-1/2 -translate-y-[58%] select-none text-[8rem] font-black leading-none tracking-tight text-muted/70 sm:text-[13rem] md:text-[17rem] dark:text-muted/25"
        >
          404
        </div>

        <div className="relative z-10 mt-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Page Not Found!
          </h1>
          <p className="mt-3 text-xs text-muted-foreground">
            Content unavailable due to error or deletion by owner
          </p>

          <Link
            href="/charts"
            className="mt-6 inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Back to Home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
