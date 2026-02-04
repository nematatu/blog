import { Bar, BarChart, BarXAxis, ChartTooltip, Grid } from "@components/charts";
import { cn } from "@lib/utils";

type HeatmapDay = {
  date: string;
  count: number;
};

type HeatmapWeek = HeatmapDay[];

type TopPost = {
  title: string;
  date: string;
  charCount: number;
};

type DailyPoint = {
  date: string;
  count: number;
};

type Props = {
  yearCharTotal: number;
  dailyTotal: number;
  dailyWindow: number;
  dailySeries: DailyPoint[];
  heatmapWeeks: HeatmapWeek[];
  heatmapLabels: string[];
  heatmapStartYear: number;
  heatmapEndYear: number;
  topPosts: TopPost[];
};

const levelClass = (level: number) => {
  if (level === 0) return "bg-black/5 dark:bg-white/5";
  if (level === 1) return "bg-sky-100 dark:bg-sky-500/20";
  if (level === 2) return "bg-sky-200 dark:bg-sky-500/35";
  if (level === 3) return "bg-sky-300 dark:bg-sky-500/55";
  return "bg-sky-400 dark:bg-sky-500/80";
};

const formatNumber = (value: number) => value.toLocaleString("ja-JP");

export default function StatsPage({
  yearCharTotal,
  dailyTotal,
  dailyWindow,
  dailySeries,
  heatmapWeeks,
  heatmapLabels,
  heatmapStartYear,
  heatmapEndYear,
  topPosts,
}: Props) {
  const flatDays = heatmapWeeks.flat();
  const maxDaily = Math.max(1, ...flatDays.map((day) => day.count));

  const chartData = dailySeries.map((item) => ({
    date: new Date(item.date),
    count: item.count,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-28 space-y-1 text-sm text-black/60 dark:text-white/60">
            <a className="flex items-center gap-3 rounded-full px-3 py-2" href="/">
              <span className="size-2 rounded-full border border-black/20 dark:border-white/20" />
              ホーム
            </a>
            <a className="flex items-center gap-3 rounded-full px-3 py-2" href="/blog">
              <span className="size-2 rounded-full border border-black/20 dark:border-white/20" />
              記事の管理
            </a>
            <a className="flex items-center gap-3 rounded-full px-3 py-2" href="/projects">
              <span className="size-2 rounded-full border border-black/20 dark:border-white/20" />
              プロジェクト
            </a>
            <div className="flex items-center gap-3 rounded-full bg-sky-500/10 px-3 py-2 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
              <span className="size-2 rounded-full bg-sky-500" />
              統計
            </div>
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="space-y-2">
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              統計ダッシュボード
            </h1>
            <p className="text-xs text-black/50 dark:text-white/50">
              データはビルド時に更新されます。公開後の反映には少し時間がかかる場合があります。
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-black/70 dark:text-white/70">
                  執筆文字数
                </div>
                <div className="mt-1 text-xs text-black/40 dark:text-white/40">
                  直近1年の集計結果
                </div>
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {formatNumber(yearCharTotal)} 字
              </div>
            </div>

            <div className="mt-4 w-full">
              <div
                className="w-full"
                style={{
                  ["--cell-size" as string]: "10px",
                  ["--cell-gap" as string]: "2px",
                }}
              >
                <div
                  className="grid text-[10px] text-black/35 dark:text-white/35"
                  style={{
                    gridTemplateColumns: `repeat(${heatmapLabels.length}, var(--cell-size))`,
                    gap: "var(--cell-gap)",
                    width: "100%",
                  }}
                >
                  {heatmapLabels.map((label, index) => (
                    <span
                      key={`label-${label}-${index}`}
                      style={{
                        height: "var(--cell-size)",
                        lineHeight: "var(--cell-size)",
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div
                  className="mt-2 grid grid-flow-col"
                  style={{
                    gap: "var(--cell-gap)",
                    width: "100%",
                    gridAutoColumns: "var(--cell-size)",
                  }}
                >
                  {heatmapWeeks.map((week, weekIndex) => (
                    <div
                      className="grid grid-rows-7"
                      key={`week-${weekIndex}`}
                      style={{ gap: "var(--cell-gap)" }}
                    >
                      {week.map((day, dayIndex) => {
                        const ratio = day.count / maxDaily;
                        const level =
                          day.count === 0
                            ? 0
                            : ratio >= 0.8
                              ? 4
                              : ratio >= 0.6
                                ? 3
                                : ratio >= 0.3
                                  ? 2
                                  : 1;
                        return (
                          <span
                            key={`day-${weekIndex}-${dayIndex}`}
                            className={cn(levelClass(level))}
                            style={{
                              width: "var(--cell-size)",
                              height: "var(--cell-size)",
                              borderRadius: 2,
                            }}
                            title={`${day.date}：${day.count}件`}
                            aria-label={`${day.date}：${day.count}件`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-black/40 dark:text-white/40">
              <span>{heatmapStartYear}年</span>
              <span>{heatmapEndYear}年</span>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-black/70 dark:text-white/70">
                  投稿数
                </div>
                <div className="mt-1 text-xs text-black/40 dark:text-white/40">
                  直近{dailyWindow}日の集計結果
                </div>
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {formatNumber(dailyTotal)} 件
              </div>
            </div>
            <div className="mt-4">
              <BarChart
                data={chartData}
                xDataKey="date"
                animationDuration={900}
                barGap={0.2}
                aspectRatio="3 / 1"
              >
                <Grid />
                <Bar dataKey="count" fill="var(--chart-line-primary)" lineCap="butt" />
                <BarXAxis maxLabels={10} />
                <ChartTooltip
                  rows={(point) => [
                    {
                      color: "var(--chart-line-primary)",
                      label: "投稿数",
                      value: Number(point.count ?? 0),
                    },
                  ]}
                  showDatePill={false}
                  showDots={false}
                />
              </BarChart>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-black/70 dark:text-white/70">
                  投稿ごとの執筆文字数
                </div>
                <div className="mt-1 text-xs text-black/40 dark:text-white/40">
                  合計文字数の上位を表示
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                  記事
                </span>
                <span className="rounded-full border border-black/10 px-3 py-1 text-black/40 dark:border-white/10 dark:text-white/40">
                  Book
                </span>
                <span className="rounded-full border border-black/10 px-3 py-1 text-black/40 dark:border-white/10 dark:text-white/40">
                  Scrap
                </span>
              </div>
            </div>

            <div className="mt-4 divide-y divide-black/5 text-sm dark:divide-white/10">
              {topPosts.map((post, index) => (
                <div className="flex items-center justify-between gap-4 py-3" key={`${post.title}-${index}`}>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-black dark:text-white">
                      {post.title}
                    </div>
                    <div className="mt-1 text-xs text-black/40 dark:text-white/40">
                      {post.date}に公開
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-black dark:text-white">
                    {formatNumber(post.charCount)} 字
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                className="rounded-full border border-black/10 bg-white px-6 py-2 text-xs text-black/60 transition hover:border-black/20 dark:border-white/10 dark:bg-neutral-900/70 dark:text-white/60 dark:hover:border-white/30"
                type="button"
              >
                もっと読み込む
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
