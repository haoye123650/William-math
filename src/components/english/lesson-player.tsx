"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Asset, Block, Item, Lesson } from "@/lib/english/types";
import { lessonKey } from "@/lib/english/content";
import { saveLesson, useLessonProgress } from "@/lib/english/progress";
import { EnglishShell } from "@/components/english/shell";
import { Button } from "@/components/ui/button";

function blockLabel(block: Block) {
  if (block.kind === "passage" || block.id === "reading") return "Reading";
  if (block.kind === "infographic") return "Figure";
  if (block.id === "warmup" || block.kind === "warmup") return "Warm-up";
  if (block.id === "before-you-read") return "Before you read";
  if (block.id === "reading-comprehension") return "Comprehension";
  if (block.id === "reading-skill" || block.kind === "skill") return "Reading skill";
  if (block.id === "vocabulary") return "Vocabulary";
  if (block.id === "critical-thinking" || block.kind === "discuss") return "Critical thinking";
  return block.title || "Section";
}

function assetMap(lesson: Lesson) {
  return new Map(lesson.assets.map((asset) => [asset.id, asset]));
}

function orderedChoices(item: Item) {
  const choices = item.choices ?? [];
  if (choices.every((choice) => ["T", "F", "NG"].includes(choice.id))) return choices;
  return [...choices].sort((a, b) => a.id.localeCompare(b.id));
}

function expected(item: Item): string | string[] | null {
  if (item.answer == null) return null;
  if (typeof item.answer === "boolean") return item.answer ? "T" : "F";
  return item.answer;
}

function isCorrect(item: Item, value: string | string[] | undefined): boolean | null {
  const key = expected(item);
  if (key == null || value == null) return null;
  const got = Array.isArray(value) ? value : [value];
  if (item.interaction === "matching" || item.interaction === "completion") {
    const exp = Array.isArray(key) ? key : [key];
    return exp.length === got.length && exp.every((part, index) => part.toLowerCase() === (got[index] ?? "").toLowerCase());
  }
  if (item.multi || Array.isArray(key)) {
    const exp = (Array.isArray(key) ? key : [key]).map((part) => part.toLowerCase()).sort();
    const have = got.map((part) => part.toLowerCase()).sort();
    return exp.join("|") === have.join("|");
  }
  return key.toLowerCase() === (got[0] ?? "").toLowerCase();
}

function publicSrc(src: string) {
  const path = src.startsWith("/") ? src : `/${src}`;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}

function BookFigure({
  asset,
  compact,
}: {
  asset: Asset;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const src = publicSrc(asset.src);
  return (
    <figure className="space-y-2">
      <button
        type="button"
        className={`block w-full overflow-hidden rounded-lg border border-border bg-card ${compact ? "max-h-[50vh]" : ""}`}
        onClick={() => setOpen(true)}
      >
        {/* Book figures are extracted JPEGs; next/image is unnecessary for static export. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={asset.alt || asset.caption || "Figure from the student book"}
          className={`w-full object-contain ${compact ? "max-h-[50vh]" : "max-h-[70vh]"}`}
        />
      </button>
      {asset.caption ? (
        <figcaption className="text-sm leading-6 text-muted-foreground">{asset.caption}</figcaption>
      ) : null}
      <button type="button" className="text-xs font-medium text-primary underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        Enlarge figure
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0" aria-label="Close figure" onClick={() => setOpen(false)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={asset.alt || "Figure from the student book"} className="relative max-h-[92vh] max-w-full object-contain" />
        </div>
      ) : null}
    </figure>
  );
}

function figuresFor(block: Block, assets: Map<string, Asset>, position?: string) {
  const refs = block.figures ?? [];
  return refs
    .filter((figure) => (position ? figure.position === position : true))
    .map((figure) => assets.get(figure.assetId))
    .filter((asset): asset is Asset => Boolean(asset));
}

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const key = lessonKey(lesson.unit, lesson.lessonId);
  const progress = useLessonProgress(key);
  const assets = useMemo(() => assetMap(lesson), [lesson]);
  const blocks = lesson.blocks;
  const savedBlock = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("re3-progress", onChange);
      return () => window.removeEventListener("re3-progress", onChange);
    },
    () => {
      try {
        const raw = localStorage.getItem("re3:progress");
        const store = raw ? (JSON.parse(raw) as Record<string, { lastBlock?: string }>) : {};
        return store[key]?.lastBlock ?? null;
      } catch {
        return null;
      }
    },
    () => null,
  );
  const [chosen, setChosen] = useState<string | null>(null);
  const blockId =
    chosen ??
    (savedBlock && blocks.some((entry) => entry.id === savedBlock) ? savedBlock : blocks[0]?.id ?? "reading");
  const [jumpId, setJumpId] = useState<string | null>(null);
  const [railItemId, setRailItemId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!jumpId) return;
    const timer = window.setTimeout(() => {
      const element = document.getElementById(jumpId);
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("jump-flash");
      window.setTimeout(() => element.classList.remove("jump-flash"), 1600);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [jumpId, blockId]);

  const block = blocks.find((entry) => entry.id === blockId) ?? blocks[0];
  const index = Math.max(0, blocks.findIndex((entry) => entry.id === block?.id));

  function remember(nextId: string) {
    setChosen(nextId);
    setRailItemId(null);
    saveLesson(key, { lastBlock: nextId });
  }

  function showParagraph(paragraphId: string) {
    const reading = blocks.find((entry) => entry.kind === "passage");
    if (reading) setChosen(reading.id);
    setJumpId(`p-${paragraphId}`);
    saveLesson(key, { lastBlock: reading?.id ?? blockId });
  }

  function showItem(itemId: string) {
    const host = blocks.find((entry) => entry.items?.some((item) => item.id === itemId));
    if (window.matchMedia("(min-width: 1024px)").matches && block?.kind === "passage") {
      setRailItemId(itemId);
      setJumpId(`item-${itemId}`);
      return;
    }
    if (host) {
      setChosen(host.id);
      saveLesson(key, { lastBlock: host.id });
    }
    setJumpId(`item-${itemId}`);
  }

  function answerOf(itemId: string) {
    return progress.answers[itemId];
  }

  function setAnswer(itemId: string, value: string | string[]) {
    saveLesson(key, { answers: { ...progress.answers, [itemId]: value } });
  }

  function toggleDone() {
    if (!block) return;
    const has = progress.blocksDone.includes(block.id);
    const blocksDone = has
      ? progress.blocksDone.filter((id) => id !== block.id)
      : [...progress.blocksDone, block.id];
    saveLesson(key, { blocksDone });
  }

  const railItem = railItemId
    ? blocks.flatMap((entry) => entry.items ?? []).find((item) => item.id === railItemId)
    : undefined;

  return (
    <EnglishShell
      crumb={
        <>
          <Link className="hover:underline" href="/english/re3">
            Units
          </Link>
          <span> / </span>
          <Link className="hover:underline" href={`/english/re3/unit/${lesson.unit}`}>
            Unit {lesson.unit}
          </Link>
          <span> / Reading {lesson.lessonId.toUpperCase()}</span>
        </>
      }
    >
      <div className="sticky top-0 z-30 border-b border-border bg-sheet/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-2.5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                Unit {lesson.unit} · Reading {lesson.lessonId.toUpperCase()}
              </p>
              <h1 className="truncate font-serif text-xl font-semibold">{lesson.title}</h1>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {progress.blocksDone.length}/{blocks.length} done
            </p>
          </div>
          <nav aria-label="Lesson sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {blocks.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => remember(entry.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                  entry.id === block?.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card"
                }`}
              >
                {blockLabel(entry)}
                {progress.blocksDone.includes(entry.id) ? " ✓" : ""}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 space-y-5">
          {block ? (
            <BlockView
              block={block}
              assets={assets}
              answers={progress.answers}
              checked={checked}
              onAnswer={setAnswer}
              onCheck={(itemId) => setChecked((prev) => ({ ...prev, [itemId]: true }))}
              onShowParagraph={showParagraph}
              onShowItem={showItem}
            />
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" disabled={index <= 0} onClick={() => remember(blocks[index - 1].id)}>
              Previous
            </Button>
            <Button type="button" variant="secondary" onClick={toggleDone}>
              {block && progress.blocksDone.includes(block.id) ? "Section done" : "Mark section done"}
            </Button>
            <Button
              type="button"
              disabled={index >= blocks.length - 1}
              onClick={() => remember(blocks[index + 1].id)}
            >
              Next
            </Button>
          </div>
        </main>
        <aside className="hidden lg:block">
          <div className="sticky top-36 space-y-3">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Related practice</p>
            {railItem ? (
              <ItemCard
                item={railItem}
                assets={assets}
                value={answerOf(railItem.id)}
                checked={Boolean(checked[railItem.id])}
                onAnswer={(value) => setAnswer(railItem.id, value)}
                onCheck={() => setChecked((prev) => ({ ...prev, [railItem.id]: true }))}
                onShowParagraph={showParagraph}
              />
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Choose “Related” beside a paragraph to open that question here, next to the passage.
              </p>
            )}
          </div>
        </aside>
      </div>
    </EnglishShell>
  );
}

function BlockView({
  block,
  assets,
  answers,
  checked,
  onAnswer,
  onCheck,
  onShowParagraph,
  onShowItem,
}: {
  block: Block;
  assets: Map<string, Asset>;
  answers: Record<string, string | string[]>;
  checked: Record<string, boolean>;
  onAnswer: (id: string, value: string | string[]) => void;
  onCheck: (id: string) => void;
  onShowParagraph: (paragraphId: string) => void;
  onShowItem: (itemId: string) => void;
}) {
  const heroes = [
    ...figuresFor(block, assets),
    ...(block.assetId ? [assets.get(block.assetId)] : []),
    ...(block.assetIds ?? []).map((id) => assets.get(id)),
  ].filter((asset): asset is Asset => Boolean(asset));
  const usedByItems = new Set((block.items ?? []).flatMap((item) => item.assetIds ?? []));
  const blockFigures = heroes.filter((asset) => !usedByItems.has(asset.id));

  if (block.kind === "passage") {
    return (
      <article className="space-y-6">
        <header>
          <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Reading</p>
          <h2 className="font-serif text-3xl font-semibold">{block.title}</h2>
        </header>
        {(block.paragraphs ?? []).map((paragraph) => (
          <div key={paragraph.id} id={`p-${paragraph.id}`} className="scroll-mt-36 rounded-xl border border-border bg-card p-4 sm:p-5">
            {figuresFor(block, assets, `before-${paragraph.id}`).map((asset) => (
              <div key={asset.id} className="mb-4">
                <BookFigure asset={asset} />
              </div>
            ))}
            {paragraph.heading ? <h3 className="mb-2 font-serif text-xl font-semibold">{paragraph.heading}</h3> : null}
            <div className="flex gap-3">
              <p className="font-serif text-2xl leading-none font-semibold text-primary" aria-hidden="true">
                {paragraph.id}
              </p>
              <div
                className="passage-html min-w-0 text-[1.05rem] leading-8"
                dangerouslySetInnerHTML={{ __html: paragraph.html }}
              />
            </div>
            {figuresFor(block, assets, `after-${paragraph.id}`).map((asset) => (
              <div key={asset.id} className="mt-4">
                <BookFigure asset={asset} />
              </div>
            ))}
            {paragraph.relatedItemIds && paragraph.relatedItemIds.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {paragraph.relatedItemIds.map((itemId) => (
                  <button
                    key={itemId}
                    type="button"
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium"
                    onClick={() => onShowItem(itemId)}
                  >
                    Related · {itemId}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {block.glossary && block.glossary.length > 0 ? (
          <section>
            <h3 className="font-serif text-xl font-semibold">Glossary</h3>
            <ul className="mt-2 space-y-2">
              {block.glossary.map((entry) => (
                <li key={`${entry.term}-${entry.anchorParagraphId}`} className="text-sm leading-6">
                  <button
                    type="button"
                    className="font-semibold text-primary"
                    onClick={() => entry.anchorParagraphId && onShowParagraph(entry.anchorParagraphId)}
                  >
                    {entry.term}
                  </button>
                  <span className="text-muted-foreground"> — {entry.def}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{blockLabel(block)}</p>
        {block.title ? <h2 className="font-serif text-3xl font-semibold">{block.title}</h2> : null}
      </header>
      {block.kind === "infographic" || blockFigures.length > 0 ? (
        <div className="space-y-4">
          {blockFigures.map((asset) => (
            <BookFigure key={asset.id} asset={asset} />
          ))}
        </div>
      ) : null}
      {block.html ? <p className="text-base leading-7">{block.html}</p> : null}
      <ItemList
        items={block.items ?? []}
        assets={assets}
        answers={answers}
        checked={checked}
        onAnswer={onAnswer}
        onCheck={onCheck}
        onShowParagraph={onShowParagraph}
      />
    </section>
  );
}

function ItemList(props: {
  items: Item[];
  assets: Map<string, Asset>;
  answers: Record<string, string | string[]>;
  checked: Record<string, boolean>;
  onAnswer: (id: string, value: string | string[]) => void;
  onCheck: (id: string) => void;
  onShowParagraph: (paragraphId: string) => void;
}) {
  const groups: { key: string; label?: string; prompt?: string; items: Item[] }[] = [];
  for (const item of props.items) {
    const key = `${item.group ?? ""}|${item.groupPrompt ?? ""}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: item.groupLabel, prompt: item.groupPrompt, items: [item] });
  }
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key} className="space-y-3">
          {group.label ? (
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">{group.label}</p>
          ) : null}
          {group.prompt && group.items.some((item) => item.prompt !== group.prompt) ? (
            <p className="text-sm leading-6">{group.prompt}</p>
          ) : null}
          {group.items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              assets={props.assets}
              value={props.answers[item.id]}
              checked={Boolean(props.checked[item.id])}
              onAnswer={(value) => props.onAnswer(item.id, value)}
              onCheck={() => props.onCheck(item.id)}
              onShowParagraph={props.onShowParagraph}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ItemCard({
  item,
  assets,
  value,
  checked,
  onAnswer,
  onCheck,
  onShowParagraph,
}: {
  item: Item;
  assets: Map<string, Asset>;
  value: string | string[] | undefined;
  checked: boolean;
  onAnswer: (value: string | string[]) => void;
  onCheck: () => void;
  onShowParagraph: (paragraphId: string) => void;
}) {
  const images = (item.assetIds ?? [])
    .map((id) => assets.get(id))
    .filter((asset): asset is Asset => Boolean(asset));
  const beside = item.imagePlacement === "beside" && images.length > 0;
  const verdict = checked ? isCorrect(item, value) : null;
  const graded = expected(item) != null && item.interaction !== "short-text";

  return (
    <article
      id={`item-${item.id}`}
      className={`scroll-mt-36 rounded-xl border border-border bg-card p-4 ${
        beside ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4" : ""
      }`}
    >
      {images.length > 0 ? (
        <div className={beside ? "" : "mb-3"}>
          {images.map((asset) => (
            <BookFigure key={asset.id} asset={asset} compact />
          ))}
        </div>
      ) : null}
      <div>
        {item.skill ? <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{item.skill}</p> : null}
        <ItemPrompt item={item} value={value} onAnswer={onAnswer} />
        {item.paragraphIds && item.paragraphIds.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.paragraphIds.map((paragraphId) => (
              <button
                key={paragraphId}
                type="button"
                className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => onShowParagraph(paragraphId)}
              >
                Show paragraph {paragraphId}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {graded ? (
            <Button type="button" size="sm" onClick={onCheck}>
              Check
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={onCheck}>
              Save draft
            </Button>
          )}
          {verdict === true ? <span className="text-sm font-medium text-primary">Correct</span> : null}
          {verdict === false ? (
            <span className="text-sm font-medium text-destructive">
              Not quite. Answer: {Array.isArray(expected(item)) ? (expected(item) as string[]).join(", ") : expected(item)}
            </span>
          ) : null}
          {checked && verdict === null ? <span className="text-sm text-muted-foreground">Saved on this device.</span> : null}
        </div>
      </div>
    </article>
  );
}

function ItemPrompt({
  item,
  value,
  onAnswer,
}: {
  item: Item;
  value: string | string[] | undefined;
  onAnswer: (value: string | string[]) => void;
}) {
  if (item.interaction === "matching" && item.pairs) {
    const current = Array.isArray(value) ? value : item.pairs.map(() => "");
    return (
      <div className="space-y-2">
        <p className="text-sm leading-6">{item.prompt}</p>
        {item.pairs.map((pair, index) => (
          <label key={pair.id} className="grid gap-1 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
            <span>{pair.id}. {pair.text.replace(/[•·]\s*$/, "")}</span>
            <select
              className="h-9 rounded-md border border-input bg-card px-2"
              value={current[index] ?? ""}
              onChange={(event) => {
                const next = [...current];
                next[index] = event.target.value;
                onAnswer(next);
              }}
            >
              <option value="">Choose</option>
              {orderedChoices(item).map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.id}. {choice.text}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  if (item.interaction === "completion" && item.blanks) {
    const current = Array.isArray(value) ? value : item.blanks.map(() => "");
    const parts = item.prompt.split(/\[\[(\d+)\]\]/);
    return (
      <p className="text-sm leading-7">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            const blankIndex = Number(part);
            const blank = item.blanks?.[blankIndex];
            return (
              <select
                key={index}
                className="mx-1 h-8 rounded-md border border-input bg-card px-1"
                value={current[blankIndex] ?? ""}
                onChange={(event) => {
                  const next = [...current];
                  next[blankIndex] = event.target.value;
                  onAnswer(next);
                }}
              >
                <option value="">…</option>
                {blank?.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            );
          }
          return <span key={index}>{part.replace(/(\d)\s*$/, "")}</span>;
        })}
      </p>
    );
  }

  if (item.interaction === "fill-blank") {
    const text = typeof value === "string" ? value : "";
    return (
      <label className="block space-y-2 text-sm leading-6">
        <span>{item.prompt}</span>
        {item.bank ? (
          <select
            className="h-9 rounded-md border border-input bg-card px-2"
            value={text}
            onChange={(event) => onAnswer(event.target.value)}
          >
            <option value="">Choose a word</option>
            {item.bank.map((word) => (
              <option key={word} value={word}>
                {word}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="h-9 w-full rounded-md border border-input bg-card px-2"
            value={text}
            onChange={(event) => onAnswer(event.target.value)}
          />
        )}
      </label>
    );
  }

  if (item.interaction === "true-false" || (item.choices && item.choices.length > 0 && !item.multi)) {
    const choices = item.interaction === "true-false" && !(item.choices && item.choices.length)
      ? [
          { id: "T", text: "True" },
          { id: "F", text: "False" },
        ]
      : orderedChoices(item);
    const selected = typeof value === "string" ? value : "";
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm leading-6">{item.prompt}</legend>
        {choices.map((choice) => (
          <label key={choice.id} className="flex items-start gap-2 text-sm leading-6">
            <input
              type="radio"
              name={item.id}
              className="mt-1"
              checked={selected === choice.id}
              onChange={() => onAnswer(choice.id)}
            />
            <span>
              <span className="font-semibold">{choice.id}.</span> {choice.text}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (item.multi && item.choices) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="space-y-2">
        <legend className="text-sm leading-6">{item.prompt}</legend>
        {orderedChoices(item).map((choice) => (
          <label key={choice.id} className="flex items-start gap-2 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1"
              checked={selected.includes(choice.id)}
              onChange={() => {
                const next = selected.includes(choice.id)
                  ? selected.filter((id) => id !== choice.id)
                  : [...selected, choice.id];
                onAnswer(next);
              }}
            />
            <span>
              <span className="font-semibold">{choice.id}.</span> {choice.text}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  const text = typeof value === "string" ? value : "";
  return (
    <label className="block space-y-2 text-sm leading-6">
      <span>{item.prompt}</span>
      <textarea
        className="min-h-24 w-full rounded-md border border-input bg-card px-2 py-1.5"
        value={text}
        onChange={(event) => onAnswer(event.target.value)}
      />
    </label>
  );
}
