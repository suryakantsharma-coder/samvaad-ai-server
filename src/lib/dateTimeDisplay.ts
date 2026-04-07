/**
 * Consistent 12-hour clock display (en-US) across the app.
 */

export function formatTime12h(
  input: string | number | Date | undefined | null,
): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Date + time on one line, 12-hour clock. */
export function formatDateTime12h(
  input: string | number | Date | undefined | null,
): string {
  if (input == null || input === "") return "—";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** `HH:mm` or `H:mm` (24h) → 12h label; passthrough if not matched. */
export function formatHmClock12h(hm: string | undefined | null): string {
  if (hm == null || hm === "") return "—";
  const m = hm.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hm;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return hm;
  const d = new Date(2000, 0, 1, h, min, 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
