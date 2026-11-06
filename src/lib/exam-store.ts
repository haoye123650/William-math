import type { AnswersState } from "@/lib/papers/types";

const EVENT = "pk-exam-change";

export type SavedExam = {
  name: string;
  answers: AnswersState;
  startedAt: number;
  submitted?: boolean;
  lockedKeys?: string[];
};

const emptyServer: SavedExam = {
  name: "",
  answers: {},
  startedAt: 0,
  lockedKeys: [],
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
    lockedKeys: [...(data.lockedKeys ?? [])],
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
        lockedKeys: [],
      };
      localStorage.setItem(storageKey(paperId), JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) as SavedExam;
    if (!parsed.startedAt) parsed.startedAt = Date.now();
    if (!parsed.answers) parsed.answers = {};
    if (!Array.isArray(parsed.lockedKeys)) parsed.lockedKeys = [];
    return parsed;
  } catch {
    return { name: "", answers: {}, startedAt: Date.now(), lockedKeys: [] };
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
    lockedKeys: [],
  });
}
