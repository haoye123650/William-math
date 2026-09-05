"use client";

import { TriangleDiagram } from "@/components/diagrams";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnswersState, Question, Section } from "@/lib/papers/types";
import { mathPaper } from "@/lib/papers/math";

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

function QuestionBlock({
  question,
  mode,
  value,
  onChange,
}: {
  question: Question;
  mode: ExamMode;
  value?: AnswersState;
  onChange?: (key: string, next: string) => void;
}) {
  const showKey = mode === "answers";

  return (
    <article className="break-inside-avoid space-y-3 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 shrink-0 font-serif text-lg font-semibold">
          {question.no}.
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Stem html={question.stem} />
            <span className="shrink-0 text-sm text-muted-foreground">
              （{question.marks} 分）
            </span>
          </div>

          {question.diagram === "triangle" ? (
            <div className="rounded-lg border border-border bg-white/60 p-3">
              <TriangleDiagram />
            </div>
          ) : null}

          {question.type === "choice" && question.options ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const selected = value?.[question.id] === option.key;
                const isAnswer = showKey && option.key === question.answer;
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={mode !== "take"}
                    onClick={() => onChange?.(question.id, option.key)}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                      mode === "take" && "hover:border-foreground/40 hover:bg-accent",
                      selected && "border-foreground bg-accent",
                      isAnswer && "border-emerald-700 bg-emerald-50",
                      mode === "print" && "cursor-default border-dashed"
                    )}
                  >
                    <span className="font-medium">{option.key}.</span>
                    <span
                      className="stem"
                      dangerouslySetInnerHTML={{ __html: option.text }}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          {question.type === "fill" && question.blanks ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {question.blanks.map((blank) => (
                <label key={blank.id} className="flex min-w-[10rem] flex-1 items-center gap-2">
                  {blank.label ? (
                    <span className="text-sm text-muted-foreground">{blank.label}</span>
                  ) : null}
                  {mode === "take" ? (
                    <Input
                      value={value?.[blank.id] ?? ""}
                      onChange={(event) => onChange?.(blank.id, event.target.value)}
                      className="h-9 bg-white"
                    />
                  ) : (
                    <span className="inline-flex min-h-9 min-w-28 flex-1 items-center border-b border-foreground/40 px-1">
                      {showKey ? blank.answer : ""}
                    </span>
                  )}
                </label>
              ))}
            </div>
          ) : null}

          {question.type === "work" ? (
            mode === "take" ? (
              <Textarea
                value={value?.[question.id] ?? ""}
                onChange={(event) => onChange?.(question.id, event.target.value)}
                className="min-h-32 bg-white font-serif"
                placeholder="在此写出步骤和答案"
              />
            ) : (
              <Lines count={question.lines ?? 6} />
            )
          ) : null}

          {showKey ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm leading-relaxed text-emerald-950">
              <p>
                <span className="font-medium">答案：</span>
                <span dangerouslySetInnerHTML={{ __html: question.answer }} />
              </p>
              <p className="mt-1">
                <span className="font-medium">说明：</span>
                <span dangerouslySetInnerHTML={{ __html: question.explanation }} />
              </p>
              {question.marking ? (
                <p className="mt-1">
                  <span className="font-medium">评分：</span>
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
  value,
  onChange,
}: {
  section: Section;
  mode: ExamMode;
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
              不计入学业分
            </Badge>
          ) : null}
        </h2>
        <p className="text-sm text-muted-foreground">{section.marks} 分</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{section.instruction}</p>
      <div className="divide-y divide-border/70">
        {section.questions.map((question) => (
          <QuestionBlock
            key={question.id}
            question={question}
            mode={mode}
            value={value}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}

export function ExamHeader({
  mode,
  name,
  onName,
}: {
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
}) {
  return (
    <header className="border-b-2 border-foreground pb-5">
      <p className="text-center text-sm tracking-[0.35em] text-muted-foreground">
        七年级摸底 · 2026 年 9 月
      </p>
      <h1 className="mt-2 text-center font-serif text-3xl font-semibold tracking-wide">
        {mathPaper.title}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        满分 {mathPaper.totalMarks} 分 · 时间 {mathPaper.durationMin} 分钟 · 附加题 {mathPaper.extraMarks} 分另计
      </p>
      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="shrink-0">姓名</span>
          {mode === "take" ? (
            <Input
              value={name ?? ""}
              onChange={(event) => onName?.(event.target.value)}
              className="h-8 bg-white"
            />
          ) : (
            <span className="flex-1 border-b border-foreground/40">&nbsp;</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0">学校</span>
          <span className="flex-1 border-b border-foreground/40 text-muted-foreground">
            培侨
          </span>
        </div>
        <label className="flex items-center gap-2">
          <span className="shrink-0">得分</span>
          <span className="flex-1 border-b border-foreground/40">
            {mode === "answers" ? "见各题" : ""}
          </span>
        </label>
      </div>
      {mode !== "answers" ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {mathPaper.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>需用：{mathPaper.materials}</li>
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          教师用卷。选择题、填空可对照直接给分；计算和解答按步骤给分。
        </p>
      )}
    </header>
  );
}

export function ExamPaper({
  mode,
  name,
  onName,
  answers,
  onAnswer,
}: {
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
  answers?: AnswersState;
  onAnswer?: (key: string, next: string) => void;
}) {
  return (
    <div className="exam-sheet mx-auto max-w-3xl bg-[#fbf7ef] px-5 py-8 text-foreground shadow-sm sm:px-10 print:max-w-none print:bg-white print:px-0 print:py-0 print:shadow-none">
      <ExamHeader mode={mode} name={name} onName={onName} />
      {mathPaper.sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          mode={mode}
          value={answers}
          onChange={onAnswer}
        />
      ))}
      {mode === "answers" ? (
        <section className="mt-10 break-inside-avoid border-t border-foreground/20 pt-6">
          <h2 className="font-serif text-xl font-semibold">分数段怎么看</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {mathPaper.scoreBands.map((band) => (
              <li key={band.range}>
                <span className="font-medium">{band.range}：</span>
                {band.note}
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-serif text-xl font-semibold">批改时盯这些</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {mathPaper.tutorTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-10 text-center text-xs text-muted-foreground">
        —— 全卷完 ——
      </p>
    </div>
  );
}
