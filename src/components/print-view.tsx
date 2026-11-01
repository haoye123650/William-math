"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamPaper } from "@/components/exam-paper";
import type { Paper } from "@/lib/papers/types";

export function PrintView({ paper }: { paper: Paper }) {
  return (
    <div className="min-h-full bg-[#e8e0d2]">
      <div className="print:hidden sticky top-0 z-20 border-b bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Back
          </Button>
          <Button onClick={() => window.print()}>Print / Save PDF</Button>
        </div>
      </div>
      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper paper={paper} mode="print" />
      </div>
    </div>
  );
}
