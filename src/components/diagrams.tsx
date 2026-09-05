export function TriangleDiagram() {
  return (
    <svg
      viewBox="0 0 360 240"
      className="mx-auto h-auto w-full max-w-sm text-foreground"
      role="img"
      aria-label="Triangle ABC with D on BC and AD the angle bisector"
    >
      <polygon
        points="180,28 40,210 320,210"
        fill="oklch(0.97 0.02 80)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line x1="180" y1="28" x2="150" y2="210" stroke="currentColor" strokeWidth="2" />
      <text x="180" y="18" textAnchor="middle" className="fill-current text-sm font-semibold">
        A
      </text>
      <text x="24" y="224" className="fill-current text-sm font-semibold">
        B
      </text>
      <text x="326" y="224" className="fill-current text-sm font-semibold">
        C
      </text>
      <text x="142" y="230" textAnchor="middle" className="fill-current text-sm font-semibold">
        D
      </text>
      <text x="86" y="150" className="fill-current text-xs">
        50°
      </text>
      <text x="248" y="150" className="fill-current text-xs">
        70°
      </text>
    </svg>
  );
}
