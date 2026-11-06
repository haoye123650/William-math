import type { AnswersState } from "@/lib/papers/types";

const EVENT = "pk-exam-change";

export type SavedExam = {
  name: string;
  answers: AnswersState;
  startedAt: number;
  submitted?: boolean;
};

const emptyServer: SavedExam = {
  name: "",
  answers: {},
  startedAt: 0,
};

const caches: Record<string, SavedExam> = {};

function storageKey(paperId: string) {
  return `pk-math-${paperId}-v1`;
}

function clone(data: SavedExam): SavedExam {
  return {
    name: data.name,
    answers: { ...data.answers },
    startedAt: data.startedAt,
    submitted: data.submitted,
  };
}

function readStorage(paperId: string): SavedExam {
  try {
    const raw = localStorage.getItem(storageKey(paperId));
    if (!raw) {
      const init: SavedExam = {
        name: "",
        answers: {},
        startedAt: Date.now(),
      };
      localStorage.setItem(storageKey(paperId), JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) as SavedExam;
    if (!parsed.startedAt) parsed.startedAt = Date.now();
    if (!parsed.answers) parsed.answers = {};
    return parsed;
  } catch {
    return { name: "", answers: {}, startedAt: Date.now() };
  }
}

export function subscribeExam(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getExamSnapshot(paperId: string): SavedExam {
  const next = readStorage(paperId);
  const prev = caches[paperId];
  if (prev && JSON.stringify(prev) === JSON.stringify(next)) {
    return prev;
  }
  caches[paperId] = next;
  return caches[paperId];
}

export function getServerExamSnapshot(): SavedExam {
  return emptyServer;
}

export type ExamStatus = "not-started" | "in-progress" | "submitted";

/** Read progress for the course index. Does not create or start a sitting. */
export function peekExamStatus(paperId: string): ExamStatus {
  if (typeof window === "undefined") return "not-started";
  try {
    const raw = localStorage.getItem(storageKey(paperId));
    if (!raw) return "not-started";
    const parsed = JSON.parse(raw) as Partial<SavedExam>;
    if (parsed.submitted) return "submitted";
    return "in-progress";
  } catch {
    return "not-started";
  }
}

export function patchExam(paperId: string, partial: Partial<SavedExam>) {
  const current = readStorage(paperId);
  const next: SavedExam = {
    ...current,
    ...partial,
    answers: partial.answers ?? current.answers,
  };
  caches[paperId] = clone(next);
  localStorage.setItem(storageKey(paperId), JSON.stringify(caches[paperId]));
  window.dispatchEvent(new Event(EVENT));
}

export function resetExam(paperId: string, name: string) {
  patchExam(paperId, {
    name,
    answers: {},
    startedAt: Date.now(),
    submitted: false,
  });
}
