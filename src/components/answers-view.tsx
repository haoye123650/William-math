"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamPaper } from "@/components/exam-paper";
import {
  getExamSnapshot,
  getServerExamSnapshot,
  subscribeExam,
} from "@/lib/exam-store";
import type { Paper } from "@/lib/papers/types";

export function AnswersView({ paper }: { paper: Paper }) {
  const saved = useSyncExternalStore(
    subscribeExam,
    () => getExamSnapshot(paper.id),
    getServerExamSnapshot
  );

  if (!saved.submitted) {
    return (
      <div className="min-h-full bg-[#e8e0d2]">
        <main className="mx-auto flex max-w-xl flex-col gap-4 px-5 py-16">
          <h1 className="font-serif text-3xl font-semibold">Mark scheme</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Submit this paper before you open the mark scheme.
          </p>
          <div className="flex gap-2">
            <Button nativeButton={false} render={<Link href={`/paper/${paper.id}`} />}>
              Back to the paper
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
              Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#e8e0d2]">
      <div className="print:hidden sticky top-0 z-20 border-b bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Back
          </Button>
          <p className="text-sm text-muted-foreground">Mark scheme</p>
          <Button onClick={() => window.print()}>Print mark scheme</Button>
        </div>
      </div>
      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper paper={paper} mode="answers" />
      </div>
    </div>
  );
}
