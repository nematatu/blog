type DatedEntry = {
  id: string;
  data: {
    date: Date;
    draft?: boolean;
    pinned?: boolean;
  };
};

export function compareByDateDesc<T extends DatedEntry>(a: T, b: T) {
  return (
    b.data.date.valueOf() - a.data.date.valueOf() ||
    b.id.localeCompare(a.id, "en")
  );
}

export function compareByPinnedThenDateDesc<T extends DatedEntry>(a: T, b: T) {
  return (
    Number(b.data.pinned ?? false) - Number(a.data.pinned ?? false) ||
    compareByDateDesc(a, b)
  );
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
