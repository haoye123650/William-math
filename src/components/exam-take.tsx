"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamBar } from "@/components/exam-bar";
import { ExamPaper } from "@/components/exam-paper";
import { matchesAnswer } from "@/lib/grade";
import {
  getExamSnapshot,
  getServerExamSnapshot,
  patchExam,
  resetExam,
  subscribeExam,
} from "@/lib/exam-store";
import { allQuestions, type AnswersState, type Paper } from "@/lib/papers/types";

function formatTime(elapsed: number, durationMin: number) {
  const remain = Math.max(0, durationMin * 60 - elapsed);
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function countParts(paper: Paper, answers: AnswersState) {
  let total = 0;
  let done = 0;
  for (const question of allQuestions(paper)) {
    if (question.type === "fill" && question.blanks) {
      for (const blank of question.blanks) {
        total += 1;
        if ((answers[blank.id] ?? "").trim()) done += 1;
      }
    } else {
      total += 1;
      if ((answers[question.id] ?? "").trim()) done += 1;
    }
  }
  return { done, total };
}

function gradeObjective(paper: Paper, answers: AnswersState) {
  const rows: {
    no: string;
    skill: string;
    marks: number;
    got: number;
    ok: boolean;
  }[] = [];

  for (const question of allQuestions(paper)) {
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

function ExamClock({
  startedAt,
  durationMin,
  submitted,
}: {
  startedAt: number;
  durationMin: number;
  submitted?: boolean;
}) {
  const epochSec = useSyncExternalStore(
    (onStoreChange) => {
      const id = window.setInterval(onStoreChange, 1000);
      return () => window.clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000),
    () => 0
  );
  const elapsed = startedAt ? epochSec - Math.floor(startedAt / 1000) : 0;
  const overtime = startedAt > 0 && elapsed >= durationMin * 60;
  const label = submitted ? "Submitted" : overtime ? "Time up" : formatTime(elapsed, durationMin);

  return (
    <p
      role="timer"
      className={`font-mono text-lg tabular-nums max-sm:mr-auto ${overtime && !submitted ? "text-destructive" : ""}`}
    >
      {label}
    </p>
  );
}

function AnswerProgress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {done} of {total} parts answered
      </p>
    </div>
  );
}

export function ExamTake({ paper }: { paper: Paper }) {
  const saved = useSyncExternalStore(
    subscribeExam,
    () => getExamSnapshot(paper.id),
    getServerExamSnapshot
  );
  const result = useMemo(
    () => gradeObjective(paper, saved.answers),
    [paper, saved.answers]
  );
  const progress = useMemo(
    () => countParts(paper, saved.answers),
    [paper, saved.answers]
  );
  const sections = paper.sections.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  return (
    <div className="screen-desk flex min-h-full flex-1 flex-col bg-desk">
      <ExamBar
        title={paper.title}
        subtitle={saved.submitted ? "Submitted · review your script" : "Sitting"}
        sections={sections}
        actions={
          <>
            <ExamClock
              startedAt={saved.startedAt}
              durationMin={paper.durationMin}
              submitted={saved.submitted}
            />
            <Button variant="outline" className="bg-sheet" onClick={() => window.print()}>
              Print
            </Button>
            {saved.submitted ? (
              <Button
                variant="outline"
                className="bg-sheet"
                onClick={() => resetExam(paper.id, saved.name)}
              >
                Sit again
              </Button>
            ) : (
              <Button
                onClick={() => {
                  patchExam(paper.id, { submitted: true });
                  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                  window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
                }}
              >
                Submit
              </Button>
            )}
          </>
        }
        footer={
          saved.submitted ? (
            <p className="text-xs text-muted-foreground">
              Objective score{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {result.got}/{result.total}
              </span>
            </p>
          ) : (
            <AnswerProgress done={progress.done} total={progress.total} />
          )
        }
      />

      {saved.submitted ? (
        <div className="print:hidden mx-auto w-full max-w-3xl px-3 py-4 sm:px-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Objective items marked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Sections A and B:
                <span className="mx-1 font-serif text-2xl font-semibold tabular-nums">
                  {result.got}
                </span>
                / {result.total}. Green with a tick is correct; red is wrong.
                Fill-in blanks are marked one by one. Sections C, D and E are
                marked by the teacher.
              </p>
              <ul className="space-y-2.5">
                {Object.entries(result.bySkill).map(([skill, score]) => {
                  const pct = score.total === 0 ? 0 : Math.round((score.got / score.total) * 100);
                  return (
                    <li key={skill}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span>{skill}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {score.got}/{score.total}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
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
                render={<Link href={`/answers/${paper.id}`} />}
              >
                Open mark scheme
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="px-3 py-6 print:px-0 print:py-0">
        <ExamPaper
          paper={paper}
          mode="take"
          reviewed={saved.submitted}
          name={saved.name}
          onName={(name) => patchExam(paper.id, { name })}
          answers={saved.answers}
          onAnswer={(key, next) => {
            if (saved.submitted) return;
            patchExam(paper.id, { answers: { ...saved.answers, [key]: next } });
          }}
          scoreLabel={
            saved.submitted ? `${result.got} / ${result.total} objective` : undefined
          }
        />
      </div>
    </div>
  );
}
