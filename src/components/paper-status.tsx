"use client";

import { useSyncExternalStore } from "react";
import { ItemResults } from "@/components/item-results";
import {
  peekExam,
  peekExamStatus,
  subscribeExam,
  type ExamStatus,
} from "@/lib/exam-store";
import { describeExam, type ProgressKind } from "@/lib/progress-report";

const STATUS_LABEL: Record<ExamStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  submitted: "Submitted",
};

const STATUS_CLASS: Record<ExamStatus, string> = {
  "not-started": "bg-muted text-muted-foreground",
  "in-progress": "bg-amber-100 text-amber-950",
  submitted: "bg-primary/15 text-primary",
};

export function PaperStatus({ paperId }: { paperId: string }) {
  const status = useSyncExternalStore(
    subscribeExam,
    () => peekExamStatus(paperId),
    () => "not-started" as const
  );

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaperProgress({
  paperId,
  title,
  kind,
}: {
  paperId: string;
  title: string;
  kind: Extract<ProgressKind, "paper" | "quiz">;
}) {
  const record = useSyncExternalStore(
    subscribeExam,
    () => peekExam(paperId),
    () => null,
  );
  const view = describeExam({ id: paperId, title, kind }, record);
  if (!view) return null;

  return (
    <div className="mt-3">
      <p className="text-sm leading-6">{view.statusLine}</p>
      {view.note ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{view.note}</p> : null}
      <ItemResults label={view.itemsLabel} items={view.items} />
    </div>
  );
}
