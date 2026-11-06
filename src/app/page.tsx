import Link from "next/link";
import { Button } from "@/components/ui/button";
import { papers } from "@/lib/papers";

function Stars({ count }: { count: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span
      className="font-medium tracking-[0.2em] text-amber-500"
      aria-label={`${count} out of 5 stars`}
    >
      {"★".repeat(count)}
      <span className="text-amber-500/30">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-full bg-[#f4efe6]">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-10 sm:py-14">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.28em] text-muted-foreground">
            DSE Mathematics · 2026–2027
          </p>
          <h1 className="font-serif text-4xl leading-tight font-semibold">
            尹健熙
            <br />
            Pui Kiu Mathematics
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            Six papers, each 100 marks. Tests 1–3 are junior secondary.
            Tests 4–6 step up through S.3, S.4 and DSE Paper 1 style.
            Calculators are not allowed. The mark scheme opens after you submit.
          </p>
        </header>

        <div className="space-y-3">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="rounded-xl border bg-[#fbf7ef] px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="font-serif text-lg font-semibold">{paper.title}</p>
                    <Stars count={paper.stars} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {paper.level} · {paper.durationMin} min · {paper.blurb}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    nativeButton={false}
                    render={<Link href={`/paper/${paper.id}`} />}
                  >
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/print/${paper.id}`} />}
                  >
                    Print
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
