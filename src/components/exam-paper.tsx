"use client";

import { useState } from "react";
import { Check, Languages, Minus, X } from "lucide-react";
import { TriangleDiagram } from "@/components/diagrams";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { gradeQuestion, type QuestionStatus } from "@/lib/grade";
import type { AnswersState, Paper, Question, Section } from "@/lib/papers/types";

export type ExamMode = "take" | "print" | "answers";

function Stem({ html }: { html: string }) {
  return (
    <div
      className="stem leading-[1.85]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function Lines({ count }: { count: number }) {
  return (
    <div className="mt-3 space-y-4 print:space-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-0 border-b border-dashed border-foreground/25" />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: QuestionStatus }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
        <Check className="size-3.5" />
        Correct
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
        <Minus className="size-3.5" />
        Partial
      </span>
    );
  }
  if (status === "incorrect") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
        <X className="size-3.5" />
        Incorrect
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      To be marked
    </span>
  );
}

function QuestionBlock({
  question,
  mode,
  reviewed,
  value,
  onChange,
}: {
  question: Question;
  mode: ExamMode;
  reviewed?: boolean;
  value?: AnswersState;
  onChange?: (key: string, next: string) => void;
}) {
  const [zh, setZh] = useState(false);
  const showKey = mode === "answers";
  const answers = value ?? {};
  const result = reviewed ? gradeQuestion(question, answers) : null;
  const status = result?.status;
  const interactive = mode === "take" && !reviewed;
  const stem = zh ? (question.stemZh ?? question.stem) : question.stem;

  return (
    <article
      className={cn(
        "break-inside-avoid space-y-3 rounded-xl py-4 print:rounded-none",
        reviewed && status === "correct" && "border border-emerald-300 bg-emerald-50/70 px-3 print:border print:bg-emerald-50",
        reviewed && status === "incorrect" && "border border-red-300 bg-red-50/70 px-3 print:border print:bg-red-50",
        reviewed && status === "partial" && "border border-amber-300 bg-amber-50/70 px-3 print:border print:bg-amber-50",
        reviewed && status === "pending" && "px-0"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 shrink-0 font-serif text-lg font-semibold">
          {question.no}.
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Stem html={stem} />
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setZh((v) => !v)}
                className={cn(
                  "print:hidden inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition",
                  zh
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-white hover:bg-accent"
                )}
                aria-pressed={zh}
              >
                <Languages className="size-3.5" />
                {zh ? "EN" : "中文"}
              </button>
              {reviewed && status ? <StatusBadge status={status} /> : null}
              <span className="text-sm text-muted-foreground">
                ({question.marks} {zh ? "分" : "marks"})
              </span>
            </div>
          </div>

          {question.diagram === "triangle" ? (
            <div className="rounded-lg border border-border bg-white/60 p-3">
              <TriangleDiagram />
            </div>
          ) : null}

          {question.type === "choice" && question.options ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.key;
                const isAnswer = option.key === question.answer;
                const showAnswer = showKey || Boolean(reviewed);
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(question.id, option.key)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                      interactive && "hover:border-foreground/40 hover:bg-accent",
                      selected && !reviewed && "border-foreground bg-accent",
                      reviewed && selected && isAnswer && "border-emerald-600 bg-emerald-100 text-emerald-950",
                      reviewed && selected && !isAnswer && "border-red-500 bg-red-100 text-red-950",
                      reviewed && !selected && isAnswer && "border-emerald-600 bg-emerald-50 text-emerald-950",
                      showAnswer && isAnswer && !reviewed && "border-emerald-700 bg-emerald-50",
                      mode === "print" && "cursor-default border-dashed"
                    )}
                  >
                    <span className="font-medium">{option.key}.</span>
                    <span
                      className="stem flex-1"
                      dangerouslySetInnerHTML={{
                        __html: zh && option.textZh ? option.textZh : option.text,
                      }}
                    />
                    {reviewed && selected && isAnswer ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                    ) : null}
                    {reviewed && selected && !isAnswer ? (
                      <X className="mt-0.5 size-4 shrink-0 text-red-600" />
                    ) : null}
                    {reviewed && !selected && isAnswer ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {question.type === "fill" && question.blanks ? (
            <div className="flex flex-col gap-3">
              {question.blanks.map((blank) => {
                const blankOk = result?.blankResults[blank.id];
                return (
                  <label key={blank.id} className="flex min-w-[10rem] flex-wrap items-center gap-2">
                    {blank.label ? (
                      <span className="text-sm text-muted-foreground">
                        {zh && blank.labelZh ? blank.labelZh : blank.label}
                      </span>
                    ) : null}
                    {mode === "take" ? (
                      <Input
                        value={answers[blank.id] ?? ""}
                        readOnly={reviewed}
                        onChange={(event) => onChange?.(blank.id, event.target.value)}
                        className={cn(
                          "h-9 bg-white",
                          reviewed && blankOk && "border-emerald-600 bg-emerald-50 text-emerald-950",
                          reviewed && !blankOk && "border-red-500 bg-red-50 text-red-950"
                        )}
                      />
                    ) : (
                      <span className="inline-flex min-h-9 min-w-28 flex-1 items-center border-b border-foreground/40 px-1">
                        {showKey ? blank.answer : ""}
                      </span>
                    )}
                    {reviewed && blankOk ? (
                      <Check className="size-4 text-emerald-700" />
                    ) : null}
                    {reviewed && !blankOk ? (
                      <span className="text-sm text-red-700">
                        <X className="mr-1 inline size-4 align-text-bottom" />
                        Answer: {blank.answer}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          ) : null}

          {question.type === "work" ? (
            mode === "take" ? (
              <div className="space-y-2">
                <Textarea
                  value={answers[question.id] ?? ""}
                  readOnly={reviewed}
                  onChange={(event) => onChange?.(question.id, event.target.value)}
                  className="min-h-32 bg-white font-serif"
                  placeholder={zh ? "在此写出步骤和答案" : "Write your working and answer here"}
                />
                {reviewed ? (
                  <p className="text-sm text-muted-foreground">
                    {zh
                      ? "本题由老师批改。"
                      : "This question is marked by the teacher."}
                  </p>
                ) : null}
              </div>
            ) : (
              <Lines count={question.lines ?? 6} />
            )
          ) : null}

          {showKey ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm leading-relaxed text-emerald-950">
              <p>
                <span className="font-medium">Answer: </span>
                <span dangerouslySetInnerHTML={{ __html: question.answer }} />
              </p>
              <p className="mt-1">
                <span className="font-medium">Notes: </span>
                <span dangerouslySetInnerHTML={{ __html: question.explanation }} />
              </p>
              {question.marking ? (
                <p className="mt-1">
                  <span className="font-medium">Marking: </span>
                  {question.marking}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SectionBlock({
  section,
  mode,
  reviewed,
  value,
  onChange,
}: {
  section: Section;
  mode: ExamMode;
  reviewed?: boolean;
  value?: AnswersState;
  onChange?: (key: string, next: string) => void;
}) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-foreground/20 pb-2">
        <h2 className="font-serif text-xl font-semibold">
          {section.title}
          {section.extra ? (
            <Badge variant="secondary" className="ml-2 align-middle">
              Not in the 100 marks
            </Badge>
          ) : null}
        </h2>
        <p className="text-sm text-muted-foreground">{section.marks} marks</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{section.instruction}</p>
      <div className="divide-y divide-border/70">
        {section.questions.map((question) => (
          <QuestionBlock
            key={question.id}
            question={question}
            mode={mode}
            reviewed={reviewed}
            value={value}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

export function ExamHeader({
  paper,
  mode,
  name,
  onName,
  reviewed,
}: {
  paper: Paper;
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
  reviewed?: boolean;
}) {
  return (
    <header className="border-b-2 border-foreground pb-5">
      <p className="text-center text-sm tracking-[0.35em] text-muted-foreground">
        Pui Kiu Mathematics · September 2026
      </p>
      <h1 className="mt-2 text-center font-serif text-3xl font-semibold tracking-wide">
        {paper.title}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {paper.totalMarks} marks · {paper.durationMin} minutes · Section E {paper.extraMarks} marks extra
      </p>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="shrink-0">Name</span>
          {mode === "take" ? (
            <Input
              value={name ?? ""}
              readOnly={reviewed}
              onChange={(event) => onName?.(event.target.value)}
              className="h-8 bg-white"
            />
          ) : (
            <span className="flex-1 border-b border-foreground/40">&nbsp;</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0">School</span>
          <span className="flex-1 border-b border-foreground/40 text-muted-foreground">
            Pui Kiu 培侨
          </span>
        </div>
        <label className="flex items-center gap-2">
          <span className="shrink-0">Score</span>
          <span className="flex-1 border-b border-foreground/40">
            {mode === "answers" ? "See each question" : ""}
          </span>
        </label>
      </div>
      {mode !== "answers" ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {paper.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>Materials: {paper.materials}</li>
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Teacher copy. Mark Sections A and B against the key. Award method marks in
          Sections C and D.
        </p>
      )}
    </header>
  );
}

export function ExamPaper({
  paper,
  mode,
  name,
  onName,
  answers,
  onAnswer,
  reviewed,
}: {
  paper: Paper;
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
  answers?: AnswersState;
  onAnswer?: (key: string, next: string) => void;
  reviewed?: boolean;
}) {
  return (
    <div className="exam-sheet mx-auto max-w-3xl bg-[#fbf7ef] px-5 py-8 text-foreground shadow-sm sm:px-10 print:max-w-none print:bg-white print:px-0 print:py-0 print:shadow-none">
      <ExamHeader paper={paper} mode={mode} name={name} onName={onName} reviewed={reviewed} />
      {paper.sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          mode={mode}
          reviewed={reviewed}
          value={answers}
          onChange={onAnswer}
        />
      ))}
      {mode === "answers" ? (
        <section className="mt-10 break-inside-avoid border-t border-foreground/20 pt-6">
          <h2 className="font-serif text-xl font-semibold">How to read the score</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {paper.scoreBands.map((band) => (
              <li key={band.range}>
                <span className="font-medium">{band.range}: </span>
                {band.note}
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-serif text-xl font-semibold">When marking, watch</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {paper.tutorTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        — End of paper —
      </p>
    </div>
  );
}
