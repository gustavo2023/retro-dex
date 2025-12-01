"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { subMonths, format, isSameMonth, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type CollectionMovie } from "@/lib/movies";

const chartConfig = {
  count: {
    label: "Movies",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type WatchedMoviesChartProps = {
  movies: CollectionMovie[];
};

export function WatchedMoviesChart({ movies }: WatchedMoviesChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      return subMonths(today, 11 - i);
    });

    return last12Months.map((date) => {
      const count = movies.filter((movie) => {
        if (movie.status !== "watched" || !movie.watched_at) return false;
        const watchedDate = parseISO(movie.watched_at);
        return isSameMonth(watchedDate, date);
      }).length;

      return {
        month: format(date, "MMMM"),
        shortMonth: format(date, "MMM"),
        year: format(date, "yyyy"),
        count,
      };
    });
  }, [movies]);

  const totalWatchedLast12Months = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.count, 0),
    [chartData]
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Watched History</CardTitle>
        <CardDescription>Movies watched in the last 12 months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="shortMonth"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="count"
              type="natural"
              stroke="var(--color-count)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-count)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {totalWatchedLast12Months} movies watched this period{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total watched movies for the last 12 months
        </div>
      </CardFooter>
    </Card>
  );
}
