export type ChoiceOption = {
  key: string;
  text: string;
};

export type Blank = {
  id: string;
  label?: string;
  answer: string;
  accepted?: string[];
};

export type Question = {
  id: string;
  no: string;
  type: "choice" | "fill" | "work";
  stem: string;
  marks: number;
  skill: string;
  options?: ChoiceOption[];
  blanks?: Blank[];
  lines?: number;
  answer: string;
  explanation: string;
  marking?: string;
  diagram?: "triangle" | "path";
};

export type Section = {
  id: string;
  title: string;
  instruction: string;
  marks: number;
  extra?: boolean;
  questions: Question[];
};

export type AnswersState = Record<string, string>;

export type CurriculumTag = "S1" | "S2" | "S3";

export function curriculumTag(level: string): CurriculumTag | null {
  const match = /\bS\.?\s*([123])\b/i.exec(level);
  if (!match) return null;
  if (match[1] === "1") return "S1";
  if (match[1] === "2") return "S2";
  return "S3";
}

export type Paper = {
  id: string;
  title: string;
  stars: 1 | 2 | 3 | 4 | 5;
  level: string;
  blurb: string;
  durationMin: number;
  totalMarks: number;
  extraMarks: number;
  materials: string;
  notes: string[];
  sections: Section[];
  scoreBands: { range: string; note: string }[];
  tutorTips: string[];
};

export function frac(n: string, d: string) {
  return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
}

export function allQuestions(paper: Paper): Question[] {
  return paper.sections.flatMap((section) => section.questions);
}
