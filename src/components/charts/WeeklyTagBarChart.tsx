import { Bar, BarChart, BarXAxis, ChartTooltip, Grid } from "@components/charts";

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

const getColor = (index: number, tag: string) => {
  if (tag === "その他") return "hsl(215, 16%, 65%)";
  return palette[index % palette.length];
};

export default function WeeklyTagBarChart({ data, tags }: Props) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div>
      <BarChart
        data={data}
        xDataKey="label"
        stacked
        stackGap={3}
        barGap={0.2}
        aspectRatio="2.2 / 1"
        className="min-h-[220px]"
      >
        <Grid horizontal />
        {tags.map((tag, index) => (
          <Bar
            dataKey={tag}
            fill={getColor(index, tag)}
            lineCap={4}
            stackGap={3}
            key={tag}
          />
        ))}
        <BarXAxis maxLabels={10} />
        <ChartTooltip
          showDatePill={false}
          showDots={false}
          content={({ point }) => {
            const label = String(point.range ?? point.label ?? "");
            const rows = tags.map((tag, index) => ({
              label: tag,
              color: getColor(index, tag),
              value: Number(point[tag] ?? 0),
            }));
            const total = rows.reduce((acc, row) => acc + row.value, 0);

            return (
              <div className="px-3 py-2.5">
                <div className="mb-2 text-xs text-[color:var(--chart-tooltip-muted)]">
                  {label}
                </div>
                <div className="space-y-1.5">
                  {rows.map((row) => (
                    <div
                      className="flex items-center justify-between gap-4"
                      key={row.label}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-sm text-[color:var(--chart-tooltip-muted)]">
                          {row.label}
                        </span>
                      </div>
                      <span className="font-medium text-sm text-[color:var(--chart-tooltip-foreground)] tabular-nums">
                        {row.value.toLocaleString()}件
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 text-xs text-[color:var(--chart-tooltip-muted)]">
                    合計 {total.toLocaleString()}件
                  </div>
                </div>
              </div>
            );
          }}
        />
      </BarChart>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-black/60 dark:text-white/60">
        {tags.map((tag, index) => (
          <span className="inline-flex items-center gap-2" key={tag}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: getColor(index, tag) }}
            />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
