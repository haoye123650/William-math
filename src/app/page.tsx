import Link from "next/link";

export default function SubjectGatePage() {
  return (
    <main className="grid min-h-full flex-1 md:grid-cols-2">
      <Link
        href="/math"
        className="flex min-h-[70vh] flex-col justify-between bg-board px-6 py-10 text-board-foreground sm:px-10 sm:py-14"
      >
        <div>
          <p className="text-sm font-medium tracking-[0.16em] uppercase">尹健熙</p>
          <h1 className="mt-4 font-serif text-5xl leading-none font-semibold sm:text-6xl">
            Mathematics
          </h1>
          <p className="mt-4 max-w-md text-base leading-7">
            Six DSE-style papers, three junior mixed quizzes, and three S.1–S.2
            combined practice papers. Start a paper or print it. The mark scheme
            opens after you submit.
          </p>
        </div>
        <p className="mt-10 text-sm font-medium tracking-[0.12em] uppercase">
          Enter mathematics
        </p>
      </Link>
      <Link
        href="/english"
        className="theme-english flex min-h-[70vh] flex-col justify-between bg-board px-6 py-10 text-board-foreground sm:px-10 sm:py-14"
      >
        <div>
          <p className="text-sm font-medium tracking-[0.16em] uppercase">尹健熙</p>
          <h1 className="mt-4 font-serif text-5xl leading-none font-semibold sm:text-6xl">
            English
          </h1>
          <p className="mt-4 max-w-md text-base leading-7">
            Reading Explorer 3, on the page: twelve units, Reading A and Reading B,
            with the book’s figures beside the questions.
          </p>
        </div>
        <p className="mt-10 text-sm font-medium tracking-[0.12em] uppercase">
          Enter English
        </p>
      </Link>
    </main>
  );
}
