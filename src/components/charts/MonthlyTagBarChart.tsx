type Props = {
  data: Array<Record<string, number | string>>;
  tags: string[];
};

const palette = [
  "hsl(217, 91%, 60%)",
  "hsl(217, 91%, 75%)",
  "hsl(199, 89%, 60%)",
  "hsl(199, 89%, 70%)",
  "hsl(215, 16%, 70%)",
];

const getColor = (index: number, tag: string) =>
  tag === "その他" ? "hsl(215, 16%, 65%)" : palette[index % palette.length];

export default function MonthlyTagBarChart({ data, tags }: Props) {
  if (tags.length === 0) return null;

  const totals = data.map((row) =>
    tags.reduce((sum, tag) => sum + Number(row[tag] ?? 0), 0),
  );
  const maxTotal = Math.max(1, ...totals);
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div>
      <div className="grid h-[320px] grid-cols-[2rem_1fr] grid-rows-[1fr_1.5rem] gap-x-3">
        <div className="relative text-[10px] text-black/40 dark:text-white/40">
          {ticks.map((tick) => (
            <span
              className="absolute right-0 -translate-y-1/2 tabular-nums"
              key={tick}
              style={{ top: `${(1 - tick) * 100}%` }}
            >
              {Math.round(maxTotal * tick)}
            </span>
          ))}
        </div>

        <div className="relative border-b border-black/10 dark:border-white/10">
          {ticks.map((tick) => (
            <span
              className="absolute right-0 left-0 border-t border-black/5 dark:border-white/10"
              key={tick}
              style={{ top: `${(1 - tick) * 100}%` }}
            />
          ))}

          <div
            className="absolute inset-0 grid items-end gap-3"
            style={{
              gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
            }}
          >
            {data.map((row, rowIndex) => {
              const total = totals[rowIndex] ?? 0;
              const label = String(row.monthLabel ?? "");
              const title = [
                `${label}: 合計 ${total.toLocaleString("ja-JP")}件`,
                ...tags.map(
                  (tag) =>
                    `${tag}: ${Number(row[tag] ?? 0).toLocaleString("ja-JP")}件`,
                ),
              ].join("\n");

              return (
                <div
                  className="flex h-full items-end"
                  key={label || rowIndex}
                  title={title}
                >
                  <div
                    className="flex w-full flex-col-reverse overflow-hidden"
                    style={{ height: `${(total / maxTotal) * 100}%` }}
                  >
                    {tags.map((tag, tagIndex) => {
                      const value = Number(row[tag] ?? 0);
                      if (value <= 0 || total <= 0) return null;
                      return (
                        <span
                          key={tag}
                          style={{
                            height: `${(value / total) * 100}%`,
                            backgroundColor: getColor(tagIndex, tag),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="col-start-2 grid gap-3 pt-2 text-center text-xs text-black/50 dark:text-white/50"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          }}
        >
          {data.map((row, index) => (
            <span key={`${row.monthLabel}-${index}`}>
              {String(row.monthLabel ?? "")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-black/60 dark:text-white/60">
        {tags.map((tag, index) => (
          <span className="inline-flex items-center gap-2" key={tag}>
            <span
              className="size-2"
              style={{ backgroundColor: getColor(index, tag) }}
            />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
