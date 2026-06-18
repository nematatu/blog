type DatedEntry = {
  id: string;
  collection?: string;
  body?: string;
  data: {
    date: Date;
    draft?: boolean;
    pinned?: boolean;
    tags?: string[];
  };
};

export function compareByDateDesc<T extends DatedEntry>(a: T, b: T) {
  const byDate = b.data.date.valueOf() - a.data.date.valueOf();
  if (byDate !== 0) return byDate;

  return b.id.localeCompare(a.id, "en");
}

export function compareByPinnedThenDateDesc<T extends DatedEntry>(a: T, b: T) {
  const byPinned =
    Number(b.data.pinned ?? false) - Number(a.data.pinned ?? false);
  if (byPinned !== 0) return byPinned;

  return compareByDateDesc(a, b);
}

export function sortByDateDesc<T extends DatedEntry>(entries: T[]) {
  return [...entries].sort(compareByDateDesc);
}

export function sortByPinnedThenDateDesc<T extends DatedEntry>(entries: T[]) {
  return [...entries].sort(compareByPinnedThenDateDesc);
}

export function isVisibleEntry<T extends DatedEntry>(entry: T) {
  return import.meta.env.DEV || !entry.data.draft;
}

export function groupByYear<T extends DatedEntry>(entries: T[]) {
  return entries.reduce<Record<string, T[]>>((grouped, entry) => {
    const year = entry.data.date.getFullYear().toString();
    grouped[year] ??= [];
    grouped[year].push(entry);
    return grouped;
  }, {});
}

export function getYearsDesc(grouped: Record<string, unknown[]>) {
  return Object.keys(grouped).sort(
    (a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10),
  );
}
