import type { ItemView } from "@/lib/progress-report";

export function ItemResults({ label, items }: { label: string; items: ItemView[] }) {
  if (!label || items.length === 0) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-medium text-primary">
        {label}
      </summary>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.key} className={item.ok ? "text-emerald-800" : "text-red-800"}>
            {item.label} — {item.ok ? "correct" : "incorrect"}
          </li>
        ))}
      </ul>
    </details>
  );
}
