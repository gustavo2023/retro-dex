"use client";

import { useMemo, useState } from "react";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { DollarSign, Eye, Film, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import {
  type CollectionMovie,
  MOVIE_SELECT_FIELDS,
  formatCurrency,
} from "@/lib/movies";
import { calculateSummary } from "@/components/dashboard/collection-dashboard";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-3">
      {/* Column 1: Metrics Cards */}
      <div className="flex flex-col gap-4 md:row-span-3">
        <Card className="flex-1 border border-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-emerald-500">
              Total Collection Value
            </CardTitle>
            <DollarSign className="size-6 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-emerald-500 font-bold">
              {formatCurrency(summary.totalValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated value based on purchase price
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 border border-sky-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-sky-500">
              Watched Movies
            </CardTitle>
            <Eye className="size-6 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-sky-500 font-bold">
              {summary.statusCounts.watched}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Movies marked as watched
            </p>
          </CardContent>
        </Card>

        <Card className="flex-1 border border-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-amber-500">
              Total Movies
            </CardTitle>
            <Film className="size-6 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-amber-500 font-bold">{summary.total}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Items in your collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Columns 2 & 3: Charts Placeholders */}
      <div className="grid gap-4 md:col-span-2 md:row-span-3 md:grid-rows-3">
        <Card className="md:row-span-2 flex items-center justify-center border-dashed">
          <p className="text-muted-foreground">Main Chart Placeholder</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 md:row-span-1">
          <Card className="flex items-center justify-center border-dashed">
            <p className="text-muted-foreground">Secondary Chart 1</p>
          </Card>
          <Card className="flex items-center justify-center border-dashed">
            <p className="text-muted-foreground">Secondary Chart 2</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
