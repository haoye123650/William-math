import { matchesAnswer } from "@/lib/grade";
import type { JuniorItem, JuniorLesson, LevelTag } from "@/lib/math/junior/types";

export function formatLevel(level: string) {
  return level.replace(/S(?=\d)/g, "S.").replace("-", "–");
}

export function questionCount(lesson: JuniorLesson) {
  return lesson.blocks.reduce((sum, block) => sum + (block.items?.length ?? 0), 0);
}

const LEVEL_TAGS = new Set<LevelTag>(["S1", "S2", "S3"]);

export function shownLevelTag(item: JuniorItem): LevelTag | null {
  if (item.levelTag && LEVEL_TAGS.has(item.levelTag as LevelTag)) {
    return item.levelTag as LevelTag;
  }
  return null;
}

/** Drop a leading [S1]/[S2]/[S3] when that same tag is shown as a badge. */
export function displayPrompt(item: JuniorItem) {
  const tag = shownLevelTag(item);
  if (!tag) return item.prompt;
  const prefix = `[${tag}]`;
  if (item.prompt.startsWith(prefix)) {
    return item.prompt.slice(prefix.length).trimStart();
  }
  return item.prompt;
}

/**
 * Fill-in keys are the keyed `answer` plus any `acceptedAnswers` the item
 * already lists. Nothing else is added.
 */
export function keyedFillAnswers(item: JuniorItem): string[] {
  const canonical = item.answer == null ? "" : String(item.answer);
  const listed = Array.isArray(item.acceptedAnswers)
    ? item.acceptedAnswers.map((value) => String(value))
    : [];
  const extras = listed.filter((value) => value.length > 0 && value !== canonical);
  return canonical.length > 0 ? [canonical, ...extras] : extras;
}

export function gradeItem(item: JuniorItem, value: string | undefined): boolean | null {
  if (value == null || value.trim() === "") return null;

  if (item.interaction === "multiple-choice") {
    return value === String(item.answer ?? "");
  }

  if (item.interaction === "true-false") {
    if (item.answer === true) return value === "true";
    if (item.answer === false) return value === "false";
    return value === String(item.answer);
  }

  if (item.interaction === "fill-blank" || item.interaction === "short-text") {
    return matchesAnswer(value, keyedFillAnswers(item));
  }

  return null;
}

export function keyedAnswerLabel(item: JuniorItem) {
  if (item.interaction === "true-false") {
    if (item.answer === true) return "True";
    if (item.answer === false) return "False";
  }
  if (item.interaction === "multiple-choice") {
    const id = String(item.answer ?? "");
    const choice = item.choices?.find((entry) => entry.id === id);
    return choice ? `${id}. ${choice.text}` : id;
  }
  return item.answer == null ? "" : String(item.answer);
}
