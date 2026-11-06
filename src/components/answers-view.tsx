"use client";

import { Button } from "@/components/ui/button";
import { ExamBar } from "@/components/exam-bar";
import { ExamPaper } from "@/components/exam-paper";
import type { Paper } from "@/lib/papers/types";

export function AnswersView({ paper }: { paper: Paper }) {
  const sections = paper.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  return (
    <div className="screen-desk flex min-h-full flex-1 flex-col bg-desk">
      <ExamBar
        title={paper.title}
        subtitle="Teacher use — do not give this to the student first"
        sections={sections}
        actions={
          <Button onClick={() => window.print()}>Print mark scheme</Button>
        }
      />
      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper paper={paper} mode="answers" />
      </div>
    </div>
  );
}
