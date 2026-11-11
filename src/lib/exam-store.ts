import type { AnswersState } from "@/lib/papers/types";

const EVENT = "pk-exam-change";

export type StoredItemResult = {
  key: string;
  label: string;
  ok: boolean;
};

/** Last submitted sitting. Kept on the same paper record so retry does not erase it. */
export type ExamCompletion = {
  completedAt?: number;
  objectiveGot: number;
  objectiveTotal: number;
  teacherMarked: boolean;
  items: StoredItemResult[];
};

export type SavedExam = {
  name: string;
  answers: AnswersState;
  startedAt: number;
  submitted?: boolean;
  lockedKeys?: string[];
  completion?: ExamCompletion;
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
    completion: data.completion
      ? {
          completedAt: data.completion.completedAt,
          objectiveGot: data.completion.objectiveGot,
          objectiveTotal: data.completion.objectiveTotal,
          teacherMarked: data.completion.teacherMarked,
          items: data.completion.items.map((item) => ({ ...item })),
        }
      : undefined,
  };
}

function normalize(parsed: SavedExam): SavedExam {
  if (!parsed.startedAt) parsed.startedAt = Date.now();
  if (!parsed.answers) parsed.answers = {};
  if (!Array.isArray(parsed.lockedKeys)) parsed.lockedKeys = [];
  const completion = parsed.completion;
  if (completion && !Array.isArray(completion.items)) delete parsed.completion;
  return parsed;
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
    return normalize(JSON.parse(raw) as SavedExam);
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

export type ExamStatus = "not-started" | "in-progress" | "submitted";

/** Read progress for the course index. Does not create or start a sitting. */
const peekCache = new Map<string, { raw: string; value: SavedExam | null }>();

/** Read one paper without creating a sitting. Cached while its storage text is unchanged. */
export function peekExam(paperId: string): SavedExam | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(paperId)) ?? "";
  const hit = peekCache.get(paperId);
  if (hit && hit.raw === raw) return hit.value;
  let value: SavedExam | null = null;
  if (raw) {
    try {
      value = normalize(JSON.parse(raw) as SavedExam);
    } catch {
      value = null;
    }
  }
  peekCache.set(paperId, { raw, value });
  return value;
}

export function peekExamStatus(paperId: string): ExamStatus {
  const parsed = peekExam(paperId);
  if (!parsed) return "not-started";
  if (parsed.submitted) return "submitted";
  return "in-progress";
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
