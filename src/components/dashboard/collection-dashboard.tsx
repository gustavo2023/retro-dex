"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Clapperboard, Sparkles, ShoppingBag, Film } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CollectionGrid from "@/components/my-collection/collection-grid";
import { createClient } from "@/utils/supabase/client";
import {
  type CollectionMovie,
  type MovieStatus,
  MOVIE_SELECT_FIELDS,
} from "@/lib/movies";

const QUERY_KEY = ["collection", "movies"] as const;

type CollectionDashboardProps = {
  initialMovies: CollectionMovie[];
  initialError: string | null;
};

export default function CollectionDashboard(props: CollectionDashboardProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CollectionDashboardContent {...props} />
    </QueryClientProvider>
  );
}

function CollectionDashboardContent({
  initialMovies,
  initialError,
}: CollectionDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data: movies = [], error: queryError } = useQuery<
    CollectionMovie[],
    Error
  >({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("We could not identify your user account.");
      }

      const { data, error } = await supabase
        .from("movies")
        .select(MOVIE_SELECT_FIELDS)
        .eq("profile_id", user.id)
        .order("title", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as unknown as CollectionMovie[];
    },
    initialData: initialMovies,
    staleTime: 1000 * 60 * 5,
  });

  const displayError = queryError ? queryError.message : initialError;
  const hasMovies = movies.length > 0;

  const summary = useMemo(() => calculateSummary(movies), [movies]);

  const metricCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total Movies",
        value: summary.total,
        icon: Clapperboard,
        borderClass: "",
        iconClass: "text-foreground",
      },
      {
        key: "wishlist",
        label: "Wishlist",
        value: summary.statusCounts.wishlist,
        icon: Sparkles,
        borderClass: "border-amber-300",
        iconClass: "text-amber-500",
      },
      {
        key: "owned",
        label: "Owned",
        value: summary.statusCounts.owned,
        icon: ShoppingBag,
        borderClass: "border-emerald-300",
        iconClass: "text-emerald-500",
      },
      {
        key: "watched",
        label: "Watched",
        value: summary.statusCounts.watched,
        icon: Film,
        borderClass: "border-sky-300",
        iconClass: "text-sky-500",
      },
    ],
    [summary]
  );

  const handleMovieUpdated = (updatedMovie: CollectionMovie) => {
    queryClient.setQueryData<CollectionMovie[]>(QUERY_KEY, (current) => {
      if (!current?.length) {
        return [updatedMovie];
      }

      const exists = current.some((movie) => movie.id === updatedMovie.id);
      return exists
        ? current.map((movie) =>
            movie.id === updatedMovie.id ? updatedMovie : movie
          )
        : [...current, updatedMovie];
    });
  };

  const handleMovieDeleted = (deletedId: string) => {
    queryClient.setQueryData<CollectionMovie[]>(QUERY_KEY, (current) => {
      if (!current?.length) {
        return [];
      }
      return current.filter((movie) => movie.id !== deletedId);
    });
  };

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(
          ({ key, label, value, icon: Icon, borderClass, iconClass }) => (
            <Card
              key={key}
              className={borderClass ? `border ${borderClass}` : undefined}
            >
              <CardHeader className="flex items-start justify-between space-y-0 pb-0">
                <CardDescription className="text-xl font-medium">
                  {label}
                </CardDescription>
                <Icon className={`size-6 ${iconClass}`} aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <CardTitle className="text-3xl font-semibold md:text-4xl">
                  {value}
                </CardTitle>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {displayError && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <CardHeader>
            <CardTitle>We could not load your collection</CardTitle>
            <CardDescription className="text-red-600">
              {displayError}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!displayError && !hasMovies && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-2xl">Your collection is empty</CardTitle>
            <CardDescription>
              Add your first movies from the Explore section to start building
              your retro showcase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/discover">Explore titles</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasMovies && (
        <CollectionGrid
          initialMovies={movies}
          onMovieUpdated={handleMovieUpdated}
          onMovieDeleted={handleMovieDeleted}
        />
      )}
    </section>
  );
}

export function calculateSummary(movies: CollectionMovie[]) {
  return movies.reduce(
    (acc, movie) => {
      acc.total += 1;
      acc.statusCounts[movie.status] += 1;

      const watchedDate = movie.watched_at ? new Date(movie.watched_at) : null;
      if (
        watchedDate &&
        !Number.isNaN(watchedDate.getTime()) &&
        watchedDate.getFullYear() === new Date().getFullYear()
      ) {
        acc.watchedThisYear += 1;
      }

      const parsedValue =
        typeof movie.estimated_price === "number"
          ? movie.estimated_price
          : movie.estimated_price
          ? Number(movie.estimated_price)
          : 0;
      if (!Number.isNaN(parsedValue)) {
        acc.totalValue += parsedValue;
      }

      return acc;
    },
    {
      total: 0,
      watchedThisYear: 0,
      totalValue: 0,
      statusCounts: {
        wishlist: 0,
        owned: 0,
        watched: 0,
      } as Record<MovieStatus, number>,
    }
  );
}
