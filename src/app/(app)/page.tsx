import Image from "next/image";
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

type MovieStatus = "wishlist" | "owned" | "watched";

type CollectionMovie = {
  id: string;
  title: string;
  release_year: number | null;
  status: MovieStatus;
  rating: number | null;
  synopsis: string | null;
  genres: Array<{ name?: string } | string> | null;
  tmdb_poster_path: string | null;
  user_poster_url: string | null;
  estimated_price: number | string | null;
  watched_at: string | null;
};

const STATUS_LABEL: Record<MovieStatus, string> = {
  wishlist: "Wishlist",
  owned: "Owned",
  watched: "Watched",
};

const STATUS_STYLES: Record<MovieStatus, string> = {
  wishlist: "bg-amber-50 text-amber-600 border border-amber-200",
  owned: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  watched: "bg-sky-50 text-sky-600 border border-sky-200",
};

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

const formatCurrency = (value: number) =>
  value > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value)
    : "—";

const getPosterUrl = (movie: CollectionMovie) =>
  movie.user_poster_url ??
  (movie.tmdb_poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.tmdb_poster_path}`
    : null);

const getGenresLabel = (movie: CollectionMovie) => {
  if (!movie.genres?.length) return null;
  return movie.genres
    .map((genre) =>
      typeof genre === "string"
        ? genre
        : genre?.name ?? "Unknown genre"
    )
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

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
      .select(
        [
          "id",
          "title",
          "release_year",
          "status",
          "rating",
          "synopsis",
          "genres",
          "tmdb_poster_path",
          "user_poster_url",
          "estimated_price",
          "watched_at",
        ].join(",")
      )
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

      {hasMovies && (
        <div className="grid gap-4 lg:grid-cols-2">
          {movies.map((movie) => {
            const posterUrl = getPosterUrl(movie);
            const genres = getGenresLabel(movie);
            const watchedDate = formatDate(movie.watched_at);
            const ratingLabel = movie.rating
              ? `${movie.rating}/5`
              : null;

            return (
              <Card key={movie.id} className="overflow-hidden">
                <CardContent className="flex gap-4 p-4">
                  <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        alt={`Poster for ${movie.title}`}
                        fill
                        sizes="(min-width: 1024px) 12vw, 30vw"
                        className="object-cover"
                        priority={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No poster
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-xl leading-tight">
                            {movie.title}
                          </CardTitle>
                          {movie.release_year && (
                            <p className="text-sm text-muted-foreground">
                              {movie.release_year}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${STATUS_STYLES[movie.status]}`}
                        >
                          {STATUS_LABEL[movie.status]}
                        </span>
                      </div>
                      {genres && (
                        <p className="text-xs text-muted-foreground">
                          {genres}
                        </p>
                      )}
                    </div>

                    {movie.synopsis && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {movie.synopsis}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {ratingLabel && <span>Rating: {ratingLabel}</span>}
                      {watchedDate && <span>Watched: {watchedDate}</span>}
                      {movie.estimated_price && (
                        <span>
                          Value: {formatCurrency(Number(movie.estimated_price))}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
