import { keyedFillAnswers } from "@/lib/math/junior/grade";
import type { Paper, Question, Section } from "./types";
import paper01Json from "../../../content/math/junior/papers/s1s2-pp-01/paper.json";
import paper02Json from "../../../content/math/junior/papers/s1s2-pp-02/paper.json";
import paper03Json from "../../../content/math/junior/papers/s1s2-pp-03/paper.json";

/**
 * S.1–S.2 combined practice papers. Same sitting as the junior quizzes:
 * one fill per item, storage key `pk-math-${id}-v1`, and the keyed answer
 * plus `acceptedAnswers` only. A fraction is not treated as its decimal
 * unless that form is already listed.
 */

type SourceItem = {
  id: string;
  interaction: string;
  prompt: string;
  answer: string | boolean;
  acceptedAnswers?: string[];
  solution?: string;
  topic: string;
  levelTag: string;
  marks?: number;
  assetIds?: string[];
  imagePlacement?: "above" | "beside" | null;
};

type SourceAsset = {
  id: string;
  src: string;
  alt?: string;
};

type SourcePaper = {
  id: string;
  titleEn: string;
  timeSuggestedMin: number;
  sections: {
    id: string;
    items: SourceItem[];
  }[];
  assets?: SourceAsset[];
};

const HAN = /[\u4e00-\u9fff]/;

const TOPICS: Record<string, string> = {
  "algebraic-expressions": "Algebraic expressions",
  "linear-equations": "Linear equations",
  percentages: "Percentages",
  ratio: "Ratio",
  indices: "Indices",
  factorisation: "Factorisation",
  "angles-polygons": "Angles and polygons",
  pythagoras: "Pythagoras",
  statistics: "Statistics",
  coordinates: "Coordinates",
  "simultaneous-equations": "Simultaneous equations",
  mensuration: "Mensuration",
  "simple-interest": "Simple interest",
  rates: "Rates",
  "similar-figures": "Similar figures",
  "directed-numbers": "Directed numbers",
  inequalities: "Inequalities",
  "change-of-subject": "Change of subject",
  "algebraic-fractions": "Algebraic fractions",
  probability: "Probability",
  "inverse-proportion": "Inverse proportion",
};

const SECTION_COPY: Record<string, { title: string; instruction: string }> = {
  A: {
    title: "Section A  Short answers",
    instruction:
      "Answer every question. Write the final answer in the box. That final answer is what is marked.",
  },
  B: {
    title: "Section B  Structured questions",
    instruction:
      "Answer every question. Write the final answer in the box. That final answer is what is marked.",
  },
  C: {
    title: "Section C  Stretch",
    instruction:
      "Answer every question. Write the final answer in the box. That final answer is what is marked.",
  },
};

const EXPECTED = {
  "s1s2-pp-01": { items: 37, figures: 4 },
  "s1s2-pp-02": { items: 43, figures: 7 },
  "s1s2-pp-03": { items: 41, figures: 6 },
} as const;

const SHARED_NOTES = [
  "S.1–S.2 combined. The level tag on each question is [S1] or [S2].",
  "Suggested time is 75 minutes. It is a guide only.",
  "Write the final answer in the form the question asks for. The answer in the box is what is marked.",
  "Spacing is ignored when an answer is marked. A different form is marked wrong unless the key lists it.",
];

const MATERIALS = "Pen and rough paper.";

function bands(total: number): { range: string; note: string }[] {
  const high = Math.round(total * 0.9);
  const mid = Math.round(total * 0.75);
  const low = Math.round(total * 0.6);
  return [
    {
      range: `${high}–${total}`,
      note: "Secure across this combined paper. Next, try the questions again without the level tag as a hint.",
    },
    {
      range: `${mid}–${high - 1}`,
      note: "Mostly secure. Redo the questions marked wrong, starting with [S2].",
    },
    {
      range: `${low}–${mid - 1}`,
      note: "The mix has gaps. Use the level tag on each miss to choose what to reteach.",
    },
    {
      range: `below ${low}`,
      note: "Rebuild the [S1] items first, then return to [S2].",
    },
  ];
}

function assertEnglish(sourceId: string, itemId: string, field: string, value: string) {
  if (HAN.test(value)) {
    throw new Error(`${sourceId} ${itemId} ${field} is not English`);
  }
}

function richText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n+/g, "<br>");
}

function stemWithoutTag(item: SourceItem) {
  const prefix = `[${item.levelTag}]`;
  if (!item.prompt.startsWith(prefix)) {
    throw new Error(`Prompt for ${item.id} does not start with ${prefix}`);
  }
  return item.prompt.slice(prefix.length).trimStart();
}

function publicAssetSrc(paperId: string, src: string) {
  if (!src.startsWith("assets/") || !src.endsWith(".png")) {
    throw new Error(`${paperId} asset must be a PNG under assets/: ${src}`);
  }
  return `/math/junior/papers/${paperId}/${src}`;
}

function toQuestion(sourceId: string, item: SourceItem): Question {
  if (item.levelTag !== "S1" && item.levelTag !== "S2") {
    throw new Error(`Bad level tag on ${sourceId} ${item.id}`);
  }
  const skill = TOPICS[item.topic];
  if (!skill) {
    throw new Error(`Unknown topic ${item.topic} on ${sourceId} ${item.id}`);
  }
  if (item.interaction !== "fill-blank" && item.interaction !== "short-text") {
    throw new Error(`Unknown interaction ${item.interaction} on ${sourceId} ${item.id}`);
  }
  if (!Number.isInteger(item.marks) || (item.marks ?? 0) <= 0) {
    throw new Error(`Bad marks on ${sourceId} ${item.id}`);
  }
  const solution = item.solution?.trim() ?? "";
  if (!solution) {
    throw new Error(`Missing solution for ${sourceId} ${item.id}`);
  }
  const stem = stemWithoutTag(item);
  assertEnglish(sourceId, item.id, "prompt", stem);
  assertEnglish(sourceId, item.id, "solution", solution);
  assertEnglish(sourceId, item.id, "answer", String(item.answer));
  for (const extra of item.acceptedAnswers ?? []) {
    assertEnglish(sourceId, item.id, "accepted", extra);
  }

  const assetIds = item.assetIds ?? [];
  const imagePlacement = item.imagePlacement ?? null;
  if (assetIds.length > 0 && imagePlacement !== "above" && imagePlacement !== "beside") {
    throw new Error(`${sourceId} ${item.id} has a figure without placement`);
  }
  if (assetIds.length === 0 && imagePlacement) {
    throw new Error(`${sourceId} ${item.id} has placement without a figure`);
  }

  const accepted = keyedFillAnswers(item);
  if (accepted.length === 0) {
    throw new Error(`Missing answer for ${sourceId} ${item.id}`);
  }
  const canonical = accepted[0];

  return {
    id: item.id,
    no: item.id,
    type: "fill",
    stem: richText(stem),
    marks: item.marks as number,
    skill,
    levelTag: item.levelTag,
    blanks: [{ id: `${item.id}-a`, answer: canonical, accepted }],
    answer: canonical,
    explanation: richText(solution),
    assetIds,
    imagePlacement,
  };
}

function hangPaper(
  source: SourcePaper,
  meta: {
    blurb: string;
    stars: 3 | 4;
    notes: string[];
    tutorTips: string[];
  },
): Paper {
  const expected = EXPECTED[source.id as keyof typeof EXPECTED];
  if (!expected) throw new Error(`Unexpected paper ${source.id}`);
  if (source.timeSuggestedMin !== 75) {
    throw new Error(`${source.id} time is ${source.timeSuggestedMin}, expected 75`);
  }
  assertEnglish(source.id, "paper", "title", source.titleEn);

  const seen = new Set<string>();
  const sections: Section[] = source.sections.map((section) => {
    const copy = SECTION_COPY[section.id];
    if (!copy) throw new Error(`Unknown section ${section.id} on ${source.id}`);
    const questions = section.items.map((item) => {
      if (seen.has(item.id)) throw new Error(`Duplicate item ${item.id} on ${source.id}`);
      seen.add(item.id);
      return toQuestion(source.id, item);
    });
    return {
      id: section.id,
      title: copy.title,
      instruction: copy.instruction,
      marks: questions.reduce((sum, question) => sum + question.marks, 0),
      questions,
    };
  });

  if (seen.size !== expected.items) {
    throw new Error(`${source.id} has ${seen.size} items, expected ${expected.items}`);
  }
  const totalMarks = sections.reduce((sum, section) => sum + section.marks, 0);
  if (totalMarks !== 120) {
    throw new Error(`${source.id} totals ${totalMarks}, expected 120`);
  }

  const catalog = source.assets ?? [];
  if (catalog.length !== expected.figures) {
    throw new Error(`${source.id} has ${catalog.length} figures, expected ${expected.figures}`);
  }
  const byId = new Map<string, SourceAsset>();
  for (const asset of catalog) {
    if (byId.has(asset.id)) throw new Error(`Duplicate asset ${asset.id} on ${source.id}`);
    if (!asset.alt?.trim()) throw new Error(`Missing alt on ${source.id} ${asset.id}`);
    assertEnglish(source.id, asset.id, "alt", asset.alt);
    byId.set(asset.id, asset);
  }
  const used = new Set<string>();
  for (const section of sections) {
    for (const question of section.questions) {
      for (const assetId of question.assetIds ?? []) {
        if (!byId.has(assetId)) {
          throw new Error(`${source.id} ${question.id} points at missing asset ${assetId}`);
        }
        used.add(assetId);
      }
    }
  }
  for (const assetId of byId.keys()) {
    if (!used.has(assetId)) {
      throw new Error(`${source.id} asset ${assetId} is not used`);
    }
  }

  if (source.id === "s1s2-pp-02") {
    for (const section of sections) {
      for (const question of section.questions) {
        if (question.id.startsWith("B13") && (question.assetIds?.length || question.imagePlacement)) {
          throw new Error("Paper 2 B13 must stay a calculation with no figure");
        }
      }
    }
  }

  for (const note of [...SHARED_NOTES, ...meta.notes, ...meta.tutorTips, meta.blurb]) {
    if (HAN.test(note)) throw new Error(`Student copy on ${source.id} is not English`);
  }

  return {
    id: source.id,
    title: source.titleEn,
    stars: meta.stars,
    level: "S.1–S.2",
    blurb: meta.blurb,
    durationMin: source.timeSuggestedMin,
    totalMarks,
    extraMarks: 0,
    materials: MATERIALS,
    notes: [...SHARED_NOTES, ...meta.notes],
    sections,
    scoreBands: bands(totalMarks),
    tutorTips: meta.tutorTips,
    assets: catalog.map((asset) => ({
      id: asset.id,
      src: publicAssetSrc(source.id, asset.src),
      alt: asset.alt?.trim() || "Figure",
    })),
  };
}

const paper01 = paper01Json as SourcePaper;
const paper02 = paper02Json as SourcePaper;
const paper03 = paper03Json as SourcePaper;

export const s1s2Paper01 = hangPaper(paper01, {
  stars: 3,
  blurb:
    "Algebra, percentages, ratio, indices, factorisation, Pythagoras, statistics and mensuration. 120 marks.",
  notes: [
    "Unless a question says otherwise, numerical answers should be exact or correct to 3 significant figures.",
  ],
  tutorTips: [
    "C16d asks for a proof that the triangles are similar. The box matches the keyed phrase only, so read the method.",
    "C17b asks for a comment on the principal's statement. The box matches the keyed wording only.",
    "B13 uses the true value of π. The paper does not set π = 3.14.",
    "A fraction and a decimal match only when both are listed for that item.",
  ],
});

export const s1s2Paper02 = hangPaper(paper02, {
  stars: 3,
  blurb:
    "Inequalities, angles, coordinates, mensuration, similarity and statistics. 120 marks.",
  notes: ["Take π = 3.14 if a numerical answer is required."],
  tutorTips: [
    "B12b asks whether the tank overflows. The box matches the keyed conclusion only, so read the method.",
    "B14a asks the student to show that the total is 240. The box matches the keyed total.",
    "C16e asks the student to show that triangle BDC is isosceles. The box matches the keyed phrase only.",
    "C17d asks for a plan suggestion written as A, B.",
    "A3, B11a and C15a ask for an expression or equation. Only the listed forms are accepted.",
    "B13 is a scale and perimeter calculation. It has no figure.",
  ],
});

export const s1s2Paper03 = hangPaper(paper03, {
  stars: 4,
  blurb:
    "A stretch paper: indices, Pythagoras, similarity, mensuration and statistics, stepping toward S.3. 120 marks.",
  notes: [
    "Surds may be left in exact form.",
    "Unless a question says otherwise, numerical answers should be exact or correct to 3 significant figures.",
  ],
  tutorTips: [
    "A7a asks the student to show that the triangle is right-angled. The box matches the keyed phrase only. The figure does not mark the right angle.",
    "C15a asks for an equation in x. Only the listed forms are accepted.",
    "C17b compares the two classes by the median. The box matches the keyed wording only.",
    "C17d asks for a comment on the two parents' statements. The box matches the keyed wording only.",
    "B12a wants both the exact form in π and the value correct to 3 significant figures.",
  ],
});
