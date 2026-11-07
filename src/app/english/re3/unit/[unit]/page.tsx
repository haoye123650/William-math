import { notFound } from "next/navigation";
import { UnitBoard } from "@/components/english/unit-board";
import { catalog, getLesson } from "@/lib/english/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.units.map((unit) => ({ unit: String(unit.unit) }));
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unit: string }>;
}) {
  const { unit } = await params;
  const record = catalog.units.find((entry) => String(entry.unit) === unit);
  if (!record) notFound();
  return <UnitBoard unit={record} lessonA={getLesson(record.unit, "a")} />;
}
