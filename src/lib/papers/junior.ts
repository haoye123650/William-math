import type { Paper, Question, Section } from "./types";
import paper01Json from "../../../content/math/junior/papers/paper-01/paper.json";
import paper02Json from "../../../content/math/junior/papers/paper-02/paper.json";
import paper03Json from "../../../content/math/junior/papers/paper-03/paper.json";

type SourceItem = {
  id: string;
  interaction: string;
  prompt: string;
  choices?: { id: string; text: string }[];
  answer: string | boolean;
  acceptedAnswers?: string[];
  topic: string;
  levelTag: string;
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
    titleEn: string;
    items: SourceItem[];
  }[];
  assets?: SourceAsset[];
};

const TOPICS: Record<string, string> = {
  "directed-numbers": "Directed numbers",
  "linear-equations": "Linear equations",
  percentages: "Percentages",
  "algebraic-expressions": "Algebraic expressions",
  "angles-polygons": "Angles and polygons",
  statistics: "Statistics",
  "rate-and-ratio": "Rate and ratio",
  factorization: "Factorization",
  "simultaneous-equations": "Simultaneous equations",
  pythagoras: "Pythagoras",
  indices: "Indices",
  "area-volume": "Area and volume",
};

const SECTION_COPY: Record<string, { title: string; instruction: string }> = {
  A: {
    title: "Section A  Short answers",
    instruction:
      "Answer every question. For multiple choice, choose the best answer. For a blank, write the final answer only. True or false is a choice of True or False.",
  },
  B: {
    title: "Section B  Longer answers",
    instruction:
      "Answer every question. Write the final answer in the box. That final answer is what is marked.",
  },
};

/**
 * English solutions for the mark scheme. The source JSON keeps the original
 * wording for the archive; the site shows this text.
 */
const SOLUTIONS: Record<string, Record<string, string>> = {
  "paper-01": {
    A1: "−5 is further left on the number line than −4, so −5 < −4.",
    A2: "−7 + 12 = 5.",
    A3: "2x = 6, so x = 3. The statement is true.",
    A4: "0.15 × 80 = 12.",
    A5: "3 + 5 − 2 = 6, so the expression is 6a.",
    A6: "The interior angles of a triangle add up to 180°.",
    A7: "(−3) × (−4) = 12, and 12 − 10 = 2.",
    A8: "x − 2 = 5, so x = 7.",
    A9: "Selling price = 200 × (1 − 0.2) = 160.",
    A10: "2(x + 3) − (x − 1) = 2x + 6 − x + 1 = x + 7.",
    A11: "The exterior angles of a polygon add up to 360°. Each exterior angle of a regular hexagon is 360 ÷ 6 = 60°.",
    A12: "(4 + 6 + 8 + 10) ÷ 4 = 7.",
    A13: "2x − 4 = 10 gives x = 7, and 2x − 4 = −10 gives x = −3. The larger solution is 7.",
    B1: "From 6 a.m. to 10 a.m. is 4 hours. The rise is 4 × 2.5 = 10°, so −6 + 10 = 4°C.",
    B2: "72 × 1.25 = 90.",
    B3: "In order the ages are 12, 13, 13, 14, 18. The median is the middle value, 13. The mean is 70 ÷ 5 = 14. Write 13,14.",
    B4: "One interior angle is [(8 − 2) × 180] ÷ 8 = 135°.",
    B5: "4(2x − 3) − 3(x − 5) + 2 = 8x − 12 − 3x + 15 + 2 = 5x + 5.",
    B6: "x/4 = 4, so x = 16.",
    B7: "500 × 1.1 = 550, then 550 × 0.9 = 495. A 10% rise followed by a 10% fall does not return to the original price.",
  },
  "paper-02": {
    A1: "3/5 = 6/x, so 3x = 30 and x = 10.",
    A2: "The highest common factor is 3, so 6x + 9 = 3(2x + 3).",
    A3: "Average speed = 120 ÷ 2 = 60 km/h.",
    A4: "3² + 4² = 25 = 5². The statement is true.",
    A5: "When multiplying powers with the same base, add the indices: 2^(3 + 2) = 2^5.",
    A6: "Area = 8 × 5 = 40.",
    A7: "Difference of squares: x² − 9 = (x − 3)(x + 3).",
    A8: "Adding the equations gives 2x = 8, so x = 4.",
    A9: "h² + 5² = 13², so h² = 144 and h = 12.",
    A10: "(a^m)^n = a^(mn), so (3²)³ = 3^6.",
    A11: "Volume = 4 × 3 × 5 = 60.",
    A12: "There are 5 parts. The larger share is (3/5) × 360 = 216.",
    A13: "From the first equation, y = 11 − 2x. Substitute: 3x − 2(11 − 2x) = 6, so 7x = 28, x = 4 and y = 3.",
    B1: "2x² − 8 = 2(x² − 4) = 2(x − 2)(x + 2).",
    B2: "4 cm on the map is 4 × 50 000 = 200 000 cm = 2 km.",
    B3: "AB² = 8² + 15² = 289, so AB = 17.",
    B4: "2^(3 + 5 − 4) = 2^4.",
    B5: "Volume = (22/7) × 7² × 10 = 1540.",
    B6: "12 ÷ 4 = 3.",
    B7: "From the second equation, y = 3x − 3. Then x + 2(3x − 3) = 8, so x = 2 and y = 3. The ordered pair is (2, 3).",
  },
  "paper-03": {
    A1: "x = 35 ÷ 5 = 7.",
    A2: "0.4 × 50 = 20.",
    A3: "7 − 2 + 1 = 6, so the expression is 6b.",
    A4: "Any non-zero number to the power 0 is 1, so 5⁰ = 1, not 0. The statement is false.",
    A5: "The exterior angles add up to 360°. Each exterior angle of an equilateral triangle is 360 ÷ 3 = 120°.",
    A6: "3 appears most often, so the mode is 3.",
    A7: "Cement = 15 × (2/3) = 10 kg.",
    A8: "2 and 3 add to 5 and multiply to 6, so x² + 5x + 6 = (x + 2)(x + 3).",
    A9: "(x + 4)(x − 2) = x² − 2x + 4x − 8 = x² + 2x − 8. Write x^2+2x-8.",
    A10: "6² + 8² = 100 = 10².",
    A11: "a^(5 − 2) = a^3.",
    A12: "Area = (1/2) × 12 × 5 = 30.",
    A13: "Original price × 1.15 = 230, so the original price is 230 ÷ 1.15 = 200.",
    A14: "4x − 2x = 9 + 3, so 2x = 12 and x = 6.",
    B1: "Range = largest − smallest = 15 − 4 = 11.",
    B2: "3x² − 12x + 12 = 3(x² − 4x + 4) = 3(x − 2)². Write 3(x-2)^2.",
    B3: "Let the numbers be x and y with x > y. Then x + y = 20 and x − y = 6. Adding gives 2x = 26, so the larger number is 13.",
    B4: "If the side is a, then a√2 = 10√2, so a = 10 and the area is 100.",
    B5: "5^(2 − 3 − (−1)) = 5^0. That power equals 1. The keyed answer is 5^0.",
    B6: "2/3 = n/15, so 3n = 30 and n = 10.",
    B7: "[(n − 2) × 180] / n = 150 gives 30n = 360, so n = 12.",
  },
};

const SHARED_NOTES = [
  "About 30% S.1, 40% S.2 and 30% S.3. The level tag on each question is [S1], [S2] or [S3].",
  "Each question is 1 mark. Write the final answer in the form the question asks for.",
  "Spacing is ignored when an answer is marked. A different algebraic form is marked wrong unless the key lists it.",
];

const MATERIALS = "Pen and rough paper. Calculators are not allowed.";

function bands(total: number): { range: string; note: string }[] {
  const high = Math.round(total * 0.9);
  const mid = Math.round(total * 0.75);
  const low = Math.round(total * 0.6);
  return [
    {
      range: `${high}–${total}`,
      note: "Secure across this mixed quiz. Next, try the questions again without the level tag as a hint.",
    },
    {
      range: `${mid}–${high - 1}`,
      note: "Mostly secure. Redo the questions marked wrong, starting with the higher level tag.",
    },
    {
      range: `${low}–${mid - 1}`,
      note: "The mix has gaps. Use the level tag on each miss to choose what to reteach.",
    },
    {
      range: `below ${low}`,
      note: "Rebuild the [S1] items first, then return to [S2] and [S3].",
    },
  ];
}

function stemWithoutTag(item: SourceItem) {
  const prefix = `[${item.levelTag}]`;
  return item.prompt.startsWith(prefix)
    ? item.prompt.slice(prefix.length).trimStart()
    : item.prompt;
}

function toQuestion(sourceId: string, item: SourceItem): Question {
  const explanation = SOLUTIONS[sourceId]?.[item.id];
  if (!explanation) {
    throw new Error(`Missing English solution for ${sourceId} ${item.id}`);
  }
  if (/[\u4e00-\u9fff]/.test(explanation)) {
    throw new Error(`Solution for ${sourceId} ${item.id} is not English`);
  }
  if (item.levelTag !== "S1" && item.levelTag !== "S2" && item.levelTag !== "S3") {
    throw new Error(`Bad level tag on ${sourceId} ${item.id}`);
  }
  const skill = TOPICS[item.topic];
  if (!skill) {
    throw new Error(`Unknown topic ${item.topic} on ${sourceId} ${item.id}`);
  }
  const stem = stemWithoutTag(item);
  const figure = {
    assetIds: item.assetIds ?? [],
    imagePlacement: item.imagePlacement ?? null,
  };

  if (item.interaction === "multiple-choice" || item.interaction === "true-false") {
    const options =
      item.interaction === "true-false"
        ? [
            { key: "True", text: "True" },
            { key: "False", text: "False" },
          ]
        : (item.choices ?? []).map((choice) => ({ key: choice.id, text: choice.text }));
    if (options.length < 2) {
      throw new Error(`Missing choices on ${sourceId} ${item.id}`);
    }
    const answer =
      item.interaction === "true-false"
        ? item.answer === true
          ? "True"
          : "False"
        : String(item.answer);
    return {
      id: item.id,
      no: item.id,
      type: "choice",
      stem,
      marks: 1,
      skill,
      levelTag: item.levelTag,
      options,
      answer,
      explanation,
      ...figure,
    };
  }

  if (item.interaction !== "fill-blank" && item.interaction !== "short-text") {
    throw new Error(`Unknown interaction ${item.interaction} on ${sourceId} ${item.id}`);
  }

  const canonical = String(item.answer);
  const listed = (item.acceptedAnswers ?? []).map((value) => String(value)).filter(Boolean);
  const accepted = [canonical, ...listed.filter((value) => value !== canonical)];
  return {
    id: item.id,
    no: item.id,
    type: "fill",
    stem,
    marks: 1,
    skill,
    levelTag: item.levelTag,
    blanks: [{ id: `${item.id}-a`, answer: canonical, accepted }],
    answer: canonical,
    explanation,
    ...figure,
  };
}

function toSections(source: SourcePaper): Section[] {
  return source.sections.map((section) => {
    const copy = SECTION_COPY[section.id];
    if (!copy) throw new Error(`Unknown section ${section.id} on ${source.id}`);
    const questions = section.items.map((item) => toQuestion(source.id, item));
    return {
      id: section.id,
      title: copy.title,
      instruction: copy.instruction,
      marks: questions.reduce((sum, question) => sum + question.marks, 0),
      questions,
    };
  });
}

function hangQuiz(
  source: SourcePaper,
  meta: {
    id: string;
    blurb: string;
    tutorTips: string[];
  }
): Paper {
  const sections = toSections(source);
  const totalMarks = sections.reduce((sum, section) => sum + section.marks, 0);
  const solutionIds = new Set(Object.keys(SOLUTIONS[source.id] ?? {}));
  const itemIds = sections.flatMap((section) => section.questions.map((question) => question.id));
  for (const id of itemIds) solutionIds.delete(id);
  if (solutionIds.size > 0) {
    throw new Error(`Unused English solutions on ${source.id}: ${[...solutionIds].join(", ")}`);
  }
  return {
    id: meta.id,
    title: source.titleEn,
    stars: 3,
    level: "S.1–S.3",
    blurb: meta.blurb,
    durationMin: source.timeSuggestedMin,
    totalMarks,
    extraMarks: 0,
    materials: MATERIALS,
    notes: SHARED_NOTES,
    sections,
    scoreBands: bands(totalMarks),
    tutorTips: meta.tutorTips,
    assets: (source.assets ?? []).map((asset) => ({
      id: asset.id,
      src: asset.src,
      alt: asset.alt?.trim() || "Figure",
    })),
  };
}

const paper01 = paper01Json as SourcePaper;
const paper02 = paper02Json as SourcePaper;
const paper03 = paper03Json as SourcePaper;

export const juniorPaper01 = hangQuiz(paper01, {
  id: "junior-01",
  blurb:
    "Directed numbers, equations, percentages, algebra, angles and statistics. About 30% S.1, 40% S.2 and 30% S.3.",
  tutorTips: [
    "A1: a directed number less than −4 is further left, not a smaller digit.",
    "A10: subtracting (x − 1) changes both signs inside the bracket.",
    "A13: the absolute-value equation has two solutions. The question asks for the larger one.",
    "B3: the median is the middle of the ordered list. It is not the mean.",
    "B7: a 10% rise and then a 10% fall does not return to the original price.",
  ],
});

export const juniorPaper02 = hangQuiz(paper02, {
  id: "junior-02",
  blurb:
    "Ratio, factorization, simultaneous equations, Pythagoras, indices, area and volume. About 30% S.1, 40% S.2 and 30% S.3.",
  tutorTips: [
    "A5, A10 and B4: write the power in the form the question asks for, such as 2^5.",
    "A7: x² − 9 is a difference of squares.",
    "B1: take out the common factor before using the difference of squares.",
    "B5: with π = 22/7, the 7 in the radius cancels.",
    "B7: give the ordered pair (x, y), not x alone.",
  ],
});

export const juniorPaper03 = hangQuiz(paper03, {
  id: "junior-03",
  blurb:
    "A mixed review of the junior topics in the first two quizzes. About 30% S.1, 40% S.2 and 30% S.3.",
  tutorTips: [
    "A4: 5⁰ = 1, not 0.",
    "A9: write the expanded polynomial as x^2+2x-8.",
    "B2: factorise completely, including the common factor 3.",
    "B5: the question asks for a power of 5. The keyed answer is 5^0.",
    "B7: an interior angle of 150° gives n = 12.",
  ],
});
