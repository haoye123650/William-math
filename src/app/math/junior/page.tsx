import type { Metadata } from "next";
import { JuniorShell } from "@/components/math/junior-shell";
import { TopicIndex } from "@/components/math/topic-index";
import { listTopics } from "@/lib/math/junior/content";

export const metadata: Metadata = {
  title: "Practice by topic · 尹健熙",
  description: "Junior mathematics lessons: warm-up, key ideas, practice, and a challenge.",
};

export default function JuniorTopicsPage() {
  const count = listTopics().length;

  return (
    <JuniorShell>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8 sm:py-10">
        <header>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            尹健熙 · Mathematics
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Practice by topic</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            {count} junior lessons. Each lesson is a warm-up, key ideas, level 1, level 2,
            and a challenge.
          </p>
        </header>
        <TopicIndex />
      </main>
    </JuniorShell>
  );
}
