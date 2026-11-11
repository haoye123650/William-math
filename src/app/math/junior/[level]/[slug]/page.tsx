import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPractice } from "@/components/math/lesson-player";
import { getJuniorLesson, juniorParams } from "@/lib/math/junior/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return juniorParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ level: string; slug: string }>;
}): Promise<Metadata> {
  const { level, slug } = await params;
  const lesson = getJuniorLesson(level, slug);
  if (!lesson) return { title: "Practice by topic · 尹健熙" };
  return {
    title: `${lesson.titleEn} · 尹健熙`,
    description: `${lesson.titleEn}. Warm-up, key ideas, level 1, level 2, and a challenge.`,
  };
}

export default async function JuniorLessonPage({
  params,
}: {
  params: Promise<{ level: string; slug: string }>;
}) {
  const { level, slug } = await params;
  const lesson = getJuniorLesson(level, slug);
  if (!lesson) notFound();
  return <LessonPractice key={`${level}/${slug}`} lesson={lesson} />;
}
