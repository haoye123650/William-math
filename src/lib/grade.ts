import type { AnswersState, Question } from "@/lib/papers/types";

export function normalizeAnswer(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[−–—﹣]/g, "-")
    .replace(/[／∕]/g, "/")
    .replace(/[×xX]/g, "*")
    .replace(/°/g, "")
    .replace(/cm/gi, "")
    .replace(/\$/g, "")
    .toLowerCase();
}

export function matchesAnswer(value: string, accepted: string[]) {
  const got = normalizeAnswer(value);
  if (!got) return false;
  return accepted.some((item) => normalizeAnswer(item) === got);
}

export type QuestionStatus = "correct" | "incorrect" | "partial" | "pending";

export function gradeQuestion(question: Question, answers: AnswersState) {
  if (question.type === "work") {
    return { status: "pending" as const, blankResults: {} as Record<string, boolean> };
  }

  if (question.type === "choice") {
    const ok = answers[question.id] === question.answer;
    return {
      status: (ok ? "correct" : "incorrect") as QuestionStatus,
      blankResults: {} as Record<string, boolean>,
    };
  }

  const blanks = question.blanks ?? [];
  const blankResults: Record<string, boolean> = {};
  let correctCount = 0;
  for (const blank of blanks) {
    const ok = matchesAnswer(answers[blank.id] ?? "", blank.accepted ?? [blank.answer]);
    blankResults[blank.id] = ok;
    if (ok) correctCount += 1;
  }

  let status: QuestionStatus = "incorrect";
  if (blanks.length > 0 && correctCount === blanks.length) status = "correct";
  else if (correctCount > 0) status = "partial";

  return { status, blankResults };
}
