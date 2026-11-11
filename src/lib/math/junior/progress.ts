"use client";

export type TopicItemResult = {
  key: string;
  label: string;
  ok: boolean;
};

export type TopicCompletion = {
  completedAt: number;
  items: TopicItemResult[];
};

export type TopicProgress = {
  answers: Record<string, string>;
  checked: string[];
  updatedAt: number;
  total: number;
  items: TopicItemResult[];
  completion?: TopicCompletion;
};

export type TopicDraft = {
  answers: Record<string, string>;
  checked: string[];
  total: number;
  items: TopicItemResult[];
};

const STORAGE_KEY = "pk-math-topics-v1";
const EVENT = "pk-topic-change";

export const emptyTopic: TopicProgress = {
  answers: {},
  checked: [],
  updatedAt: 0,
  total: 0,
  items: [],
};

type Store = Record<string, TopicProgress>;

let cachedRaw: string | null = null;
let cachedStore: Store = {};

function normalize(value: TopicProgress): TopicProgress {
  return {
    answers: value.answers ?? {},
    checked: Array.isArray(value.checked) ? value.checked : [],
    updatedAt: value.updatedAt || 0,
    total: value.total || 0,
    items: Array.isArray(value.items) ? value.items : [],
    completion:
      value.completion && Array.isArray(value.completion.items)
        ? {
            completedAt: value.completion.completedAt,
            items: value.completion.items.map((item) => ({ ...item })),
          }
        : undefined,
  };
}

function read(): Store {
  if (typeof window === "undefined") return cachedStore;
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as Store) : {};
      const next: Store = {};
      for (const [key, value] of Object.entries(parsed)) next[key] = normalize(value);
      cachedStore = next;
    } catch {
      cachedStore = {};
    }
  }
  return cachedStore;
}

function write(next: Store) {
  const raw = JSON.stringify(next);
  cachedRaw = raw;
  cachedStore = next;
  localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(EVENT));
}

export function lessonStorageKey(lesson: { level: string; slug: string }) {
  const year = lesson.level.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${year}/${lesson.slug}`;
}

export function lessonFieldScope(lesson: { level: string; slug: string }) {
  return lessonStorageKey(lesson).replace(/\//g, "-");
}

export function subscribeTopics(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getTopicSnapshot(key: string): TopicProgress {
  return read()[key] ?? emptyTopic;
}

export function getServerTopicSnapshot(): TopicProgress {
  return emptyTopic;
}

export function peekTopic(key: string): TopicProgress | null {
  const found = read()[key];
  if (!found || found.updatedAt === 0) return null;
  return found;
}

export function saveTopic(key: string, draft: TopicDraft) {
  const current = read();
  const prev = current[key];
  const fullyChecked = draft.total > 0 && draft.items.length === draft.total;
  const completion: TopicCompletion | undefined = fullyChecked
    ? {
        completedAt: Date.now(),
        items: draft.items.map((item) => ({ ...item })),
      }
    : prev?.completion
      ? {
          completedAt: prev.completion.completedAt,
          items: prev.completion.items.map((item) => ({ ...item })),
        }
      : undefined;
  write({
    ...current,
    [key]: {
      answers: { ...draft.answers },
      checked: [...draft.checked],
      updatedAt: Date.now(),
      total: draft.total,
      items: draft.items.map((item) => ({ ...item })),
      completion,
    },
  });
}
