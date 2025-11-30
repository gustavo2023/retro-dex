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
    errorMessage = "No pudimos validar tu sesión. Vuelve a iniciar sesión.";
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

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Movies</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {summary.total}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Wishlist</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {summary.statusCounts.wishlist}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Owned</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {summary.statusCounts.owned}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Watched</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {summary.statusCounts.watched}
            </CardTitle>
          </CardHeader>
        </Card>
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
            <CardTitle className="text-2xl">Tu colección está vacía</CardTitle>
            <CardDescription>
              Agrega tus primeras películas desde la sección de descubrimiento
              para empezar a construir tu vitrina retro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/discover">Explorar títulos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasMovies && <CollectionGrid initialMovies={movies} />}
    </section>
  );
}
