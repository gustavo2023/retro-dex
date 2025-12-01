"use client";

import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
} from "@/components/ui/chart";
import { type CollectionMovie } from "@/lib/movies";
import { ChartBarBig } from "lucide-react";

type TopGenresChartProps = {
  movies: CollectionMovie[];
};

export function TopGenresChart({ movies }: TopGenresChartProps) {
  const chartData = useMemo(() => {
    const genreCounts: Record<string, number> = {};

    movies.forEach((movie) => {
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((genre) => {
          const name = typeof genre === "string" ? genre : genre.name;
          if (name) {
            genreCounts[name] = (genreCounts[name] || 0) + 1;
          }
        });
      }
    });

    const sortedGenres = Object.entries(genreCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 4);

    return sortedGenres.map(([name, count], index) => ({
      genre: name,
      count: count,
      fill: `var(--chart-${index + 1})`,
    }));
  }, [movies]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Movies",
      },
    };
    chartData.forEach((item) => {
      config[item.genre] = {
        label: item.genre,
        color: item.fill,
      };
    });
    return config;
  }, [chartData]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          <span>Top Genres</span>
          <ChartBarBig className="inline-block ml-2 size-5" />
        </CardTitle>
        <CardDescription>Most collected genres</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-full w-full aspect-auto"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <YAxis
              dataKey="genre"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
              className="text-xs font-medium"
            />
            <XAxis dataKey="count" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="count" layout="vertical" radius={5} barSize={32} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
