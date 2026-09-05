import { notFound } from "next/navigation";
import { ExamTake } from "@/components/exam-take";
import { getPaper, paperIds } from "@/lib/papers";

export function generateStaticParams() {
  return paperIds().map((id) => ({ id }));
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();
  return <ExamTake paper={paper} />;
}
