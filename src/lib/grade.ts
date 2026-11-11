import { allQuestions, type AnswersState, type Paper, type Question } from "@/lib/papers/types";

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

export type ObjectiveItem = {
  key: string;
  no: string;
  skill: string;
  part: string;
  marks: number;
  got: number;
  ok: boolean;
};

/** Objective marks already used on the paper. Worked questions are omitted. */
export function objectiveReport(paper: Paper, answers: AnswersState) {
  const items: ObjectiveItem[] = [];

  for (const question of allQuestions(paper)) {
    if (question.type === "work") continue;
    if (question.type === "choice") {
      const ok = answers[question.id] === question.answer;
      items.push({
        key: question.id,
        no: question.no,
        skill: question.skill,
        part: "Choice",
        marks: question.marks,
        got: ok ? question.marks : 0,
        ok,
      });
    }
    if (question.type === "fill" && question.blanks) {
      const per = question.marks / question.blanks.length;
      for (const blank of question.blanks) {
        const ok = matchesAnswer(answers[blank.id] ?? "", blank.accepted ?? [blank.answer]);
        items.push({
          key: blank.id,
          no: question.no,
          skill: question.skill,
          part: blank.label ?? "Answer",
          marks: per,
          got: ok ? per : 0,
          ok,
        });
      }
    }
  }

  const got = items.reduce((sum, item) => sum + item.got, 0);
  const total = items.reduce((sum, item) => sum + item.marks, 0);
  const bySkill: Record<string, { got: number; total: number }> = {};
  for (const item of items) {
    bySkill[item.skill] ??= { got: 0, total: 0 };
    bySkill[item.skill].got += item.got;
    bySkill[item.skill].total += item.marks;
  }
  return { items, got, total, bySkill };
}

export function itemResultLabel(no: string, part: string) {
  const head = /^\d/.test(no) ? `Q${no}` : no;
  return part ? `${head} ${part}` : head;
}
