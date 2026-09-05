import type { AnswersState } from "@/lib/papers/types";

const STORAGE_KEY = "pk-s1-math-en-v1";
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

let cache: SavedExam = emptyServer;

function clone(data: SavedExam): SavedExam {
  return {
    name: data.name,
    answers: { ...data.answers },
    startedAt: data.startedAt,
    submitted: data.submitted,
  };
}

function readStorage(): SavedExam {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init: SavedExam = {
        name: "",
        answers: {},
        startedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
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

export function getExamSnapshot(): SavedExam {
  const next = readStorage();
  if (JSON.stringify(cache) === JSON.stringify(next)) {
    return cache;
  }
  cache = next;
  return cache;
}

export function getServerExamSnapshot(): SavedExam {
  return emptyServer;
}

export function patchExam(partial: Partial<SavedExam>) {
  const current = readStorage();
  const next: SavedExam = {
    ...current,
    ...partial,
    answers: partial.answers ?? current.answers,
  };
  cache = clone(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  window.dispatchEvent(new Event(EVENT));
}

export function resetExam(name: string) {
  patchExam({
    name,
    answers: {},
    startedAt: Date.now(),
    submitted: false,
  });
}
