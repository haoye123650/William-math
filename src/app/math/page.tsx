import Link from "next/link";
import { Difficulty } from "@/components/difficulty";
import { TopicIndex } from "@/components/math/topic-index";
import { PaperProgress, PaperStatus } from "@/components/paper-status";
import { ProgressRecord } from "@/components/progress-record";
import { Button } from "@/components/ui/button";
import { listTopics, topicHref } from "@/lib/math/junior/content";
import type { ProgressCatalog } from "@/lib/progress-report";
import { papers, type Paper } from "@/lib/papers";

const FACTS = [
  { term: "Tests 1–6", detail: "100 marks on each full paper." },
  { term: "Materials", detail: "Calculators are not allowed." },
  { term: "Afterward", detail: "The mark scheme opens after you submit." },
] as const;

function sheetNo(id: string) {
  if (/^\d+$/.test(id)) return id.padStart(2, "0");
  const tail = id.match(/(\d+)$/)?.[1];
  return tail ? tail.padStart(2, "0") : id;
}

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

const GROUPS = [
  {
    id: "part-1",
    kicker: "Part I",
    title: "Junior secondary",
    note: "Tests 1–3",
    papers: papers.filter((paper) => Number(paper.id) <= 3),
  },
  {
    id: "junior-mixed",
    kicker: "Quizzes",
    title: "Junior mixed",
    note: "Papers 01–03",
    papers: papers.filter((paper) => paper.id.startsWith("junior-")),
  },
  {
    id: "s1s2",
    kicker: "Practice",
    title: "S.1–S.2 combined",
    note: "Papers 01–03 · 120 marks",
    papers: papers.filter((paper) => paper.id.startsWith("s1s2-pp-")),
  },
  {
    id: "part-2",
    kicker: "Part II",
    title: "S.3 to DSE",
    note: "Tests 4–6",
    papers: papers.filter((paper) => Number(paper.id) >= 4),
  },
] as const;

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <article
      aria-labelledby={`paper-${paper.id}-title`}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        <p
          className="hidden w-12 shrink-0 pt-0.5 font-serif text-3xl leading-none font-semibold text-primary tabular-nums sm:block"
          aria-hidden="true"
        >
          {sheetNo(paper.id)}
        </p>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3
              id={`paper-${paper.id}-title`}
              className="font-serif text-xl leading-snug font-semibold"
            >
              <span className="mr-2 font-semibold text-primary tabular-nums sm:hidden">
                {sheetNo(paper.id)}
              </span>
              {paper.title}
            </h3>
            <PaperStatus paperId={paper.id} />
          </div>
          <PaperProgress
            paperId={paper.id}
            title={paper.title}
            kind={paper.id.startsWith("junior-") ? "quiz" : "paper"}
          />
          <p className="mt-2 text-sm leading-6 text-pretty text-muted-foreground">
            {paper.blurb}
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Level
              </dt>
              <dd className="mt-0.5 text-sm font-medium">{paper.level}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Time
              </dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums">
                {paper.durationMin} min
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Marks
              </dt>
              <dd className="mt-0.5 text-sm font-medium tabular-nums">
                {paper.totalMarks}
              </dd>
            </div>
          </dl>
          <div className="mt-3">
            <Difficulty stars={paper.stars} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-border bg-muted/45 p-3 sm:flex sm:flex-wrap sm:px-5">
        <Button
          size="lg"
          className="col-span-2 h-11 px-4 sm:col-span-1 sm:w-auto"
          nativeButton={false}
          render={<Link href={`/paper/${paper.id}`} />}
        >
          Start
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-11 bg-card px-4 sm:w-auto"
          nativeButton={false}
          render={<Link href={`/print/${paper.id}`} />}
        >
          Print
        </Button>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-full flex-1 bg-background">
      <div className="border-b border-white/10 bg-board text-board-foreground">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-2 text-sm">
          <nav className="flex items-center gap-3">
            <Link href="/" className="underline-offset-4 hover:underline">
              Subjects
            </Link>
            <Link href="/math/junior" className="underline-offset-4 hover:underline">
              Topics
            </Link>
            <a href="#progress" className="underline-offset-4 hover:underline">
              Progress
            </a>
          </nav>
          <span>Mathematics</span>
        </div>
      </div>
      <header className="bg-board text-board-foreground">
        <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-14">
          <p className="text-sm font-medium tracking-[0.08em]">
            DSE Mathematics · 2026–2027
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl">
            尹健熙
            <span className="mt-2 block text-[1.65rem] leading-snug font-medium sm:text-3xl">
              Pui Kiu Mathematics
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7">
            Six full papers, each 100 marks, three junior mixed quizzes, three
            S.1–S.2 combined practice papers, and practice by topic. Tests 1–3
            are junior secondary. Tests 4–6 step up through S.3, S.4 and DSE
            Paper 1 style. Each quiz question keeps its [S1], [S2] or [S3] level
            tag. Each combined paper is 120 marks, with a suggested time of 75
            minutes. The mark scheme opens after you submit.
          </p>
        </div>
        <div className="h-1 bg-mark" aria-hidden="true" />
      </header>

      <div className="border-b border-border bg-card">
        <dl className="mx-auto grid w-full max-w-3xl divide-y divide-border px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FACTS.map((fact) => (
            <div key={fact.term} className="py-3.5 sm:px-4 sm:py-4 sm:first:pl-0 sm:last:pr-0">
              <dt className="text-xs font-semibold tracking-wide text-primary uppercase">
                {fact.term}
              </dt>
              <dd className="mt-1 text-sm leading-6">{fact.detail}</dd>
            </div>
          ))}
        </dl>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-8 sm:py-10">
        <ProgressRecord catalog={progressCatalog()} />
        {GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`${group.id}-title`} className="space-y-3">
            <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                  {group.kicker}
                </p>
                <h2 id={`${group.id}-title`} className="font-serif text-2xl font-semibold">
                  {group.title}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">{group.note}</p>
            </div>
            <div className="space-y-4">
              {group.papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          </section>
        ))}
        <section aria-labelledby="topics-title" className="space-y-3">
          <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                Junior
              </p>
              <h2 id="topics-title" className="font-serif text-2xl font-semibold">
                Practice by topic
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{listTopics().length} lessons</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Warm-up, key ideas, level 1, level 2, and a challenge. Open a lesson from S.1 or S.2.
          </p>
          <TopicIndex />
        </section>
      </main>
    </div>
  );
}
