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

export type ImagePlacement = "above" | "beside";

export type PaperAsset = {
  id: string;
  src: string;
  alt: string;
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
  /** Visible level chip, such as S1. The stem should not repeat it. */
  levelTag?: string;
  /** Ids into Paper.assets. Empty when this batch has no figure yet. */
  assetIds?: string[];
  /** Where a resolved figure sits. Null keeps the question as text only. */
  imagePlacement?: ImagePlacement | null;
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
  /** Figure catalog. Questions point at these with assetIds. */
  assets?: PaperAsset[];
};

export function figuresFor(question: Question, catalog: PaperAsset[] | undefined) {
  const placement = question.imagePlacement;
  if (placement !== "above" && placement !== "beside") return [];
  const ids = question.assetIds ?? [];
  if (ids.length === 0 || !catalog?.length) return [];
  const byId = new Map(catalog.map((asset) => [asset.id, asset]));
  return ids.flatMap((id) => {
    const asset = byId.get(id);
    return asset?.src ? [asset] : [];
  });
}

export function frac(n: string, d: string) {
  return `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
}

export function allQuestions(paper: Paper): Question[] {
  return paper.sections.flatMap((section) => section.questions);
}

export function hasTeacherMarkedWork(paper: Paper) {
  return paper.sections.some(
    (section) =>
      section.extra === true ||
      section.questions.some((question) => question.type === "work")
  );
}
