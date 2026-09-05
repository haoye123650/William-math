"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExamPaper } from "@/components/exam-paper";

export default function AnswersPage() {
  return (
    <div className="min-h-full bg-[#e8e0d2]">
      <div className="print:hidden sticky top-0 z-20 border-b bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            返回
          </Button>
          <p className="text-sm text-muted-foreground">教师用，不要先发给学生</p>
          <Button onClick={() => window.print()}>打印答案</Button>
        </div>
      </div>
      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper mode="answers" />
      </div>
    </div>
  );
}
