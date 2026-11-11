import Link from "next/link";
import { TopicStatus } from "@/components/math/topic-status";
import { Button } from "@/components/ui/button";
import { topicGroups, topicHref } from "@/lib/math/junior/content";

export function TopicIndex() {
  const groups = topicGroups();

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`${group.id}-topics-title`} className="space-y-3">
          <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                {group.kicker}
              </p>
              <h2 id={`${group.id}-topics-title`} className="font-serif text-2xl font-semibold">
                {group.title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {group.topics.length} lessons
            </p>
          </div>
          <div className="space-y-4">
            {group.topics.map((topic, index) => (
              <article
                key={`${topic.year}-${topic.slug}`}
                aria-labelledby={`topic-${topic.slug}-title`}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex gap-4 p-4 sm:p-5">
                  <p
                    className="hidden w-12 shrink-0 pt-0.5 font-serif text-3xl leading-none font-semibold text-primary tabular-nums sm:block"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div className="min-w-0 flex-1">
                    <h3
                      id={`topic-${topic.slug}-title`}
                      className="font-serif text-xl leading-snug font-semibold"
                    >
                      <span className="mr-2 font-semibold text-primary tabular-nums sm:hidden">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {topic.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {topic.levelLabel} · {topic.questions} questions
                    </p>
                    <TopicStatus
                      topicKey={`${topic.year}/${topic.slug}`}
                      title={topic.title}
                      href={topicHref(topic.year, topic.slug)}
                    />
                  </div>
                </div>
                <div className="border-t border-border bg-muted/45 p-3 sm:px-5">
                  <Button
                    size="lg"
                    className="h-11 px-4"
                    nativeButton={false}
                    render={<Link href={topicHref(topic.year, topic.slug)} />}
                  >
                    Open
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
