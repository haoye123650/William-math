import type { Metadata } from "next";
import Link from "next/link";
import { ProgressScreen } from "@/components/progress-record";
import { listTopics, topicHref } from "@/lib/math/junior/content";
import { papers } from "@/lib/papers";
import type { ProgressCatalog } from "@/lib/progress-report";

export const metadata: Metadata = {
  title: "Progress · 尹健熙",
  description: "Mathematics papers, quizzes, and topic lessons already completed on this browser.",
};

function progressCatalog(): ProgressCatalog {
  return {
    papers: papers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      kind: paper.id.startsWith("junior-") ? "quiz" : "paper",
    })),
    topics: listTopics().map((topic) => ({
      key: `${topic.year}/${topic.slug}`,
      title: topic.title,
      href: topicHref(topic.year, topic.slug),
    })),
  };
}

export default function ProgressPage() {
  return (
    <div className="min-h-full flex-1 bg-background">
      <div className="border-b border-white/10 bg-board text-board-foreground">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-2 text-sm">
          <nav className="flex items-center gap-3">
            <Link href="/" className="underline-offset-4 hover:underline">
              Subjects
            </Link>
            <Link href="/math" className="underline-offset-4 hover:underline">
              Mathematics
            </Link>
            <Link href="/math/junior" className="underline-offset-4 hover:underline">
              Topics
            </Link>
          </nav>
          <span>Progress</span>
        </div>
      </div>
      <header className="bg-board text-board-foreground">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
          <p className="text-sm font-medium tracking-[0.08em]">尹健熙 · Mathematics</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold">Progress</h1>
          <p className="mt-3 max-w-2xl text-base leading-7">
            Papers, quizzes, and topic lessons. This browser keeps its own record. A parent link opens a copy.
          </p>
        </div>
        <div className="h-1 bg-mark" aria-hidden="true" />
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 py-8">
        <ProgressScreen catalog={progressCatalog()} />
      </main>
    </div>
  );
}
