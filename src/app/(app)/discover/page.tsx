"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
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
  if (!date) return "No release date available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No release date available";

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
  const [profileId, setProfileId] = useState<string | null>(null);
  const [ownedTmdbIds, setOwnedTmdbIds] = useState<Record<number, boolean>>({});
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUserAndCollection = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;

      const user = data?.user;
      if (!user) {
        setProfileId(null);
        setOwnedTmdbIds({});
        return;
      }

      setProfileId(user.id);
      setIsLoadingCollection(true);
      const { data: movies, error } = await supabase
        .from("movies")
        .select("tmdb_id")
        .eq("profile_id", user.id);

      if (error) {
        console.error("Failed to load collection", error.message);
        setOwnedTmdbIds({});
      } else {
        const mapped: Record<number, boolean> = {};
        (movies ?? []).forEach((movieRow) => {
          if (typeof movieRow.tmdb_id === "number") {
            mapped[movieRow.tmdb_id] = true;
          }
        });
        setOwnedTmdbIds(mapped);
      }

      if (isMounted) {
        setIsLoadingCollection(false);
      }
    };

    loadUserAndCollection();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

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
    if (ownedTmdbIds[movie.id]) {
      setAddStates((prev) => ({
        ...prev,
        [movie.id]: {
          status: "success",
          message: "This movie is already in your collection.",
        },
      }));
      return;
    }

    setAddStates((prev) => ({ ...prev, [movie.id]: { status: "loading" } }));

    try {
      const releaseYear = getReleaseYear(movie.release_date);
      if (!releaseYear) {
        throw new Error(
          "This movie lacks a valid release date and cannot be added."
        );
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentProfileId = userData?.user?.id;
      if (!currentProfileId) {
        throw new Error("You must be logged in to add movies.");
      }

      const { error } = await supabase.from("movies").insert({
        profile_id: currentProfileId,
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
      setOwnedTmdbIds((prev) => ({ ...prev, [movie.id]: true }));
      toast.success(`${movie.title} added to your collection!`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Could not add the movie.";
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
              placeholder="Type a title, e.g. Dune"
              disabled={isSearching}
            />
            <Button type="submit" disabled={isSearching}>
              <Search className="size-4"/>
              {isSearching ? "Searching…" : "Search"}
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
                const alreadyOwned = ownedTmdbIds[movie.id];
                const showSuccess = isAdded || alreadyOwned;

                return (
                  <Dialog key={movie.id}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="group w-full text-left"
                        aria-label={`View details of ${movie.title}`}
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
                              alt={`Poster of ${movie.title}`}
                              fill
                              sizes="(min-width: 640px) 12rem, 10rem"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              No poster available
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
                              {movie.overview || "No synopsis available."}
                            </p>
                            <ul className="space-y-1 text-muted-foreground">
                              {movie.original_language && (
                                <li>
                                  Original language: {movie.original_language.toUpperCase()}
                                </li>
                              )}
                              {typeof movie.vote_average === "number" && (
                                <li>
                                  TMDB rating: {movie.vote_average.toFixed(1)} ({
                                    movie.vote_count ?? 0
                                  } {movie.vote_count === 1 ? "vote" : "votes"})
                                </li>
                              )}
                            </ul>
                          </div>
                          <div className="space-y-2 pt-2">
                            {showSuccess ? (
                              <p className="text-sm text-emerald-600">
                                Esta película ya está en tu colección.
                              </p>
                            ) : (
                              <>
                                <Button
                                  onClick={() => handleAddToCollection(movie)}
                                  disabled={isAdding || isLoadingCollection}
                                  className="w-full sm:w-auto"
                                >
                                  <Plus className="size-4" aria-hidden="true" />
                                  {isAdding ? "Adding..." : "Add to my collection"}
                                </Button>
                                {addState?.status === "error" &&
                                  addState.message && (
                                    <p className="text-sm text-destructive">
                                      {addState.message}
                                    </p>
                                  )}
                              </>
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
