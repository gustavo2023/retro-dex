"use client";

import { useMemo, useState } from "react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { DollarSign, Film, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  type CollectionMovie,
  MOVIE_SELECT_FIELDS,
  formatCurrency,
} from "@/lib/movies";
import { calculateSummary } from "@/components/dashboard/collection-dashboard";
import { WatchedMoviesChart } from "@/components/dashboard/watched-movies-chart";
import { TopGenresChart } from "@/components/dashboard/top-genres-chart";
import { StatusDistributionChart } from "@/components/dashboard/status-distribution-chart";

export default function DashboardGrid() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardGridContent />
    </QueryClientProvider>
  );
}

function DashboardGridContent() {
  const supabase = createClient();

  const { data: movies = [], isLoading } = useQuery({
    queryKey: ["collection", "movies"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from("movies")
        .select(MOVIE_SELECT_FIELDS)
        .eq("profile_id", user.id);

      if (error) {
        console.error("Error fetching movies:", error);
        return [];
      }

      return (data ?? []) as unknown as CollectionMovie[];
    },
    staleTime: 1000 * 60 * 5,
  });

  const summary = useMemo(() => calculateSummary(movies), [movies]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-0">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Metrics Column */}
        <div className="flex flex-col gap-4 md:col-span-1">
          {/* Total Value Card */}
          <Card className="flex-1 border border-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-emerald-500">
                Total Collection Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {formatCurrency(summary.totalValue)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated value based on purchase price
              </p>
            </CardContent>
          </Card>

          {/* Total Movies Card */}
          <Card className="flex-1 border border-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium text-amber-500">
                Total Movies
              </CardTitle>
              <Film className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">
                {summary.total}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Items in your collection
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Watched History Chart */}
        <div className="md:col-span-2 min-h-[300px]">
          <WatchedMoviesChart movies={movies} />
        </div>
        {/* Bottom Row Charts (Pie & Bar) */}
        <div className="grid gap-4 md:col-span-3 md:grid-cols-2">
          <TopGenresChart movies={movies} />
          <StatusDistributionChart movies={movies} />
        </div>
      </div>
    </div>
  );
}
