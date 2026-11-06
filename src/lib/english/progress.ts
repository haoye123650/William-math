"use client";

import { useSyncExternalStore } from "react";

export type LessonProgress = {
  blocksDone: string[];
  answers: Record<string, string | string[]>;
  lastBlock?: string;
};

type Store = Record<string, LessonProgress>;

const STORAGE_KEY = "re3:progress";
const EVENT = "re3-progress";

const empty: LessonProgress = { blocksDone: [], answers: {} };

let cachedRaw: string | null = null;
let cachedStore: Store = {};

function read(): Store {
  if (typeof window === "undefined") return cachedStore;
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedStore = raw ? (JSON.parse(raw) as Store) : {};
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

function subscribe(onChange: () => void) {
  const handler = () => onChange();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function lessonOf(store: Store, key: string): LessonProgress {
  return store[key] ?? empty;
}

export function useLessonProgress(key: string): LessonProgress {
  return useSyncExternalStore(
    subscribe,
    () => lessonOf(read(), key),
    () => empty,
  );
}

export function useCourseProgress(): Store {
  return useSyncExternalStore(subscribe, () => read(), () => cachedStore);
}

export function saveLesson(key: string, patch: Partial<LessonProgress>) {
  const current = read();
  const prev = current[key] ?? { blocksDone: [], answers: {} };
  write({
    ...current,
    [key]: {
      blocksDone: patch.blocksDone ?? prev.blocksDone,
      answers: patch.answers ?? prev.answers,
      lastBlock: patch.lastBlock ?? prev.lastBlock,
    },
  });
}

export function doneCount(store: Store, unit: number, lessonId: string) {
  const progress = store[`${unit}-${lessonId}`];
  return progress?.blocksDone.length ?? 0;
}
