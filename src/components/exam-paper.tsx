"use client";

import { Check, Minus, X } from "lucide-react";
import { TriangleDiagram } from "@/components/diagrams";
import { figureStatus } from "@/lib/figures";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { answerFieldProps } from "@/lib/answer-field";
import { gradeQuestion, type QuestionStatus } from "@/lib/grade";
import {
  curriculumTag,
  figuresFor,
  hasTeacherMarkedWork,
  type AnswersState,
  type CurriculumTag,
  type Paper,
  type PaperAsset,
  type Question,
  type Section,
} from "@/lib/papers/types";

export type ExamMode = "take" | "print" | "answers";

function stemHtml(html: string) {
  return html.replace(/<(?!\/?(?:sup|br|span)\b)/gi, "&lt;");
}

function Stem({ html }: { html: string }) {
  return (
    <div
      className="stem"
      dangerouslySetInnerHTML={{ __html: stemHtml(html) }}
    />
  );
}

function Lines({ count }: { count: number }) {
  return (
    <div className="mt-4 space-y-6 print:space-y-7" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-0 border-b border-dashed border-foreground/35" />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: QuestionStatus }) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-800 px-2 py-0.5 text-xs font-medium text-white">
        <Check className="size-3.5" />
        Correct
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-800 px-2 py-0.5 text-xs font-medium text-white">
        <Minus className="size-3.5" />
        Partial
      </span>
    );
  }
  if (status === "incorrect") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-800 px-2 py-0.5 text-xs font-medium text-white">
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

function publicSrc(src: string) {
  if (/^https?:\/\//.test(src)) return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (base && (path === base || path.startsWith(`${base}/`))) return path;
  return `${base}${path}`;
}

function QuestionFigure({ question, hasAsset }: { question: Question; hasAsset: boolean }) {
  const status = figureStatus(question);
  if (status === "none" || (status === "missing" && hasAsset)) return null;
  if (status === "triangle") {
    return (
      <div className="rounded-lg border border-border bg-white/60 p-3">
        <TriangleDiagram />
      </div>
    );
  }
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-500 bg-red-50 px-3 py-3 text-sm font-medium text-red-900"
    >
      Missing figure{question.diagram ? ` (${question.diagram})` : ""}. This question
      cannot be answered until its diagram is on the page.
    </div>
  );
}

function FigureSlot({
  assets,
  placement,
}: {
  assets: PaperAsset[];
  placement: Question["imagePlacement"];
}) {
  if (assets.length === 0 || (placement !== "above" && placement !== "beside")) return null;
  return (
    <div className={cn("space-y-2", placement === "beside" && "sm:w-52 sm:shrink-0")}>
      {assets.map((asset) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={asset.id}
          src={publicSrc(asset.src)}
          alt={asset.alt || "Figure"}
          className="h-auto max-w-full rounded-lg border border-border bg-white"
        />
      ))}
    </div>
  );
}

function QuestionBlock({
  scope,
  question,
  assets,
  mode,
  reviewed,
  value,
  onChange,
  levelTag,
  lockedKeys,
}: {
  scope: string;
  question: Question;
  assets?: PaperAsset[];
  mode: ExamMode;
  reviewed?: boolean;
  value?: AnswersState;
  onChange?: (key: string, next: string) => void;
  levelTag?: CurriculumTag | null;
  lockedKeys?: string[];
}) {
  const showKey = mode === "answers";
  const answers = value ?? {};
  const result = reviewed ? gradeQuestion(question, answers) : null;
  const status = result?.status;
  const locked = new Set(lockedKeys ?? []);
  const choiceLocked = locked.has(question.id);
  const interactive = mode === "take" && !reviewed;
  const figures = figuresFor(question, assets);
  const placement = question.imagePlacement;
  const figureSlot = <FigureSlot assets={figures} placement={placement} />;

  return (
    <article
      id={`q-${question.id}`}
      className={cn(
        "scroll-mt-56 break-inside-avoid border-b border-border py-5 last:border-b-0 print:rounded-none",
        reviewed && status === "correct" && "border-l-[3px] border-l-emerald-800 bg-emerald-50/80 pr-3 pl-3 print:bg-emerald-50",
        reviewed && status === "incorrect" && "border-l-[3px] border-l-red-800 bg-red-50/80 pr-3 pl-3 print:bg-red-50",
        reviewed && status === "partial" && "border-l-[3px] border-l-amber-800 bg-amber-50/80 pr-3 pl-3 print:bg-amber-50"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "shrink-0 pt-0.5 text-right font-serif text-lg font-semibold tabular-nums",
            question.no.length > 3 ? "w-16" : question.no.length > 2 ? "w-12" : "w-8"
          )}
        >
          {question.no}.
        </span>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              {placement === "above" ? figureSlot : null}
              <div
                className={cn(
                  placement === "beside" && figures.length > 0 && "sm:flex sm:items-start sm:gap-4"
                )}
              >
                {placement === "beside" ? figureSlot : null}
                <div className="min-w-0 flex-1">
                  <Stem html={question.stem} />
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {question.levelTag ?? levelTag ? (
                <Badge variant="secondary">[{question.levelTag ?? levelTag}]</Badge>
              ) : null}
              {reviewed && (status === "incorrect" || status === "partial") ? (
                <a
                  href="#review"
                  className="print:hidden text-xs font-medium underline underline-offset-2"
                >
                  Back to review
                </a>
              ) : null}
              {reviewed && status ? <StatusBadge status={status} /> : null}
              <span className="text-sm text-muted-foreground tabular-nums">
                ({question.marks} {question.marks === 1 ? "mark" : "marks"})
              </span>
            </div>
          </div>

          <QuestionFigure question={question} hasAsset={figures.length > 0} />

          {question.type === "choice" && question.options ? (
            <div className="grid gap-2 sm:grid-cols-2" role={interactive ? "group" : undefined} aria-label={interactive ? `Question ${question.no} choices` : undefined}>
              {question.options.map((option) => {
                const selected = answers[question.id] === option.key;
                const isAnswer = option.key === question.answer;
                const showAnswer = showKey || Boolean(reviewed);
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={!interactive || choiceLocked}
                    aria-pressed={interactive ? selected : undefined}
                    onClick={() => {
                      if (!interactive || choiceLocked) return;
                      onChange?.(question.id, option.key);
                    }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition disabled:opacity-100",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                      mode === "print"
                        ? "cursor-default border border-transparent px-1 py-1.5"
                        : "border border-border bg-white/80",
                      interactive && "min-h-11 hover:border-primary/50 hover:bg-accent",
                      selected && !reviewed && mode !== "print" && "border-primary bg-primary/10",
                      reviewed && selected && isAnswer && "border-emerald-800 bg-emerald-100 text-emerald-950",
                      reviewed && selected && !isAnswer && "border-red-800 bg-red-100 text-red-950",
                      reviewed && !selected && isAnswer && "border-emerald-800 bg-emerald-50 text-emerald-950",
                      showAnswer && isAnswer && !reviewed && "border-emerald-800 bg-emerald-50"
                    )}
                  >
                    <span className="font-semibold">{option.key}.</span>
                    <span
                      className="stem flex-1"
                      dangerouslySetInnerHTML={{
                        __html: stemHtml(option.text),
                      }}
                    />
                    {reviewed && selected && isAnswer ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-800" />
                    ) : null}
                    {reviewed && selected && !isAnswer ? (
                      <X className="mt-0.5 size-4 shrink-0 text-red-800" />
                    ) : null}
                    {reviewed && !selected && isAnswer ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-800" />
                    ) : null}
                    {choiceLocked && selected && !reviewed ? (
                      <span className="text-xs font-medium text-muted-foreground">Kept</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {question.type === "fill" && question.blanks ? (
            <div className="flex flex-col gap-3">
              {question.blanks.map((blank, index) => {
                const blankOk = result?.blankResults[blank.id];
                const blankLocked = locked.has(blank.id);
                const blankName = blank.label
                  ? undefined
                  : `Question ${question.no}${
                      question.blanks && question.blanks.length > 1 ? `, blank ${index + 1}` : ""
                    }`;
                return (
                  <label
                    key={blank.id}
                    id={`blank-${blank.id}`}
                    className="scroll-mt-28 flex min-w-[10rem] flex-wrap items-center gap-2"
                  >
                    {blank.label ? (
                      <span className="text-sm text-muted-foreground">
                        {blank.label}
                      </span>
                    ) : null}
                    {mode === "take" ? (
                      <Input
                        {...answerFieldProps(scope, blank.id, reviewed || blankLocked)}
                        value={answers[blank.id] ?? ""}
                        onChange={(event) => {
                          if (blankLocked || reviewed) return;
                          onChange?.(blank.id, event.target.value);
                        }}
                        aria-label={blankName}
                        className={cn(
                          "h-10 max-w-xs bg-white",
                          reviewed && blankOk && "border-emerald-800 bg-emerald-50 text-emerald-950",
                          reviewed && !blankOk && "border-red-800 bg-red-50 text-red-950"
                        )}
                      />
                    ) : (
                      <span className="inline-flex min-h-9 min-w-28 flex-1 items-end border-b border-foreground/50 px-1 pb-0.5">
                        {showKey ? blank.answer : ""}
                      </span>
                    )}
                    {reviewed && blankOk ? (
                      <Check className="size-4 text-emerald-800" />
                    ) : null}
                    {reviewed && !blankOk ? (
                      <span className="text-sm text-red-800">
                        <X className="mr-1 inline size-4 align-text-bottom" />
                        Answer: {blank.answer}
                      </span>
                    ) : null}
                    {blankLocked && !reviewed ? (
                      <span className="text-xs font-medium text-muted-foreground">Kept</span>
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
                  {...answerFieldProps(scope, question.id, reviewed || locked.has(question.id))}
                  value={answers[question.id] ?? ""}
                  onChange={(event) => {
                    if (locked.has(question.id) || reviewed) return;
                    onChange?.(question.id, event.target.value);
                  }}
                  className="work-pad min-h-40 bg-white pt-0 font-serif"
                  placeholder="Write your working and answer here"
                  aria-label={`Question ${question.no} working`}
                />
                {locked.has(question.id) && !reviewed ? (
                  <p className="text-xs font-medium text-muted-foreground">Kept</p>
                ) : null}
                {reviewed ? (
                  <p className="text-sm text-muted-foreground">
                    This question is marked by the teacher.
                  </p>
                ) : null}
              </div>
            ) : (
              <Lines count={question.lines ?? 6} />
            )
          ) : null}

          {reviewed && !showKey ? (
            <div className="rounded-md border border-border bg-white/80 px-3 py-2 text-sm leading-relaxed">
              <p>
                <span className="font-medium">Notes: </span>
                <span dangerouslySetInnerHTML={{ __html: question.explanation }} />
              </p>
            </div>
          ) : null}

          {showKey ? (
            <div className="mark-note rounded-r-md border border-emerald-200 border-l-[3px] border-l-emerald-800 bg-emerald-50/90 px-3 py-2.5 text-sm leading-relaxed text-emerald-950">
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
  scope,
  section,
  assets,
  mode,
  reviewed,
  value,
  onChange,
  levelTag,
  lockedKeys,
}: {
  scope: string;
  section: Section;
  assets?: PaperAsset[];
  mode: ExamMode;
  reviewed?: boolean;
  value?: AnswersState;
  onChange?: (key: string, next: string) => void;
  levelTag?: CurriculumTag | null;
  lockedKeys?: string[];
}) {
  return (
    <section id={`section-${section.id}`} className="mt-10 scroll-mt-56">
      <div className="section-bar flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-y-2 border-foreground px-0.5 py-2">
        <h2 className="font-serif text-xl font-semibold tracking-tight">
          {section.title}
          {section.extra ? (
            <Badge variant="outline" className="ml-2 align-middle">
              Not in the 100 marks
            </Badge>
          ) : null}
        </h2>
        <p className="text-sm font-medium tabular-nums">{section.marks} marks</p>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{section.instruction}</p>
      <div>
        {section.questions.map((question) => (
          <QuestionBlock
            key={`${scope}-${question.id}`}
            scope={scope}
            question={question}
            assets={assets}
            mode={mode}
            reviewed={reviewed}
            value={value}
            onChange={onChange}
            levelTag={levelTag}
            lockedKeys={lockedKeys}
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
  scoreLabel,
}: {
  paper: Paper;
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
  reviewed?: boolean;
  scoreLabel?: string;
}) {
  return (
    <header className="border-b border-foreground/15 pb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          Pui Kiu Mathematics
        </p>
        <p className="text-xs text-muted-foreground">September 2026</p>
      </div>
      <h1 className="mt-3 text-center font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        {paper.title}
      </h1>
      <dl className="mx-auto mt-4 grid max-w-lg grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border px-2 py-2">
          <dt className="text-xs text-muted-foreground">Marks</dt>
          <dd className="font-serif text-lg font-semibold tabular-nums">{paper.totalMarks}</dd>
        </div>
        <div className="rounded-lg border border-border px-2 py-2">
          <dt className="text-xs text-muted-foreground">Minutes</dt>
          <dd className="font-serif text-lg font-semibold tabular-nums">{paper.durationMin}</dd>
        </div>
        <div className="rounded-lg border border-border px-2 py-2">
          <dt className="text-xs text-muted-foreground">
            {paper.extraMarks > 0 ? "Section E" : "Level"}
          </dt>
          <dd className="font-serif text-lg font-semibold tabular-nums">
            {paper.extraMarks > 0 ? `+${paper.extraMarks}` : paper.level}
          </dd>
        </div>
      </dl>
      <div className="mt-5 grid gap-4 border border-border px-3 py-3 text-sm sm:grid-cols-3">
        <label className="flex items-center gap-2">
          <span className="shrink-0 font-medium">Name</span>
          {mode === "take" ? (
            <Input
              value={name ?? ""}
              readOnly={reviewed}
              onChange={(event) => onName?.(event.target.value)}
              className="h-9 bg-white"
              autoComplete="name"
            />
          ) : (
            <span className="flex-1 border-b border-foreground/50">&nbsp;</span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-medium">School</span>
          <span className="flex-1 border-b border-foreground/50 text-muted-foreground">
            Pui Kiu
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 font-medium">Score</span>
          <span className="flex-1 border-b border-foreground/50">
            {scoreLabel ?? (mode === "answers" ? "See each question" : "")}
          </span>
        </div>
      </div>
      {mode !== "answers" ? (
        <div className="instruction-box mt-4 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase">Instructions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            {paper.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
            <li>Materials: {paper.materials}</li>
          </ul>
        </div>
      ) : (
        <p className="instruction-box mt-4 rounded-lg border border-border bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">
          {hasTeacherMarkedWork(paper)
            ? "Teacher copy. Mark Sections A and B against the key. Award method marks in Sections C and D."
            : "Teacher copy. Mark every item against the key."}
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
  lockedKeys,
  scoreLabel,
}: {
  paper: Paper;
  mode: ExamMode;
  name?: string;
  onName?: (value: string) => void;
  answers?: AnswersState;
  onAnswer?: (key: string, next: string) => void;
  reviewed?: boolean;
  lockedKeys?: string[];
  scoreLabel?: string;
}) {
  const levelTag = curriculumTag(paper.level);
  return (
    <div className="exam-sheet mx-auto max-w-3xl bg-sheet px-4 py-8 text-foreground sm:px-10 sm:py-10 print:max-w-none print:bg-white print:px-0 print:py-0 print:shadow-none">
      <ExamHeader
        paper={paper}
        mode={mode}
        name={name}
        onName={onName}
        reviewed={reviewed}
        scoreLabel={scoreLabel}
      />
      <form
        autoComplete="off"
        onSubmit={(event) => event.preventDefault()}
      >
      {paper.sections.map((section) => (
        <SectionBlock
          key={`${paper.id}-${section.id}`}
          scope={paper.id}
          section={section}
          assets={paper.assets}
          mode={mode}
          reviewed={reviewed}
          value={answers}
          onChange={onAnswer}
          levelTag={levelTag}
          lockedKeys={lockedKeys}
        />
      ))}
      </form>
      {mode === "answers" ? (
        <section className="mt-10 break-inside-avoid border-t border-foreground/20 pt-6">
          <h2 className="font-serif text-xl font-semibold">How to read the score</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {paper.scoreBands.map((band) => (
              <li
                key={band.range}
                className="grid gap-1 py-2.5 text-sm leading-relaxed sm:grid-cols-[8.5rem_1fr] sm:gap-4"
              >
                <span className="font-serif font-semibold">{band.range}</span>
                <span>{band.note}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-serif text-xl font-semibold">When marking, watch</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {paper.tutorTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-12 text-center text-xs tracking-wide text-muted-foreground">
        — End of paper —
      </p>
    </div>
  );
}
