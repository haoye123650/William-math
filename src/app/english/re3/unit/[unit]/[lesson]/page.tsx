import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/english/lesson-player";
import { getLesson, lessonParams } from "@/lib/english/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return lessonParams();
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ unit: string; lesson: string }>;
}) {
  const { unit, lesson } = await params;
  if (lesson !== "a" && lesson !== "b") notFound();
  const data = getLesson(Number(unit), lesson);
  if (!data) notFound();
  return <LessonPlayer lesson={data} />;
}
