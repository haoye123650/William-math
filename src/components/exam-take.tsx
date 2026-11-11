"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ItemResults } from "@/components/item-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamBar } from "@/components/exam-bar";
import { ExamPaper } from "@/components/exam-paper";
import { incorrectParts, itemResultLabel, objectiveReport } from "@/lib/grade";
import { formatMarks, formatWhen } from "@/lib/progress-report";
import {
  getExamSnapshot,
  getServerExamSnapshot,
  patchExam,
  resetExam,
  subscribeExam,
} from "@/lib/exam-store";
import {
  allQuestions,
  curriculumTag,
  hasTeacherMarkedWork,
  type AnswersState,
  type Paper,
} from "@/lib/papers/types";

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
  const levelTag = curriculumTag(paper.level);
  const result = useMemo(
    () => objectiveReport(paper, saved.answers),
    [paper, saved.answers]
  );
  const resultCounts = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    for (const item of result.items) {
      if (item.ok) correct += 1;
      else incorrect += 1;
    }
    return { correct, incorrect };
  }, [result.items]);
  const misses = useMemo(
    () => allQuestions(paper).flatMap((question) => incorrectParts(question, saved.answers)),
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

  useEffect(() => {
    if (!saved.submitted || saved.completion) return;
    patchExam(paper.id, {
      completion: {
        objectiveGot: result.got,
        objectiveTotal: result.total,
        teacherMarked: hasTeacherMarkedWork(paper),
        items: result.items.map((item) => ({
          key: item.key,
          label: itemResultLabel(item.no, item.part),
          ok: item.ok,
        })),
      },
    });
  }, [paper, result, saved.submitted, saved.completion]);

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
    <div className="screen-desk flex min-h-full flex-1 flex-col bg-desk">
      <ExamBar
        title={paper.title}
        subtitle={
          saved.submitted
            ? saved.completion?.completedAt
              ? `Submitted ${formatWhen(saved.completion.completedAt)}`
              : "Submitted"
            : "In progress"
        }
        sections={sections}
        actions={
          <>
            <Button variant="outline" className="bg-sheet" onClick={() => window.print()}>
              Print
            </Button>
            {saved.submitted ? (
              <>
                <Button
                  variant="outline"
                  className="bg-sheet"
                  nativeButton={false}
                  render={<a href="#review" />}
                >
                  Wrong answers
                </Button>
                <Button
                  variant="outline"
                  className="bg-sheet"
                  onClick={() => resetExam(paper.id, saved.name)}
                >
                  Start again
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  const report = objectiveReport(paper, saved.answers);
                  patchExam(paper.id, {
                    submitted: true,
                    completion: {
                      completedAt: Date.now(),
                      objectiveGot: report.got,
                      objectiveTotal: report.total,
                      teacherMarked: hasTeacherMarkedWork(paper),
                      items: report.items.map((item) => ({
                        key: item.key,
                        label: itemResultLabel(item.no, item.part),
                        ok: item.ok,
                      })),
                    },
                  });
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
                {formatMarks(result.got)}/{formatMarks(result.total)}
              </span>
              {" · "}
              {resultCounts.correct} correct, {resultCounts.incorrect} incorrect
            </p>
          ) : (
            <AnswerProgress done={progress.done} total={progress.total} />
          )
        }
      />

      {saved.submitted ? (
        <div id="review" className="print:hidden scroll-mt-56 mx-auto w-full max-w-3xl px-3 py-4 sm:px-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-xl">Objective items marked</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <ItemResults
                label="Item results"
                items={result.items.map((item) => ({
                  key: item.key,
                  label: itemResultLabel(item.no, item.part),
                  ok: item.ok,
                }))}
              />
              <p>
                Sections A and B:
                <span className="mx-1 font-serif text-2xl font-semibold tabular-nums">
                  {result.got}
                </span>
                / {result.total}. Green with a tick is correct; red is wrong.
                Fill-in blanks are marked one by one.{" "}
                {hasTeacherMarkedWork(paper)
                  ? "Sections C, D and E are marked by the teacher."
                  : "Every item on this paper is marked from the key."}
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
                            <span className="font-medium">
                              {/^\d/.test(part.no) ? `Q${part.no}` : part.no}
                            </span>
                            {(() => {
                              const tag =
                                allQuestions(paper).find((question) => question.id === part.questionId)
                                  ?.levelTag ?? levelTag;
                              return tag ? <span>[{tag}]</span> : null;
                            })()}
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
          scoreLabel={
            saved.submitted
              ? `${formatMarks(result.got)} / ${formatMarks(result.total)} objective`
              : undefined
          }
        />
      </div>
    </div>
  );
}
