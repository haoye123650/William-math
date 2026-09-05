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
  { title: "选择题 10 题", detail: "有理数、方程、勾股、科学记数法、概率" },
  { title: "填空题 10 题", detail: "绝对值、百分数、单项式、象限、统计量" },
  { title: "计算题 5 题", detail: "乘方顺序、分数四则、解方程、化简求值" },
  { title: "解答题 3 题", detail: "打折、相遇、三角形角平分线" },
  { title: "附加题 2 题", detail: "英文折扣与连续奇数，不计入学业分" },
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-[#f4efe6]">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-10 sm:py-14">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.28em] text-muted-foreground">
            七年级 · 2026–2027 学年
          </p>
          <h1 className="font-serif text-4xl leading-tight font-semibold">
            尹健熙
            <br />
            培侨数学课程
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground">
            第一份是摸底卷，按小学毕业该会的，加上七年级上学期开学内容来出。全卷 {mathPaper.totalMarks} 分，{mathPaper.durationMin} 分钟。学生可以在电脑上做，也可以打印。答案在单独一页。
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/paper" />}
          >
            学生在线作答
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/print" />}
          >
            打印空白卷
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="sm:flex-1"
            nativeButton={false}
            render={<Link href="/answers" />}
          >
            教师答案
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">卷面结构</CardTitle>
            <CardDescription>不可用计算器。解答题要写步骤。</CardDescription>
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
            <CardTitle className="font-serif">分数怎么看</CardTitle>
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
