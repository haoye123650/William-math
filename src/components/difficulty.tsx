const DIFFICULTY = {
  1: "Foundation",
  2: "Building",
  3: "Secure",
  4: "Stretch",
  5: "Exam standard",
} as const;

export function Difficulty({ stars }: { stars: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Difficulty
      </p>
      <p className="mt-0.5 text-sm font-medium">
        {DIFFICULTY[stars]}
        <span className="sr-only">, {stars} of 5</span>
      </p>
      <span className="mt-1.5 inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={
              index < stars
                ? "h-2 w-5 rounded-[2px] bg-mark"
                : "h-2 w-5 rounded-[2px] bg-border"
            }
          />
        ))}
      </span>
    </div>
  );
}
