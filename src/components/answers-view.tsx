"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamBar } from "@/components/exam-bar";
import { ExamPaper } from "@/components/exam-paper";
import { peekExamStatus, subscribeExam } from "@/lib/exam-store";
import type { Paper } from "@/lib/papers/types";

export function AnswersView({ paper }: { paper: Paper }) {
  const submitted = useSyncExternalStore(
    subscribeExam,
    () => peekExamStatus(paper.id) === "submitted",
    () => false
  );
  const sections = paper.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  if (!submitted) {
    return (
      <div className="screen-desk flex min-h-full flex-1 flex-col bg-desk">
        <ExamBar
          title={paper.title}
          subtitle="Mark scheme"
          actions={
            <>
              <Button nativeButton={false} render={<Link href={`/paper/${paper.id}`} />}>
                Back to the paper
              </Button>
              <Button variant="outline" className="bg-sheet" nativeButton={false} render={<Link href="/" />}>
                Course index
              </Button>
            </>
          }
        />
        <main className="mx-auto flex w-full max-w-xl flex-col gap-3 px-5 py-12">
          <h1 className="font-serif text-3xl font-semibold">Mark scheme</h1>
          <p className="text-base leading-7 text-muted-foreground">
            Submit this paper before you open the mark scheme.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="screen-desk flex min-h-full flex-1 flex-col bg-desk">
      <ExamBar
        title={paper.title}
        subtitle="Mark scheme"
        sections={sections}
        actions={<Button onClick={() => window.print()}>Print mark scheme</Button>}
      />
      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper paper={paper} mode="answers" />
      </div>
    </div>
  );
}
