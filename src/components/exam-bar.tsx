import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function sectionLetter(title: string) {
  return title.match(/^Section\s+([A-Z])/)?.[1] ?? "";
}

export function sectionShort(title: string) {
  return title.replace(/^Section\s+[A-Z]\s*/, "").replace(/\s+/g, " ").trim();
}

export function ExamBar({
  title,
  subtitle,
  sections,
  actions,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  sections?: { id: string; title: string }[];
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="print:hidden sticky top-0 z-30 border-b border-border bg-sheet shadow-[0_1px_0_var(--border)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5 px-3 py-2.5 sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-sheet"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Course index
            </Button>
            <div className="min-w-0">
              <p className="truncate font-serif text-base leading-tight font-semibold">
                {title}
              </p>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
        {sections && sections.length > 0 ? (
          <nav aria-label="Sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
            {sections.map((section) => {
              const letter = sectionLetter(section.title);
              const short = sectionShort(section.title);
              return (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  aria-label={section.title}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="font-serif font-semibold text-primary" aria-hidden="true">
                    {letter}
                  </span>
                  <span aria-hidden="true">{short}</span>
                </a>
              );
            })}
          </nav>
        ) : null}
        {footer}
      </div>
    </div>
  );
}
