"use client";

import Link from "next/link";
import { catalog } from "@/lib/english/content";
import { doneCount, useCourseProgress } from "@/lib/english/progress";

export function CourseBoard() {
  const store = useCourseProgress();
  const lessons = catalog.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({ unit: unit.unit, ...lesson })),
  );
  const totalBlocks = lessons.reduce((sum, lesson) => sum + lesson.blockCount, 0);
  const done = lessons.reduce(
    (sum, lesson) => sum + Math.min(doneCount(store, lesson.unit, lesson.id), lesson.blockCount),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Third edition
          </p>
          <h1 className="font-serif text-3xl font-semibold sm:text-4xl">Twelve units</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Each unit is Reading A and Reading B. Open a lesson to read the passage,
            study the book figures, and practice on the same page.
          </p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {done}/{totalBlocks} sections done
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">
        {catalog.units.map((unit) => {
          const unitDone = unit.lessons.reduce(
            (sum, lesson) => sum + Math.min(doneCount(store, unit.unit, lesson.id), lesson.blockCount),
            0,
          );
          const unitTotal = unit.lessons.reduce((sum, lesson) => sum + lesson.blockCount, 0);
          return (
            <li key={unit.unit}>
              <Link
                href={`/english/re3/unit/${unit.unit}`}
                className="block h-full rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                    Unit {unit.unit}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    pp. {unit.bookPages}
                  </p>
                </div>
                <h2 className="mt-1 font-serif text-2xl font-semibold">{unit.theme}</h2>
                <ul className="mt-3 space-y-1 text-sm">
                  {unit.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex gap-2">
                      <span className="font-semibold text-primary uppercase">{lesson.id}</span>
                      <span>{lesson.title}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${unitTotal ? (unitDone / unitTotal) * 100 : 0}%` }}
                  />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
