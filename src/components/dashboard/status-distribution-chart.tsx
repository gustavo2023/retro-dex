"use client";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { type CollectionMovie, STATUS_LABEL } from "@/lib/movies";
import { ChartPie } from "lucide-react"

type StatusDistributionChartProps = {
  movies: CollectionMovie[];
};

export function StatusDistributionChart({
  movies,
}: StatusDistributionChartProps) {
  const chartData = useMemo(() => {
    const counts = {
      wishlist: 0,
      owned: 0,
      watched: 0,
    };

    movies.forEach((movie) => {
      if (counts[movie.status] !== undefined) {
        counts[movie.status]++;
      }
    });

    return [
      {
        status: "wishlist",
        count: counts.wishlist,
        fill: "var(--color-wishlist)",
      },
      { status: "owned", count: counts.owned, fill: "var(--color-owned)" },
      {
        status: "watched",
        count: counts.watched,
        fill: "var(--color-watched)",
      },
    ].filter((item) => item.count > 0);
  }, [movies]);

  const chartConfig = {
    count: {
      label: "Movies",
    },
    wishlist: {
      label: STATUS_LABEL.wishlist,
      color: "var(--chart-1)",
    },
    owned: {
      label: STATUS_LABEL.owned,
      color: "var(--chart-2)",
    },
    watched: {
      label: STATUS_LABEL.watched,
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>
          <span>Collection Status</span>
          <ChartPie className="inline-block ml-2 size-5" />
        </CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="count" hideLabel />}
            />
            <Pie data={chartData} dataKey="count" nameKey="status" />
            <ChartLegend
              content={<ChartLegendContent nameKey="status" hideIcon />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/3 *:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
