type DatedEntry = {
  id: string;
  data: {
    date: Date;
    pinned?: boolean;
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
  return entries.sort(compareByDateDesc);
}

export function sortByPinnedThenDateDesc<T extends DatedEntry>(entries: T[]) {
  return entries.sort(compareByPinnedThenDateDesc);
}
