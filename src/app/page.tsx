import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mathPaper } from "@/lib/papers/math";

const outline = [
  {
    title: "Section A · 10 questions",
    detail: "Directed numbers, equations, Pythagoras, significant figures, probability",
  },
  {
    title: "Section B · 10 questions",
    detail: "Absolute value, percentages, monomials, quadrants, averages",
  },
  {
    title: "Section C · 5 questions",
    detail: "Order of operations, fractions, linear equations, simplification",
  },
  {
    title: "Section D · 3 questions",
    detail: "Successive percentage change, meeting problem, angle bisector",
  },
  {
    title: "Section E · 2 questions",
    detail: "Extension word problems, not included in the 100 marks",
  },
];

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
            培侨数学课程
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            First paper: an S.1 diagnostic aligned with the Hong Kong DSE junior
            secondary mathematics syllabus. {mathPaper.totalMarks} marks,{" "}
            {mathPaper.durationMin} minutes. Students can sit it on screen or on
            paper. The mark scheme is on a separate page.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/paper" />}
          >
            Sit the paper
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/print" />}
          >
            Print blank paper
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/answers" />}
          >
            Mark scheme
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Paper outline</CardTitle>
            <CardDescription>
              Calculators are not allowed. Show working in Sections C and D.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {outline.map((item) => (
              <div key={item.title} className="rounded-lg border bg-card px-3 py-3">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">How to read the score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            {mathPaper.scoreBands.map((band) => (
              <p key={band.range}>
                <span className="font-medium">{band.range}　</span>
                {band.note}
              </p>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
