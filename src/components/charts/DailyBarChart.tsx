import { Bar, BarChart, BarXAxis, ChartTooltip, Grid } from "@components/charts";

type Point = {
  date: string;
  count: number;
};

type Props = {
  data: Point[];
};

export default function DailyBarChart({ data }: Props) {
  const chartData = data.map((item) => ({
    date: new Date(item.date),
    count: item.count,
  }));

  return (
    <BarChart
      data={chartData}
      xDataKey="date"
      animationDuration={900}
      barGap={0.1}
      aspectRatio="3 / 1"
    >
      <Grid horizontal />
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
  );
}
