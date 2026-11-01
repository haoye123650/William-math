import type { Paper } from "./types";
import { mathPaper } from "./math";
import { paper2 } from "./paper-2";
import { paper3 } from "./paper-3";
import { paper4 } from "./paper-4";
import { paper5 } from "./paper-5";
import { paper6 } from "./paper-6";

export const papers: Paper[] = [mathPaper, paper2, paper3, paper4, paper5, paper6];

export function getPaper(id: string): Paper | undefined {
  return papers.find((paper) => paper.id === id);
}

export function paperIds(): string[] {
  return papers.map((paper) => paper.id);
}

export { mathPaper, paper2, paper3, paper4, paper5, paper6 };
export * from "./types";
