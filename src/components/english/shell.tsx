import type { ReactNode } from "react";
import Link from "next/link";

export function EnglishShell({
  children,
  crumb,
}: {
  children: ReactNode;
  crumb?: ReactNode;
}) {
  return (
    <div className="theme-english min-h-full flex-1">
      <header className="bg-board text-board-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/english/re3" className="min-w-0">
            <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-80">
              尹健熙 · English
            </p>
            <p className="truncate font-serif text-lg leading-tight font-semibold">
              Reading Explorer 3
            </p>
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm">
            <Link className="underline-offset-4 hover:underline" href="/">
              Subjects
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/english/re3">
              Units
            </Link>
          </nav>
        </div>
        <div className="h-1 bg-mark" aria-hidden="true" />
      </header>
      {crumb ? (
        <div className="border-b border-border bg-card">
          <div className="mx-auto w-full max-w-5xl px-4 py-2 text-sm text-muted-foreground sm:px-6">
            {crumb}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  );
}
