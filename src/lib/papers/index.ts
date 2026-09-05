import type { Paper } from "./types";
import { mathPaper } from "./math";
import { paper2 } from "./paper-2";
import { paper3 } from "./paper-3";

export const papers: Paper[] = [mathPaper, paper2, paper3];

export function getPaper(id: string): Paper | undefined {
  return papers.find((paper) => paper.id === id);
}

export function paperIds(): string[] {
  return papers.map((paper) => paper.id);
}

export { mathPaper, paper2, paper3 };
export * from "./types";
