"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";

type MovieResult = {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
};

type AddState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

const getPosterUrl = (
  path?: string | null,
  size: "w500" | "w780" = "w500"
) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

const formatReleaseDate = (date?: string) => {
  if (!date) return "Sin fecha de estreno disponible";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha de estreno disponible";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

const getReleaseYear = (date?: string) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.getFullYear();
};

const mockCollections = [
  {
    title: "Recently Viewed",
    description: "Stories the community is revisiting",
  },
  {
    title: "Classics That Return",
    description: "Movies that never go out of style",
  },
  {
    title: "Collaborative Lists",
    description: "Built by guest curators",
  },
];

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addStates, setAddStates] = useState<Record<number, AddState>>({});

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("search-tmdb", {
        body: {
          endpoint: "search",
          query: trimmedQuery,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      const payload = (data as { results?: MovieResult[] }) ?? {};
      const sortedResults = [...(payload.results ?? [])].sort(
        (a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0)
      );
      setResults(sortedResults);
      setHasSearched(true);
    } catch (err) {
      setResults([]);
      setHasSearched(true);
      setErrorMessage(
        err instanceof Error ? err.message : "Search could not be completed."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCollection = async (movie: MovieResult) => {
    setAddStates((prev) => ({ ...prev, [movie.id]: { status: "loading" } }));

    try {
      const releaseYear = getReleaseYear(movie.release_date);
      if (!releaseYear) {
        throw new Error(
          "Esta película no tiene una fecha de estreno válida."
        );
      }

      const { data: userData } = await supabase.auth.getUser();
      const profileId = userData?.user?.id;
      if (!profileId) {
        throw new Error("Debes iniciar sesión para agregar películas.");
      }

      const { error } = await supabase.from("movies").insert({
        profile_id: profileId,
        status: "wishlist",
        tmdb_id: movie.id,
        title: movie.title,
        release_year: releaseYear,
        synopsis: movie.overview ?? null,
        tmdb_poster_path: movie.poster_path ?? null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setAddStates((prev) => ({ ...prev, [movie.id]: { status: "success" } }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo agregar la película.";
      setAddStates((prev) => ({
        ...prev,
        [movie.id]: { status: "error", message },
      }));
    }
  };

  return (
    <section className="space-y-8">
      <Card className="border-dashed">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Explore New Retro Gems</CardTitle>
            <CardDescription>
              Search directly on TMDB without exposing the token from the client.
            </CardDescription>
          </div>
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Escribe un título, p. ej. Dune"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? "Buscando…" : "Buscar"}
            </Button>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          {isSearching && (
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isSearching &&
            hasSearched &&
            results.length === 0 &&
            !errorMessage && (
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{query}&quot;.
              </p>
            )}

          {results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((movie) => {
                const posterUrl = getPosterUrl(movie.poster_path);
                const addState = addStates[movie.id];
                const isAdding = addState?.status === "loading";
                const isAdded = addState?.status === "success";

                return (
                  <Dialog key={movie.id}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="group w-full text-left"
                        aria-label={`Ver detalles de ${movie.title}`}
                      >
                        <Card className="border border-dashed !gap-0 !py-0 overflow-hidden transition hover:border-primary/50 group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-primary">
                          <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                            {posterUrl ? (
                              <Image
                                src={posterUrl}
                                alt={`Poster de ${movie.title}`}
                                fill
                                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 35vw, 90vw"
                                className="object-cover transition duration-300 group-hover:scale-105"
                                priority={false}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Sin póster
                              </div>
                            )}
                          </div>
                          <CardContent className="space-y-1 px-4 py-3">
                            <CardTitle className="text-base">{movie.title}</CardTitle>
                            <CardDescription>
                              {formatReleaseDate(movie.release_date)}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <div className="flex flex-col gap-6 sm:flex-row">
                        <div className="relative mx-auto aspect-[3/4] w-36 overflow-hidden rounded-lg bg-muted sm:mx-0 sm:w-48">
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={`Poster de ${movie.title}`}
                              fill
                              sizes="(min-width: 640px) 12rem, 10rem"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Sin póster disponible
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <DialogHeader className="text-left">
                            <DialogTitle>{movie.title}</DialogTitle>
                            <DialogDescription>
                              {formatReleaseDate(movie.release_date)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <p className="text-muted-foreground">
                              {movie.overview || "No hay sinopsis disponible."}
                            </p>
                            <ul className="space-y-1 text-muted-foreground">
                              {movie.original_language && (
                                <li>
                                  Idioma original: {movie.original_language.toUpperCase()}
                                </li>
                              )}
                              {typeof movie.vote_average === "number" && (
                                <li>
                                  Valoración TMDB: {movie.vote_average.toFixed(1)} ({
                                    movie.vote_count ?? 0
                                  } {movie.vote_count === 1 ? "voto" : "votos"})
                                </li>
                              )}
                            </ul>
                          </div>
                          <div className="space-y-2 pt-2">
                            <Button
                              onClick={() => handleAddToCollection(movie)}
                              disabled={isAdding || isAdded}
                              className="w-full sm:w-auto"
                            >
                              {isAdded
                                ? "Añadida a tu wishlist"
                                : isAdding
                                ? "Agregando…"
                                : "Agregar a mi colección"}
                            </Button>
                            {addState?.status === "error" && addState.message && (
                              <p className="text-sm text-destructive">
                                {addState.message}
                              </p>
                            )}
                            {isAdded && (
                              <p className="text-sm text-emerald-600">
                                ¡Listo! Revisa tu colección.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {mockCollections.map((collection) => (
          <Card key={collection.title} className="border-dashed">
            <CardHeader>
              <CardTitle>{collection.title}</CardTitle>
              <CardDescription>{collection.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
