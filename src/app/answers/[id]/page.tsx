import { notFound } from "next/navigation";
import { AnswersView } from "@/components/answers-view";
import { getPaper, paperIds } from "@/lib/papers";

export const dynamicParams = false;

export function generateStaticParams() {
  return paperIds().map((id) => ({ id }));
}

export default async function AnswersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();
  return <AnswersView paper={paper} />;
}
