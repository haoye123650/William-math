import Link from "next/link";
import { EnglishShell } from "@/components/english/shell";

export default function EnglishHomePage() {
  return (
    <EnglishShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            尹健熙 · English
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Choose a book</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Readings open in the site. There is no packet of PDF downloads, and there is no video track.
          </p>
        </div>
        <Link
          href="/english/re3"
          className="block max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            Third edition
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Reading Explorer 3</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Nancy Douglas and David Bohlke. Units 1–12. Each unit has Reading A and Reading B.
          </p>
          <p className="mt-5 text-sm font-medium text-primary">Open the unit list</p>
        </Link>
      </main>
    </EnglishShell>
  );
}
