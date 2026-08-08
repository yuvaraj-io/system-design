/** Parse ps `etime` values like 45, 05:23, 1:05:23, or 2-03:05:23 into seconds */
export function parseEtimeToSeconds(etime: string): number {
  const value = etime.trim();
  if (!value) return 0;

  if (value.includes("-")) {
    const [days, time] = value.split("-");
    return Number(days) * 86_400 + parseClockToSeconds(time);
  }

  return parseClockToSeconds(value);
}

function parseClockToSeconds(clock: string): number {
  const parts = clock.split(":").map(Number);

  if (parts.length === 3) {
    return parts[0] * 3_600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return Number(parts[0] ?? 0);
}

export function kilobytesToBytes(kb: number): number {
  return Math.round(kb * 1024);
}

export function estimateStartTime(uptimeSeconds: number, now = Date.now()): string {
  return new Date(now - uptimeSeconds * 1000).toISOString();
}
