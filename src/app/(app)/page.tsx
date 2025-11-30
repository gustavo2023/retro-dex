import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import CollectionGrid from "@/components/my-collection/collection-grid";
import { Clapperboard, Sparkles, ShoppingBag, Film } from "lucide-react";
import {
  type CollectionMovie,
  type MovieStatus,
  MOVIE_SELECT_FIELDS,
} from "@/lib/movies";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let movies: CollectionMovie[] = [];
  let errorMessage: string | null = null;

  if (!user) {
    errorMessage = "We could not identify your user account.";
  } else {
    const { data, error } = await supabase
      .from("movies")
      .select(MOVIE_SELECT_FIELDS)
      .eq("profile_id", user.id)
      .order("title", { ascending: true });

    if (error) {
      errorMessage = error.message;
    } else {
      movies = (data ?? []) as unknown as CollectionMovie[];
    }
  }

  const summary = movies.reduce(
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

  const hasMovies = movies.length > 0;

  const metricCards = [
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
  ];

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

      {errorMessage && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <CardHeader>
            <CardTitle>We could not load your collection</CardTitle>
            <CardDescription className="text-red-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!hasMovies && !errorMessage && (
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

      {hasMovies && <CollectionGrid initialMovies={movies} />}
    </section>
  );
}
