import { formatLevel, questionCount } from "@/lib/math/junior/grade";
import type { JuniorLesson, TopicRef, TopicYear } from "@/lib/math/junior/types";
import directedNumbers from "@/content/math/junior/s1/directed-numbers/lesson.json";
import linearEquations from "@/content/math/junior/s1/linear-equations/lesson.json";
import percentagesI from "@/content/math/junior/s1/percentages-i/lesson.json";
import rateAndRatio from "@/content/math/junior/s1/rate-and-ratio/lesson.json";
import algebraicExpressions from "@/content/math/junior/s1/algebraic-expressions/lesson.json";
import factorization from "@/content/math/junior/s2/factorization/lesson.json";
import simultaneousEquations from "@/content/math/junior/s2/simultaneous-equations/lesson.json";
import pythagoras from "@/content/math/junior/s2/pythagoras/lesson.json";
import indices from "@/content/math/junior/s2/indices/lesson.json";

const ORDER: { year: TopicYear; slug: string }[] = [
  { year: "s1", slug: "directed-numbers" },
  { year: "s1", slug: "linear-equations" },
  { year: "s1", slug: "percentages-i" },
  { year: "s1", slug: "rate-and-ratio" },
  { year: "s1", slug: "algebraic-expressions" },
  { year: "s2", slug: "factorization" },
  { year: "s2", slug: "simultaneous-equations" },
  { year: "s2", slug: "pythagoras" },
  { year: "s2", slug: "indices" },
];

const lessons: Record<string, JuniorLesson> = {
  "s1/directed-numbers": directedNumbers as JuniorLesson,
  "s1/linear-equations": linearEquations as JuniorLesson,
  "s1/percentages-i": percentagesI as JuniorLesson,
  "s1/rate-and-ratio": rateAndRatio as JuniorLesson,
  "s1/algebraic-expressions": algebraicExpressions as JuniorLesson,
  "s2/factorization": factorization as JuniorLesson,
  "s2/simultaneous-equations": simultaneousEquations as JuniorLesson,
  "s2/pythagoras": pythagoras as JuniorLesson,
  "s2/indices": indices as JuniorLesson,
};

export function listTopics(): TopicRef[] {
  return ORDER.map(({ year, slug }) => {
    const lesson = lessons[`${year}/${slug}`];
    if (!lesson) {
      throw new Error(`Missing junior lesson ${year}/${slug}`);
    }
    return {
      year,
      slug,
      title: lesson.titleEn,
      levelLabel: formatLevel(lesson.level),
      questions: questionCount(lesson),
    };
  });
}

export function topicGroups() {
  const topics = listTopics();
  return [
    {
      id: "s1",
      kicker: "Junior",
      title: "S.1",
      topics: topics.filter((topic) => topic.year === "s1"),
    },
    {
      id: "s2",
      kicker: "Junior",
      title: "S.2",
      topics: topics.filter((topic) => topic.year === "s2"),
    },
  ];
}

export function topicHref(year: string, slug: string) {
  return `/math/junior/${year}/${slug}`;
}

export function getJuniorLesson(year: string, slug: string) {
  return lessons[`${year}/${slug}`];
}

export function juniorParams() {
  return ORDER.map(({ year, slug }) => ({ level: year, slug }));
}
