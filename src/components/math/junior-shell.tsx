import type { ReactNode } from "react";
import Link from "next/link";

export function JuniorShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: ReactNode;
}) {
  return (
    <div className="min-h-full flex-1 bg-background">
      <header className="bg-board text-board-foreground">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/math/junior" className="min-w-0">
            <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-80">
              尹健熙 · Mathematics
            </p>
            <p className="truncate font-serif text-lg leading-tight font-semibold">
              Practice by topic
            </p>
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm">
            <Link className="underline-offset-4 hover:underline" href="/">
              Subjects
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/math">
              Mathematics
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/math/junior">
              Topics
            </Link>
          </nav>
        </div>
        <div className="h-1 bg-mark" aria-hidden="true" />
      </header>
      {crumb ? (
        <div className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-3xl px-5 py-2 text-sm text-muted-foreground">
            {crumb}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
