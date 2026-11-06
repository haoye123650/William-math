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

export type IncorrectPart = {
  key: string;
  questionId: string;
  anchorId: string;
  no: string;
  skill: string;
  part: string;
  yours: string;
  answer: string;
};

function shownAnswer(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "No answer";
}

export function incorrectParts(question: Question, answers: AnswersState): IncorrectPart[] {
  if (question.type === "work") return [];

  if (question.type === "choice") {
    if (answers[question.id] === question.answer) return [];
    return [
      {
        key: question.id,
        questionId: question.id,
        anchorId: `q-${question.id}`,
        no: question.no,
        skill: question.skill,
        part: "Choice",
        yours: shownAnswer(answers[question.id] ?? ""),
        answer: question.answer,
      },
    ];
  }

  const parts: IncorrectPart[] = [];
  for (const blank of question.blanks ?? []) {
    const yours = answers[blank.id] ?? "";
    if (matchesAnswer(yours, blank.accepted ?? [blank.answer])) continue;
    parts.push({
      key: blank.id,
      questionId: question.id,
      anchorId: `blank-${blank.id}`,
      no: question.no,
      skill: question.skill,
      part: blank.label ?? "Answer",
      yours: shownAnswer(yours),
      answer: blank.answer,
    });
  }
  return parts;
}

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
