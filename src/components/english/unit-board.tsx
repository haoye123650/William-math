"use client";

import Link from "next/link";
import type { CatalogUnit, Lesson } from "@/lib/english/types";
import { doneCount, useCourseProgress } from "@/lib/english/progress";
import { EnglishShell } from "@/components/english/shell";

export function UnitBoard({ unit, lessonA }: { unit: CatalogUnit; lessonA?: Lesson }) {
  const store = useCourseProgress();
  const warmup = lessonA?.blocks.find((block) => block.id === "warmup" || block.kind === "warmup");

  return (
    <EnglishShell
      crumb={
        <>
          <Link className="hover:underline" href="/english/re3">
            Reading Explorer 3
          </Link>
          <span> / Unit {unit.unit}</span>
        </>
      }
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Unit {unit.unit} · pp. {unit.bookPages}
          </p>
          <h1 className="mt-1 font-serif text-4xl font-semibold">{unit.theme}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Two readings. No video lesson.
          </p>
        </header>

        {warmup?.items && warmup.items.length > 0 ? (
          <details className="rounded-xl border border-border bg-card p-4" open>
            <summary className="cursor-pointer font-serif text-lg font-semibold">Warm-up</summary>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
              {warmup.items.map((item) => (
                <li key={item.id}>{item.prompt}</li>
              ))}
            </ol>
          </details>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {unit.lessons.map((lesson) => {
            const done = Math.min(doneCount(store, unit.unit, lesson.id), lesson.blockCount);
            return (
              <article key={lesson.id} className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                  Reading {lesson.id.toUpperCase()}
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold">{lesson.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{lesson.skill}</p>
                <p className="mt-1 text-xs text-muted-foreground">Book pp. {lesson.bookPages}</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${lesson.blockCount ? (done / lesson.blockCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                  {done}/{lesson.blockCount} sections
                </p>
                <Link
                  href={`/english/re3/unit/${unit.unit}/${lesson.id}`}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                >
                  Open reading
                </Link>
              </article>
            );
          })}
        </div>
      </main>
    </EnglishShell>
  );
}
