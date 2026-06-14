type DatedEntry = {
  id: string;
  data: {
    date: Date;
  };
};

export function compareByDateDesc<T extends DatedEntry>(a: T, b: T) {
  const byDate = b.data.date.valueOf() - a.data.date.valueOf();
  if (byDate !== 0) return byDate;

  return b.id.localeCompare(a.id, "en");
}

export function sortByDateDesc<T extends DatedEntry>(entries: T[]) {
  return entries.sort(compareByDateDesc);
}
