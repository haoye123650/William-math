export function normalizeAnswer(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[−–—﹣]/g, "-")
    .replace(/[／∕]/g, "/")
    .replace(/[×xX]/g, "*")
    .replace(/°/g, "")
    .replace(/厘米|cm/gi, "")
    .replace(/元|\$/g, "")
    .toLowerCase();
}

export function matchesAnswer(value: string, accepted: string[]) {
  const got = normalizeAnswer(value);
  if (!got) return false;
  return accepted.some((item) => normalizeAnswer(item) === got);
}
