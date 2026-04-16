/** Local calendar date as YYYY-MM-DD (no timezone shift). */
export function toYMDLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** First and last day of the current month in local time (`from` / `to`). */
export function currentMonthFromToYmd(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  const start = new Date(y, mo, 1);
  const end = new Date(y, mo + 1, 0);
  return { from: toYMDLocal(start), to: toYMDLocal(end) };
}

/** Same range as {@link currentMonthFromToYmd} with `start` / `end` keys. */
export function currentMonthStartEndYmd(): { start: string; end: string } {
  const { from, to } = currentMonthFromToYmd();
  return { start: from, end: to };
}
