"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamPaper } from "@/components/exam-paper";
import { matchesAnswer } from "@/lib/grade";
import {
  getExamSnapshot,
  getServerExamSnapshot,
  patchExam,
  resetExam,
  subscribeExam,
} from "@/lib/exam-store";
import { mathPaper } from "@/lib/papers/math";
import { allQuestions, type AnswersState } from "@/lib/papers/types";

function formatTime(totalSec: number) {
  const remain = Math.max(0, mathPaper.durationMin * 60 - totalSec);
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function gradeObjective(answers: AnswersState) {
  const rows: {
    no: string;
    skill: string;
    marks: number;
    got: number;
    ok: boolean;
  }[] = [];

  for (const question of allQuestions(mathPaper)) {
    if (question.type === "work") continue;
    if (question.type === "choice") {
      const ok = answers[question.id] === question.answer;
      rows.push({
        no: question.no,
        skill: question.skill,
        marks: question.marks,
        got: ok ? question.marks : 0,
        ok,
      });
    }
    if (question.type === "fill" && question.blanks) {
      const per = question.marks / question.blanks.length;
      let got = 0;
      for (const blank of question.blanks) {
        if (matchesAnswer(answers[blank.id] ?? "", blank.accepted ?? [blank.answer])) {
          got += per;
        }
      }
      rows.push({
        no: question.no,
        skill: question.skill,
        marks: question.marks,
        got,
        ok: got === question.marks,
      });
    }
  }

  const got = rows.reduce((sum, row) => sum + row.got, 0);
  const total = rows.reduce((sum, row) => sum + row.marks, 0);
  const bySkill: Record<string, { got: number; total: number }> = {};
  for (const row of rows) {
    bySkill[row.skill] ??= { got: 0, total: 0 };
    bySkill[row.skill].got += row.got;
    bySkill[row.skill].total += row.marks;
  }
  return { rows, got, total, bySkill };
}

export function ExamTake() {
  const saved = useSyncExternalStore(
    subscribeExam,
    getExamSnapshot,
    getServerExamSnapshot
  );
  const epochSec = useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setInterval(onStoreChange, 1000);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0
  );

  const elapsed = saved.startedAt
    ? epochSec - Math.floor(saved.startedAt / 1000)
    : 0;
  const overtime = elapsed >= mathPaper.durationMin * 60;
  const result = useMemo(() => gradeObjective(saved.answers), [saved.answers]);
  const ready = saved.startedAt > 0;

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Opening the paper…
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#e8e0d2]">
      <div className="print:hidden sticky top-0 z-20 border-b border-border bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Back
          </Button>
          <p
            className={`font-mono text-lg tabular-nums ${overtime && !saved.submitted ? "text-destructive" : ""}`}
          >
            {saved.submitted ? "Submitted" : overtime ? "Time up" : formatTime(elapsed)}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
            {saved.submitted ? (
              <Button variant="outline" onClick={() => resetExam(saved.name)}>
                Sit again
              </Button>
            ) : (
              <Button
                onClick={() => {
                  patchExam({ submitted: true });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Submit
              </Button>
            )}
          </div>
        </div>
      </div>

      {saved.submitted ? (
        <div className="print:hidden mx-auto max-w-3xl px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Objective items marked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Sections A and B:
                <span className="mx-1 font-serif text-2xl font-semibold">
                  {result.got}
                </span>
                / {result.total}
                . Sections C, D and E (70 marks) need to be marked by you.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.bySkill).map(([skill, score]) => (
                  <span key={skill} className="rounded-full bg-muted px-2.5 py-1">
                    {skill} {score.got}/{score.total}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground">
                Missed objective items:
                {result.rows.filter((row) => !row.ok).length === 0
                  ? " none"
                  : result.rows
                      .filter((row) => !row.ok)
                      .map((row) => ` Q${row.no}`)
                      .join(",")}
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/answers" />}
              >
                Open mark scheme
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper
          mode="take"
          name={saved.name}
          onName={(name) => patchExam({ name })}
          answers={saved.answers}
          onAnswer={(key, next) => {
            if (saved.submitted) return;
            patchExam({ answers: { ...saved.answers, [key]: next } });
          }}
        />
      </div>
    </div>
  );
}
