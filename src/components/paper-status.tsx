"use client";

import { useSyncExternalStore } from "react";
import {
  peekExamStatus,
  subscribeExam,
  type ExamStatus,
} from "@/lib/exam-store";

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

function summarize(ids: string[]) {
  let submitted = 0;
  let inProgress = 0;
  for (const id of ids) {
    const status = peekExamStatus(id);
    if (status === "submitted") submitted += 1;
    else if (status === "in-progress") inProgress += 1;
  }
  return `${submitted}/${inProgress}/${ids.length}`;
}

export function StudySummary({ ids }: { ids: string[] }) {
  const signature = useSyncExternalStore(
    subscribeExam,
    () => summarize(ids),
    () => `0/0/${ids.length}`
  );
  const [submitted, inProgress, total] = signature.split("/").map(Number);

  return (
    <p className="text-sm leading-6 text-muted-foreground">
      <span className="font-semibold text-foreground">{submitted}</span>
      {" of "}
      {total}
      {" papers submitted"}
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
