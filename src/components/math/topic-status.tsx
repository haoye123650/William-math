"use client";

import { useSyncExternalStore } from "react";
import { ItemResults } from "@/components/item-results";
import { peekTopic, subscribeTopics } from "@/lib/math/junior/progress";
import { describeTopic } from "@/lib/progress-report";

const LABEL = {
  "not-started": "Not started",
  "in-progress": "In progress",
  done: "Completed",
} as const;

const CLASS_NAME = {
  "not-started": "bg-muted text-muted-foreground",
  "in-progress": "bg-amber-100 text-amber-950",
  done: "bg-primary/15 text-primary",
} as const;

export function TopicStatus({
  topicKey,
  title,
  href,
}: {
  topicKey: string;
  title: string;
  href: string;
}) {
  const record = useSyncExternalStore(
    subscribeTopics,
    () => peekTopic(topicKey),
    () => null,
  );
  const view = describeTopic({ key: topicKey, title, href }, record);
  const state = view?.state ?? "not-started";

  return (
    <div className="mt-2">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS_NAME[state]}`}
      >
        {LABEL[state]}
      </span>
      {view ? (
        <>
          <p className="mt-2 text-sm leading-6">{view.statusLine}</p>
          <ItemResults label={view.itemsLabel} items={view.items} />
        </>
      ) : null}
    </div>
  );
}
