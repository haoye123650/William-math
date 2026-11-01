import { notFound } from "next/navigation";
import { PrintView } from "@/components/print-view";
import { getPaper, paperIds } from "@/lib/papers";

export const dynamicParams = false;

export function generateStaticParams() {
  return paperIds().map((id) => ({ id }));
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = getPaper(id);
  if (!paper) notFound();
  return <PrintView paper={paper} />;
}
