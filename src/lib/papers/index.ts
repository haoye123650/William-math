import type { Paper } from "./types";
import { mathPaper } from "./math";
import { paper2 } from "./paper-2";
import { paper3 } from "./paper-3";
import { paper4 } from "./paper-4";
import { paper5 } from "./paper-5";
import { paper6 } from "./paper-6";
import { juniorPaper01, juniorPaper02, juniorPaper03 } from "./junior";
import { s1s2Paper01, s1s2Paper02, s1s2Paper03 } from "./s1s2";

export const papers: Paper[] = [
  mathPaper,
  paper2,
  paper3,
  paper4,
  paper5,
  paper6,
  juniorPaper01,
  juniorPaper02,
  juniorPaper03,
  s1s2Paper01,
  s1s2Paper02,
  s1s2Paper03,
];

export function getPaper(id: string): Paper | undefined {
  return papers.find((paper) => paper.id === id);
}

export function paperIds(): string[] {
  return papers.map((paper) => paper.id);
}

export { mathPaper, paper2, paper3, paper4, paper5, paper6 };
export { juniorPaper01, juniorPaper02, juniorPaper03 };
export { s1s2Paper01, s1s2Paper02, s1s2Paper03 };
export * from "./types";
