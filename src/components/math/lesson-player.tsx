"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ItemResults } from "@/components/item-results";
import { JuniorShell } from "@/components/math/junior-shell";
import { answerFieldProps, choiceFieldName } from "@/lib/answer-field";
import { describeTopic } from "@/lib/progress-report";
import {
  displayPrompt,
  formatLevel,
  gradeItem,
  keyedAnswerLabel,
  questionCount,
  shownLevelTag,
} from "@/lib/math/junior/grade";
import {
  getServerTopicSnapshot,
  getTopicSnapshot,
  lessonFieldScope,
  lessonStorageKey,
  saveTopic,
  subscribeTopics,
} from "@/lib/math/junior/progress";
import type { JuniorAsset, JuniorBlock, JuniorItem, JuniorLesson } from "@/lib/math/junior/types";
import { cn } from "@/lib/utils";

const SECTION_LABEL: Record<string, string> = {
  warmup: "Warm-up",
  notes: "Key Ideas",
  "practice-l1": "Level 1",
  "practice-l2": "Level 2",
  challenge: "Challenge",
};

function sectionLabel(block: JuniorBlock) {
  if (SECTION_LABEL[block.id]) return SECTION_LABEL[block.id];
  if (block.title && !/[\u4e00-\u9fff]/.test(block.title)) return block.title;
  return "Section";
}

function safeNotesHtml(html: string) {
  const kept = html.replace(/<(?!\/?(?:p|strong|em|br|sup|sub)\b)[^>]*>/gi, "");
  return kept.replace(/<(p|strong|em|br|sup|sub)\b[^>]*>/gi, "<$1>");
}

function publicSrc(src: string) {
  if (/^https?:\/\//.test(src)) return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}

function figuresFor(item: JuniorItem, assets: Map<string, JuniorAsset>) {
  return (item.assetIds ?? [])
    .map((id) => assets.get(id))
    .filter((asset): asset is JuniorAsset => Boolean(asset?.src));
}

function FigureList({ assets }: { assets: JuniorAsset[] }) {
  if (assets.length === 0) return null;
  return (
    <div className="space-y-3">
      {assets.map((asset) => (
        <figure key={asset.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Lesson figures are static files. next/image is unnecessary for the Pages export. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicSrc(asset.src ?? "")}
            alt={asset.alt || asset.caption || "Figure"}
            className="max-h-[50vh] w-full object-contain"
          />
          {asset.caption ? (
            <figcaption className="px-3 py-2 text-sm leading-6 text-muted-foreground">
              {asset.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function ItemPractice({
  scope,
  item,
  number,
  assets,
  value,
  checked,
  onChange,
  onCheck,
}: {
  scope: string;
  item: JuniorItem;
  number: number;
  assets: Map<string, JuniorAsset>;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  onCheck: () => void;
}) {
  const tag = shownLevelTag(item);
  const prompt = displayPrompt(item);
  const figures = figuresFor(item, assets);
  const beside = item.imagePlacement === "beside" && figures.length > 0;
  const result = checked ? gradeItem(item, value) : null;
  const canCheck = value.trim().length > 0 && gradeItem(item, value) !== null;

  return (
    <article
      id={`item-${item.id}`}
      className={cn(
        "scroll-mt-24 border-b border-border py-5 last:border-b-0",
        result === true && "border-l-[3px] border-l-emerald-800 bg-emerald-50/80 pr-3 pl-3",
        result === false && "border-l-[3px] border-l-red-800 bg-red-50/80 pr-3 pl-3",
      )}
    >
      <div className={cn(beside && "grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]")}>
        <div className="min-w-0 space-y-3">
          {!beside && figures.length > 0 ? <FigureList assets={figures} /> : null}
          <div className="flex items-start gap-3">
            <span className="w-8 shrink-0 pt-0.5 text-right font-serif text-lg font-semibold tabular-nums">
              {number}.
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-base leading-7 text-pretty">{prompt}</p>
                {tag ? (
                  <Badge variant="secondary" className="mt-1">
                    [{tag}]
                  </Badge>
                ) : null}
              </div>
              <ItemControl scope={scope} item={item} value={value} onChange={onChange} />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" size="lg" className="h-10 px-4" onClick={onCheck} disabled={!canCheck}>
                  Check
                </Button>
                {result === true ? (
                  <span className="text-sm font-medium text-emerald-800" role="status">
                    Correct
                  </span>
                ) : null}
                {result === false ? (
                  <span className="text-sm font-medium text-red-800" role="status">
                    Incorrect
                  </span>
                ) : null}
              </div>
              {checked && result !== null ? (
                <div className="space-y-2 text-sm leading-6">
                  <p>
                    <span className="font-medium">Answer: </span>
                    {keyedAnswerLabel(item)}
                  </p>
                  {item.solution ? (
                    <p>
                      <span className="font-medium">Solution: </span>
                      {item.solution}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {beside ? <FigureList assets={figures} /> : null}
      </div>
    </article>
  );
}

function ItemControl({
  scope,
  item,
  value,
  onChange,
}: {
  scope: string;
  item: JuniorItem;
  value: string;
  onChange: (value: string) => void;
}) {
  if (item.interaction === "multiple-choice") {
    return (
      <fieldset className="space-y-2">
        <legend className="sr-only">Choices</legend>
        {(item.choices ?? []).map((choice) => (
          <label
            key={choice.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2",
              value === choice.id && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name={choiceFieldName(scope, item.id)}
              value={choice.id}
              checked={value === choice.id}
              onChange={() => onChange(choice.id)}
              autoComplete="off"
              className="mt-1"
            />
            <span className="font-semibold">{choice.id}</span>
            <span className="leading-6">{choice.text}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (item.interaction === "true-false") {
    const options = [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ];
    return (
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">True or false</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2",
              value === option.id && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name={choiceFieldName(scope, item.id)}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              autoComplete="off"
            />
            <span>{option.text}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (item.interaction === "short-text") {
    return (
      <Textarea
      {...answerFieldProps(scope, item.id)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Answer"
      rows={2}
    />
    );
  }

  return (
    <Input
      {...answerFieldProps(scope, item.id)}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Answer"
    />
  );
}

function Notes({ block }: { block: JuniorBlock }) {
  return (
    <div className="space-y-3 text-base leading-7">
      {(block.paragraphs ?? []).map((paragraph) => (
        <div
          key={paragraph.id}
          className="[&_p]:leading-7 [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: safeNotesHtml(paragraph.html) }}
        />
      ))}
    </div>
  );
}

function checkedItems(lesson: JuniorLesson, answers: Record<string, string>, checked: string[]) {
  const done = new Set(checked);
  const items: { key: string; label: string; ok: boolean }[] = [];
  let total = 0;
  for (const block of lesson.blocks) {
    const section = sectionLabel(block);
    (block.items ?? []).forEach((item, index) => {
      total += 1;
      if (!done.has(item.id)) return;
      const ok = gradeItem(item, answers[item.id]);
      if (ok === null) return;
      items.push({ key: item.id, label: `${section} ${index + 1}`, ok });
    });
  }
  return { total, items };
}

export function LessonPractice({ lesson }: { lesson: JuniorLesson }) {
  const assets = useMemo(
    () => new Map((lesson.assets ?? []).map((asset) => [asset.id, asset])),
    [lesson.assets],
  );
  const storageKey = lessonStorageKey(lesson);
  const fieldScope = lessonFieldScope(lesson);
  const saved = useSyncExternalStore(
    subscribeTopics,
    () => getTopicSnapshot(storageKey),
    getServerTopicSnapshot,
  );
  const progress = describeTopic(
    { key: storageKey, title: lesson.titleEn, href: `/math/junior/${storageKey}` },
    saved.updatedAt === 0 ? null : saved,
  );

  function commit(answers: Record<string, string>, checked: string[]) {
    const { total, items } = checkedItems(lesson, answers, checked);
    saveTopic(storageKey, { answers, checked, total, items });
  }

  function setAnswer(id: string, value: string) {
    commit(
      { ...saved.answers, [id]: value },
      saved.checked.filter((itemId) => itemId !== id),
    );
  }

  return (
    <JuniorShell
      crumb={
        <nav aria-label="Breadcrumb">
          <Link href="/math" className="underline-offset-4 hover:underline">
            Mathematics
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href="/math/junior" className="underline-offset-4 hover:underline">
            Practice by topic
          </Link>
          <span aria-hidden="true"> / </span>
          <span className="text-foreground">{lesson.titleEn}</span>
        </nav>
      }
    >
      <div className="border-b border-border bg-card">
        <nav
          aria-label="Sections"
          className="mx-auto flex w-full max-w-3xl gap-4 overflow-x-auto px-5 py-3 text-sm"
        >
          {lesson.blocks.map((block) => (
            <a
              key={block.id}
              href={`#${block.id}`}
              className="shrink-0 font-medium text-primary underline-offset-4 hover:underline"
            >
              {sectionLabel(block)}
            </a>
          ))}
        </nav>
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-5 py-8">
        <header>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
            {formatLevel(lesson.level)} · {questionCount(lesson)} questions
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">{lesson.titleEn}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Work through the warm-up, key ideas, two practice levels, and the challenge.
            Check compares your answer with the key. Spacing is ignored. A different form
            counts only when the question lists it.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/math/junior" className="font-medium text-primary underline-offset-4 hover:underline">
              All topics
            </Link>
          </p>
          {progress ? (
            <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-3">
              <p className="text-sm font-medium leading-6">{progress.statusLine}</p>
              <ItemResults label={progress.itemsLabel} items={progress.items} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Not started.</p>
          )}
        </header>
        {lesson.blocks.map((block) => (
          <section key={block.id} id={block.id} aria-labelledby={`${block.id}-title`} className="scroll-mt-16">
            <h2 id={`${block.id}-title`} className="border-b border-border pb-2 font-serif text-2xl font-semibold">
              {sectionLabel(block)}
            </h2>
            {block.kind === "passage" ? (
              <div className="pt-4">
                <Notes block={block} />
              </div>
            ) : (
              <div>
                {(block.items ?? []).map((item, index) => (
                  <ItemPractice
                    key={item.id}
                    scope={fieldScope}
                    item={item}
                    number={index + 1}
                    assets={assets}
                    value={saved.answers[item.id] ?? ""}
                    checked={saved.checked.includes(item.id)}
                    onChange={(value) => setAnswer(item.id, value)}
                    onCheck={() => {
                      if (saved.checked.includes(item.id)) return;
                      commit(saved.answers, [...saved.checked, item.id]);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </JuniorShell>
  );
}
