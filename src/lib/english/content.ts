import catalogJson from "@/content/english/re3/catalog.json";
import type { Catalog, Lesson } from "@/lib/english/types";
import u01a from "@/content/english/re3/unit-01/a.json";
import u01b from "@/content/english/re3/unit-01/b.json";
import u02a from "@/content/english/re3/unit-02/a.json";
import u02b from "@/content/english/re3/unit-02/b.json";
import u03a from "@/content/english/re3/unit-03/a.json";
import u03b from "@/content/english/re3/unit-03/b.json";
import u04a from "@/content/english/re3/unit-04/a.json";
import u04b from "@/content/english/re3/unit-04/b.json";
import u05a from "@/content/english/re3/unit-05/a.json";
import u05b from "@/content/english/re3/unit-05/b.json";
import u06a from "@/content/english/re3/unit-06/a.json";
import u06b from "@/content/english/re3/unit-06/b.json";
import u07a from "@/content/english/re3/unit-07/a.json";
import u07b from "@/content/english/re3/unit-07/b.json";
import u08a from "@/content/english/re3/unit-08/a.json";
import u08b from "@/content/english/re3/unit-08/b.json";
import u09a from "@/content/english/re3/unit-09/a.json";
import u09b from "@/content/english/re3/unit-09/b.json";
import u10a from "@/content/english/re3/unit-10/a.json";
import u10b from "@/content/english/re3/unit-10/b.json";
import u11a from "@/content/english/re3/unit-11/a.json";
import u11b from "@/content/english/re3/unit-11/b.json";
import u12a from "@/content/english/re3/unit-12/a.json";
import u12b from "@/content/english/re3/unit-12/b.json";

export const catalog = catalogJson as Catalog;

const lessons: Record<string, Lesson> = {
  "1-a": u01a as Lesson,
  "1-b": u01b as Lesson,
  "2-a": u02a as Lesson,
  "2-b": u02b as Lesson,
  "3-a": u03a as Lesson,
  "3-b": u03b as Lesson,
  "4-a": u04a as Lesson,
  "4-b": u04b as Lesson,
  "5-a": u05a as Lesson,
  "5-b": u05b as Lesson,
  "6-a": u06a as Lesson,
  "6-b": u06b as Lesson,
  "7-a": u07a as Lesson,
  "7-b": u07b as Lesson,
  "8-a": u08a as Lesson,
  "8-b": u08b as Lesson,
  "9-a": u09a as Lesson,
  "9-b": u09b as Lesson,
  "10-a": u10a as Lesson,
  "10-b": u10b as Lesson,
  "11-a": u11a as Lesson,
  "11-b": u11b as Lesson,
  "12-a": u12a as Lesson,
  "12-b": u12b as Lesson,
};

export function lessonKey(unit: number, lessonId: string) {
  return `${unit}-${lessonId}`;
}

export function getLesson(unit: number, lessonId: string): Lesson | undefined {
  return lessons[lessonKey(unit, lessonId)];
}

export function lessonParams() {
  return catalog.units.flatMap((unit) =>
    unit.lessons.map((lesson) => ({
      unit: String(unit.unit),
      lesson: lesson.id,
    })),
  );
}

