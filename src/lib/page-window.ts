export function pageSlice<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): { page: number; pages: number; items: readonly T[] } {
  const size = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;
  return {
    page: current,
    pages,
    items: items.slice(start, start + size),
  };
}

/** Inclusive calendar-day filter. Empty bounds keep the row. */
export function withinDates(
  createdAt: string | null | undefined,
  from: string,
  to: string,
): boolean {
  if (from.length === 0 && to.length === 0) return true;
  if (createdAt === null || createdAt === undefined || createdAt.length === 0) {
    return false;
  }
  const day = createdAt.slice(0, 10);
  if (from.length > 0 && day < from) return false;
  if (to.length > 0 && day > to) return false;
  return true;
}
