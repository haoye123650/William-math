import { peekExam, subscribeExam, type ExamCompletion, type SavedExam } from "@/lib/exam-store";
import { peekTopic, subscribeTopics, type TopicProgress } from "@/lib/math/junior/progress";

export type ProgressKind = "paper" | "quiz" | "lesson";

export type ItemView = {
  key: string;
  label: string;
  ok: boolean;
};

export type ActivityView = {
  id: string;
  title: string;
  kind: ProgressKind;
  href: string;
  state: "in-progress" | "done";
  statusLine: string;
  note?: string;
  items: ItemView[];
  itemsLabel: string;
};

export type ProgressCatalog = {
  papers: { id: string; title: string; kind: "paper" | "quiz" }[];
  topics: { key: string; title: string; href: string }[];
};

export type ProgressModel = {
  papersSubmitted: number;
  papersInProgress: number;
  papersTotal: number;
  lessonsCompleted: number;
  lessonsInProgress: number;
  lessonsTotal: number;
  activities: ActivityView[];
};

export type ProgressSnapshot = ProgressModel & {
  v: 1;
  exportedAt: number;
};

export function formatWhen(timestamp: number | undefined) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function formatMarks(value: number) {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function joinParts(parts: Array<string | false | undefined>) {
  return parts.filter((part): part is string => Boolean(part)).join(" · ");
}

function tally(items: ItemView[]) {
  let correct = 0;
  let incorrect = 0;
  for (const item of items) {
    if (item.ok) correct += 1;
    else incorrect += 1;
  }
  return { correct, incorrect };
}

function scoreText(completion: ExamCompletion) {
  const { correct, incorrect } = tally(completion.items);
  const marks =
    completion.objectiveTotal > 0
      ? `${formatMarks(completion.objectiveGot)}/${formatMarks(completion.objectiveTotal)} objective`
      : "";
  const counts = completion.items.length > 0 ? `${correct} correct, ${incorrect} incorrect` : "";
  return joinParts([marks, counts]);
}

const TEACHER_NOTE = "Written questions are marked by the teacher and are not in this score.";

export function describeExam(
  meta: { id: string; title: string; kind: "paper" | "quiz" },
  record: SavedExam | null,
): ActivityView | null {
  if (!record) return null;
  const completion = record.completion;
  const score = completion ? scoreText(completion) : "";
  const note = completion?.teacherMarked ? TEACHER_NOTE : undefined;
  const href = `/paper/${meta.id}`;

  if (record.submitted && completion) {
    const when = completion.completedAt ? `Submitted ${formatWhen(completion.completedAt)}` : "Submitted";
    return {
      id: meta.id,
      title: meta.title,
      kind: meta.kind,
      href,
      state: "done",
      statusLine: joinParts([when, score]),
      note,
      items: completion.items,
      itemsLabel: "Item results",
    };
  }

  if (record.submitted) {
    return {
      id: meta.id,
      title: meta.title,
      kind: meta.kind,
      href,
      state: "done",
      statusLine: "Submitted. Open this paper on this browser to record the score.",
      items: [],
      itemsLabel: "",
    };
  }

  const started = record.startedAt ? `started ${formatWhen(record.startedAt)}` : "";
  if (completion) {
    const when = completion.completedAt ? `last submitted ${formatWhen(completion.completedAt)}` : "last submitted";
    return {
      id: meta.id,
      title: meta.title,
      kind: meta.kind,
      href,
      state: "in-progress",
      statusLine: joinParts(["In progress", started, when, score]),
      note,
      items: completion.items,
      itemsLabel: "Last submitted item results",
    };
  }

  return {
    id: meta.id,
    title: meta.title,
    kind: meta.kind,
    href,
    state: "in-progress",
    statusLine: joinParts(["In progress", started]),
    items: [],
    itemsLabel: "",
  };
}

export function describeTopic(
  meta: { key: string; title: string; href: string },
  record: TopicProgress | null,
): ActivityView | null {
  if (!record) return null;
  const started =
    record.items.length > 0 ||
    record.checked.length > 0 ||
    Object.keys(record.answers).length > 0 ||
    record.completion;
  if (!started) return null;

  const { correct, incorrect } = tally(record.items);
  const unchecked = Math.max(record.total - record.items.length, 0);
  const fully = record.total > 0 && record.items.length === record.total && record.completion;
  const counts =
    record.items.length > 0 ? `${correct} correct, ${incorrect} incorrect` : "";

  if (fully && record.completion) {
    return {
      id: meta.key,
      title: meta.title,
      kind: "lesson",
      href: meta.href,
      state: "done",
      statusLine: joinParts([
        `Completed ${formatWhen(record.completion.completedAt)}`,
        counts,
      ]),
      items: record.completion.items,
      itemsLabel: "Item results",
    };
  }

  return {
    id: meta.key,
    title: meta.title,
    kind: "lesson",
    href: meta.href,
    state: "in-progress",
    statusLine: joinParts([
      "In progress",
      counts,
      unchecked > 0 ? `${unchecked} not checked` : "",
      record.completion
        ? `last completed ${formatWhen(record.completion.completedAt)}`
        : record.updatedAt
          ? `last checked ${formatWhen(record.updatedAt)}`
          : "",
    ]),
    items: record.items,
    itemsLabel: "Checked items",
  };
}

export function buildProgress(catalog: ProgressCatalog): ProgressModel {
  const paperViews = catalog.papers.map((paper) =>
    describeExam(paper, peekExam(paper.id)),
  );
  const topicViews = catalog.topics.map((topic) => describeTopic(topic, peekTopic(topic.key)));
  const papersSubmitted = paperViews.filter((view) => view?.state === "done").length;
  const papersInProgress = paperViews.filter((view) => view?.state === "in-progress").length;
  const lessonsCompleted = topicViews.filter((view) => view?.state === "done").length;
  const lessonsInProgress = topicViews.filter((view) => view?.state === "in-progress").length;
  return {
    papersSubmitted,
    papersInProgress,
    papersTotal: catalog.papers.length,
    lessonsCompleted,
    lessonsInProgress,
    lessonsTotal: catalog.topics.length,
    activities: [...paperViews, ...topicViews].filter((view): view is ActivityView => view !== null),
  };
}

let modelCache: { key: string; value: string } | null = null;

function storageBlob(catalog: ProgressCatalog) {
  const papers = catalog.papers.map((paper) => localStorage.getItem(`pk-math-${paper.id}-v1`) ?? "");
  const topics = localStorage.getItem("pk-math-topics-v1") ?? "";
  return `${papers.join("\n§\n")}\n§topics\n${topics}`;
}

/** Stable string for useSyncExternalStore. Empty on the server. */
export function progressModelKey(catalog: ProgressCatalog) {
  if (typeof window === "undefined") return "";
  const key = `${storageBlob(catalog)}\n${catalog.papers.map((paper) => paper.id).join(",")}\n${catalog.topics.map((topic) => topic.key).join(",")}`;
  if (modelCache?.key === key) return modelCache.value;
  const value = JSON.stringify(buildProgress(catalog));
  modelCache = { key, value };
  return value;
}

export function subscribeProgress(onChange: () => void) {
  const stopExam = subscribeExam(onChange);
  const stopTopic = subscribeTopics(onChange);
  return () => {
    stopExam();
    stopTopic();
  };
}

export function encodeSnapshot(model: ProgressModel, exportedAt = Date.now()) {
  const snapshot: ProgressSnapshot = { v: 1, exportedAt, ...model };
  return `v1.${encodeURIComponent(JSON.stringify(snapshot))}`;
}

function isItem(value: unknown): value is ItemView {
  if (!value || typeof value !== "object") return false;
  const item = value as ItemView;
  return typeof item.key === "string" && typeof item.label === "string" && typeof item.ok === "boolean";
}

function isActivity(value: unknown): value is ActivityView {
  if (!value || typeof value !== "object") return false;
  const activity = value as ActivityView;
  return (
    typeof activity.id === "string" &&
    typeof activity.title === "string" &&
    (activity.state === "done" || activity.state === "in-progress") &&
    typeof activity.statusLine === "string" &&
    Array.isArray(activity.items) &&
    activity.items.every(isItem)
  );
}

export function decodeSnapshot(token: string): ProgressSnapshot | null {
  if (!token.startsWith("v1.")) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(token.slice(3))) as ProgressSnapshot;
    if (parsed?.v !== 1 || !Array.isArray(parsed.activities) || !parsed.activities.every(isActivity)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function formatSnapshotText(snapshot: Pick<ProgressSnapshot, "exportedAt" | "papersSubmitted" | "papersTotal" | "lessonsCompleted" | "lessonsTotal" | "activities">) {
  const lines = [
    "尹健熙 mathematics progress",
    `Exported ${formatWhen(snapshot.exportedAt)}`,
    "",
    `${snapshot.papersSubmitted} of ${snapshot.papersTotal} papers submitted`,
    `${snapshot.lessonsCompleted} of ${snapshot.lessonsTotal} lessons completed`,
    "",
  ];
  if (snapshot.activities.length === 0) {
    lines.push("No papers or lessons recorded on this browser.");
  }
  for (const activity of snapshot.activities) {
    lines.push(`${activity.title} — ${activity.statusLine}`);
    if (activity.note) lines.push(activity.note);
    for (const item of activity.items) {
      lines.push(`${item.label} — ${item.ok ? "correct" : "incorrect"}`);
    }
    lines.push("");
  }
  return `${lines.join("\n").trim()}\n`;
}

export function progressPageUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${window.location.origin}${base}/math/progress/#${token}`;
}
