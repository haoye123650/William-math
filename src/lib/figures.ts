import type { Question } from "@/lib/papers/types";

const FIGURE_STEM =
  /\b(in the figure|the figure shows|figure below|in the diagram|shown in the diagram)\b/i;

export function stemNeedsFigure(stem: string) {
  return FIGURE_STEM.test(stem.replace(/<[^>]+>/g, " "));
}

export type FigureStatus = "none" | "triangle" | "missing";

export function figureStatus(question: Pick<Question, "diagram" | "stem">): FigureStatus {
  const needs = Boolean(question.diagram) || stemNeedsFigure(question.stem);
  if (!needs) return "none";
  if (question.diagram === "triangle") return "triangle";
  return "missing";
}
