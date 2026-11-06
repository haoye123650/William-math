"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamPaper } from "@/components/exam-paper";
import { incorrectParts, matchesAnswer } from "@/lib/grade";
import {
  getExamSnapshot,
  getServerExamSnapshot,
  patchExam,
  resetExam,
  subscribeExam,
} from "@/lib/exam-store";
import { allQuestions, curriculumTag, type AnswersState, type Paper } from "@/lib/papers/types";

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

export function ExamTake({ paper }: { paper: Paper }) {
  const saved = useSyncExternalStore(
    subscribeExam,
    () => getExamSnapshot(paper.id),
    getServerExamSnapshot
  );
  const levelTag = curriculumTag(paper.level);
  const result = useMemo(
    () => gradeObjective(paper, saved.answers),
    [paper, saved.answers]
  );
  const misses = useMemo(
    () => allQuestions(paper).flatMap((question) => incorrectParts(question, saved.answers)),
    [paper, saved.answers]
  );

  function retryMissed() {
    const missedIds = new Set(misses.map((part) => part.key));
    const nextAnswers = { ...saved.answers };
    const lockedKeys: string[] = [];
    for (const question of allQuestions(paper)) {
      if (question.type === "work") {
        lockedKeys.push(question.id);
        continue;
      }
      const keys =
        question.type === "choice"
          ? [question.id]
          : (question.blanks ?? []).map((blank) => blank.id);
      for (const key of keys) {
        if (missedIds.has(key)) delete nextAnswers[key];
        else lockedKeys.push(key);
      }
    }
    const anchor = misses[0]?.anchorId;
    patchExam(paper.id, {
      answers: nextAnswers,
      submitted: false,
      lockedKeys,
    });
    if (!anchor) return;
    window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="min-h-full bg-[#e8e0d2]">
      <div className="print:hidden sticky top-0 z-20 border-b border-border bg-[#fbf7ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
            Back
          </Button>
          <p className="text-sm font-medium">
            {saved.submitted ? "Submitted" : "In progress"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
            {saved.submitted ? (
              <>
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<a href="#review" />}
                >
                  Wrong answers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => resetExam(paper.id, saved.name)}
                >
                  Start again
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  patchExam(paper.id, { submitted: true });
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
        <div id="review" className="print:hidden scroll-mt-28 mx-auto max-w-3xl px-4 py-4">
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
                / {result.total}. Green with a tick is correct; red is wrong.
                Fill-in blanks are marked one by one. Sections C, D and E are
                marked by the teacher.
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(result.bySkill).map(([skill, score]) => (
                  <span key={skill} className="rounded-full bg-muted px-2.5 py-1">
                    {skill} {score.got}/{score.total}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">Review wrong answers</p>
                  {misses.length > 0 ? (
                    <Button onClick={retryMissed}>Retry missed</Button>
                  ) : null}
                </div>
                {misses.length === 0 ? (
                  <p className="text-muted-foreground">
                    No incorrect parts in Sections A and B.
                  </p>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Open a row to jump to that question on the paper. Retry missed clears
                      only the incorrect objective answers and keeps the ones that were right.
                      Use Back to review on the question to return here.
                    </p>
                    <ul className="space-y-2">
                      {misses.map((part) => (
                        <li key={part.key}>
                          <a
                            href={`#${part.anchorId}`}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-red-950 hover:bg-red-100"
                          >
                            <span className="font-medium">Q{part.no}</span>
                            {levelTag ? <span>{levelTag}</span> : null}
                            <span>{part.part}</span>
                            <span>You wrote {part.yours}</span>
                            <span>Answer {part.answer}</span>
                            <span className="ml-auto text-xs font-semibold tracking-wide underline">
                              Go to question
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
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
          lockedKeys={saved.lockedKeys}
          onAnswer={(key, next) => {
            const current = getExamSnapshot(paper.id);
            if (current.submitted) return;
            if (current.lockedKeys?.includes(key)) return;
            patchExam(paper.id, { answers: { ...current.answers, [key]: next } });
          }}
        />
      </div>
    </div>
  );
}
