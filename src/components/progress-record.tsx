"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ItemResults } from "@/components/item-results";
import { Button } from "@/components/ui/button";
import {
  decodeSnapshot,
  encodeSnapshot,
  formatSnapshotText,
  formatWhen,
  progressModelKey,
  progressPageUrl,
  subscribeProgress,
  type ProgressCatalog,
  type ProgressModel,
} from "@/lib/progress-report";

function emptyModel(catalog: ProgressCatalog): ProgressModel {
  return {
    papersSubmitted: 0,
    papersInProgress: 0,
    papersTotal: catalog.papers.length,
    lessonsCompleted: 0,
    lessonsInProgress: 0,
    lessonsTotal: catalog.topics.length,
    activities: [],
  };
}

function CountLine({
  done,
  total,
  inProgress,
  noun,
}: {
  done: number;
  total: number;
  inProgress: number;
  noun: string;
}) {
  return (
    <p className="text-sm leading-6 text-muted-foreground">
      <span className="font-semibold text-foreground">{done}</span>
      {" of "}
      {total}
      {` ${noun}`}
      {inProgress > 0 ? (
        <>
          {" · "}
          <span className="font-semibold text-foreground">{inProgress}</span>
          {" in progress"}
        </>
      ) : null}
    </p>
  );
}

function ActivityList({ model }: { model: ProgressModel }) {
  if (model.activities.length === 0) {
    return (
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        No papers or lessons recorded on this browser yet.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-4">
      {model.activities.map((activity) => (
        <li key={`${activity.kind}-${activity.id}`} className="border-t border-border pt-4">
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            {activity.kind === "quiz" ? "Quiz" : activity.kind === "lesson" ? "Lesson" : "Paper"}
          </p>
          {activity.href ? (
            <Link href={activity.href} className="font-serif text-lg font-semibold underline-offset-4 hover:underline">
              {activity.title}
            </Link>
          ) : (
            <p className="font-serif text-lg font-semibold">{activity.title}</p>
          )}
          <p className="mt-1 text-sm leading-6">{activity.statusLine}</p>
          {activity.note ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{activity.note}</p> : null}
          <ItemResults label={activity.itemsLabel} items={activity.items} />
        </li>
      ))}
    </ul>
  );
}

function ShareActions({ model }: { model: ProgressModel }) {
  const [notice, setNotice] = useState("");
  const [manual, setManual] = useState("");

  async function copy(text: string, ok: string) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("clipboard")), 1500);
        }),
      ]);
      setManual("");
      setNotice(ok);
    } catch {
      setNotice("");
      setManual(text);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm leading-6 text-muted-foreground">
        Saved in this browser. Copy a summary or a parent link to open this record on another phone.
        The link is a snapshot and does not update later. There is no login.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="bg-card"
          onClick={() => {
            const snapshot = { ...model, exportedAt: Date.now() };
            void copy(formatSnapshotText(snapshot), "Copied the summary.");
          }}
        >
          Copy summary
        </Button>
        <Button
          type="button"
          onClick={() => {
            const token = encodeSnapshot(model);
            void copy(progressPageUrl(token), "Copied the parent link.");
          }}
        >
          Copy parent link
        </Button>
      </div>
      {notice ? <p className="text-sm font-medium">{notice}</p> : null}
      {manual ? (
        <textarea
          readOnly
          value={manual}
          aria-label="Progress text to copy"
          className="min-h-32 w-full rounded-lg border border-border bg-background p-3 text-sm"
          onFocus={(event) => event.currentTarget.select()}
        />
      ) : null}
    </div>
  );
}

export function ProgressRecord({ catalog }: { catalog: ProgressCatalog }) {
  const raw = useSyncExternalStore(
    subscribeProgress,
    () => progressModelKey(catalog),
    () => "",
  );
  const model = useMemo(
    () => (raw ? (JSON.parse(raw) as ProgressModel) : emptyModel(catalog)),
    [raw, catalog],
  );

  return (
    <section id="progress" aria-labelledby="progress-title" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <h2 id="progress-title" className="font-serif text-2xl font-semibold">Progress</h2>
      <div className="mt-3 space-y-1">
        <CountLine
          done={model.papersSubmitted}
          total={model.papersTotal}
          inProgress={model.papersInProgress}
          noun="papers submitted"
        />
        <CountLine
          done={model.lessonsCompleted}
          total={model.lessonsTotal}
          inProgress={model.lessonsInProgress}
          noun="lessons completed"
        />
      </div>
      <ActivityList model={model} />
      <ShareActions model={model} />
    </section>
  );
}

function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function ProgressScreen({ catalog }: { catalog: ProgressCatalog }) {
  const token = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.replace(/^#/, ""),
    () => "",
  );
  const shared = token ? decodeSnapshot(token) : null;

  if (token && !shared) {
    return (
      <div className="space-y-6">
        <p className="text-sm leading-6">This progress link could not be read.</p>
        <ProgressRecord catalog={catalog} />
      </div>
    );
  }

  if (shared) {
    return (
      <section aria-labelledby="progress-title" className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 id="progress-title" className="font-serif text-2xl font-semibold">Shared progress</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Shared snapshot from {formatWhen(shared.exportedAt)}. This is a copy of one browser&apos;s record.
          It does not update if the student continues.
        </p>
        <div className="mt-3 space-y-1">
          <CountLine
            done={shared.papersSubmitted}
            total={shared.papersTotal}
            inProgress={shared.papersInProgress}
            noun="papers submitted"
          />
          <CountLine
            done={shared.lessonsCompleted}
            total={shared.lessonsTotal}
            inProgress={shared.lessonsInProgress}
            noun="lessons completed"
          />
        </div>
        <ActivityList model={shared} />
      </section>
    );
  }

  return <ProgressRecord catalog={catalog} />;
}
