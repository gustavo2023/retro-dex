"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Plus,
  Flame,
  Star,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABEL, type MovieStatus } from "@/lib/movies";
type MovieResult = {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: { id: number; name: string }[];
};

type AddState = {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
};

type AddMovieOptions = {
  status: MovieStatus;
  estimatedPrice: number | null;
  rating: number | null;
  personalReview: string | null;
};

type CollectionKey = "popular" | "top_rated" | "upcoming";

const collectionSections: Array<{
  key: CollectionKey;
  title: string;
  description: string;
  endpoint: CollectionKey;
  Icon: LucideIcon;
  accentClass: string;
}> = [
  {
    key: "popular",
    title: "Popular Movies",
    description: "Movies that everyone is talking about",
    endpoint: "popular",
    Icon: Flame,
    accentClass: "text-orange-500",
  },
  {
    key: "top_rated",
    title: "Top Rated Movies",
    description: "Movies with the highest ratings",
    endpoint: "top_rated",
    Icon: Star,
    accentClass: "text-yellow-400",
  },
  {
    key: "upcoming",
    title: "Upcoming Movies",
    description: "Movies that are coming soon",
    endpoint: "upcoming",
    Icon: Clock,
    accentClass: "text-blue-400",
  },
];

const RATING_VALUES = [1, 2, 3, 4, 5];

const getPosterUrl = (path?: string | null, size: "w500" | "w780" = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

const formatReleaseDate = (date?: string) => {
  if (!date) return "No release date available";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No release date available";

  return new Intl.DateTimeFormat("en-US", {
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

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [addStates, setAddStates] = useState<Record<number, AddState>>({});
  const [ownedTmdbIds, setOwnedTmdbIds] = useState<Record<number, boolean>>({});
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [featuredData, setFeaturedData] = useState<
    Partial<Record<CollectionKey, MovieResult[]>>
  >({});
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUserAndCollection = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;

      const user = data?.user;
      if (!user) {
        setOwnedTmdbIds({});
        setIsLoadingCollection(false);
        return;
      }

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

  useEffect(() => {
    let isMounted = true;

    const fetchFeatured = async () => {
      setIsLoadingFeatured(true);
      setFeaturedError(null);

      try {
        const responses = await Promise.all(
          collectionSections.map(async (section) => {
            const { data, error } = await supabase.functions.invoke(
              "search-tmdb",
              {
                body: {
                  endpoint: section.endpoint,
                  page: 1,
                  includeGenres: true,
                },
              }
            );

            if (error) {
              throw new Error(error.message);
            }

            const payload = (data as { results?: MovieResult[] }) ?? {};
            return [section.key, (payload.results ?? []).slice(0, 6)];
          })
        );

        if (!isMounted) return;
        setFeaturedData(
          Object.fromEntries(responses) as Partial<
            Record<CollectionKey, MovieResult[]>
          >
        );
      } catch (err) {
        if (!isMounted) return;
        setFeaturedError(
          err instanceof Error ? err.message : "Failed to load featured movies."
        );
        setFeaturedData({});
      } finally {
        if (isMounted) {
          setIsLoadingFeatured(false);
        }
      }
    };

    fetchFeatured();

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
          includeGenres: true,
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

  const handleAddToCollection = async (
    movie: MovieResult,
    options: AddMovieOptions
  ) => {
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
        throw new Error("This movie does not have a valid release date.");
      }

      const { data: userData } = await supabase.auth.getUser();
      const currentProfileId = userData?.user?.id;
      if (!currentProfileId) {
        throw new Error("You must be logged in to add movies.");
      }

      const desiredStatus = options.status;
      const requiresPrice = desiredStatus === "owned" || desiredStatus === "watched";

      if (requiresPrice && options.estimatedPrice == null) {
        throw new Error("Please include the purchase price for this movie.");
      }

      const ratingValue =
        desiredStatus === "watched" && options.rating && options.rating > 0
          ? options.rating
          : null;
      const reviewValue =
        desiredStatus === "watched" && options.personalReview
          ? options.personalReview.trim() || null
          : null;

      const { error } = await supabase.from("movies").insert({
        profile_id: currentProfileId,
        status: desiredStatus,
        tmdb_id: movie.id,
        title: movie.title,
        release_year: releaseYear,
        synopsis: movie.overview ?? null,
        tmdb_poster_path: movie.poster_path ?? null,
        genres: movie.genres ?? null,
        estimated_price: options.estimatedPrice,
        rating: ratingValue,
        personal_review: reviewValue,
        watched_at: desiredStatus === "watched" ? new Date().toISOString() : null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setAddStates((prev) => ({ ...prev, [movie.id]: { status: "success" } }));
      setOwnedTmdbIds((prev) => ({ ...prev, [movie.id]: true }));
      toast.success(`${movie.title} was added to your collection.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add the movie.";
      setAddStates((prev) => ({
        ...prev,
        [movie.id]: { status: "error", message },
      }));
    }
  };

  return (
    <section className="space-y-8">
      <Card className="border-dashed<">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle className="mb-2">Explore New Retro Gems</CardTitle>
            <CardDescription>
              Search for movies to discover and add to your collection
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
              <Search className="size-4" />
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
                const addState = addStates[movie.id];
                const isAdding = addState?.status === "loading";
                const isAdded = addState?.status === "success";
                const alreadyOwned = ownedTmdbIds[movie.id];
                const showSuccess = isAdded || alreadyOwned;
                const posterUrl = getPosterUrl(movie.poster_path);

                return (
                  <MovieDialogCard
                    key={movie.id}
                    movie={movie}
                    addState={addState}
                    isAdding={isAdding}
                    showSuccess={showSuccess}
                    isCollectionLoading={isLoadingCollection}
                    onAdd={handleAddToCollection}
                    trigger={
                      <button
                        type="button"
                        className="group w-full text-left"
                        aria-label={`Ver detalles de ${movie.title}`}
                      >
                        <Card className="border hover:border-amber-500 gap-0! py-0! overflow-hidden transition group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-primary">
                          <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                            {posterUrl ? (
                              <Image
                                src={posterUrl}
                                alt={`Poster of ${movie.title}`}
                                fill
                                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 35vw, 90vw"
                                className="object-cover transition duration-300 group-hover:scale-105"
                                priority={false}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                Poster not available
                              </div>
                            )}
                          </div>
                          <CardContent className="space-y-1 px-4 py-3">
                            <CardTitle className="text-base">
                              {movie.title}
                            </CardTitle>
                            <CardDescription>
                              {formatReleaseDate(movie.release_date)}
                            </CardDescription>
                            {movie.genres && movie.genres.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {movie.genres
                                  .map((genre) => genre.name)
                                  .join(", ")}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </button>
                    }
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {collectionSections.map((section) => {
          const movies = featuredData[section.key] ?? [];
          const { Icon, accentClass } = section;

          return (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon
                    className={`size-4 ${accentClass}`}
                    aria-hidden="true"
                  />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingFeatured && (
                  <>
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {!isLoadingFeatured && featuredError && (
                  <p className="text-sm text-destructive">{featuredError}</p>
                )}

                {!isLoadingFeatured &&
                  !featuredError &&
                  movies.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No movies found for this category.
                    </p>
                  )}

                {!isLoadingFeatured &&
                  !featuredError &&
                  movies.slice(0, 3).map((movie) => {
                    const addState = addStates[movie.id];
                    const isAdding = addState?.status === "loading";
                    const isAdded = addState?.status === "success";
                    const alreadyOwned = ownedTmdbIds[movie.id];
                    const showSuccess = isAdded || alreadyOwned;
                    const posterThumb = getPosterUrl(movie.poster_path);

                    return (
                      <MovieDialogCard
                        key={`${section.key}-${movie.id}`}
                        movie={movie}
                        addState={addState}
                        isAdding={isAdding}
                        showSuccess={showSuccess}
                        isCollectionLoading={isLoadingCollection}
                        onAdd={handleAddToCollection}
                        trigger={
                          <button
                            type="button"
                            className="flex w-full items-center gap-3 rounded-md border hover:border-amber-500 px-3 py-2 text-left transition"
                            aria-label={`View details of ${movie.title}`}
                          >
                            <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                              {posterThumb ? (
                                <Image
                                  src={posterThumb}
                                  alt={`Póster de ${movie.title}`}
                                  fill
                                  sizes="3.5rem"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                  Sin póster
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-tight">
                                {movie.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatReleaseDate(movie.release_date)}
                              </p>
                            </div>
                          </button>
                        }
                      />
                    );
                  })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

type MovieDialogCardProps = {
  movie: MovieResult;
  trigger: ReactNode;
  addState?: AddState;
  isAdding: boolean;
  showSuccess: boolean;
  isCollectionLoading: boolean;
  onAdd: (movie: MovieResult, options: AddMovieOptions) => void;
};

function MovieDialogCard({
  movie,
  trigger,
  addState,
  isAdding,
  showSuccess,
  isCollectionLoading,
  onAdd,
}: MovieDialogCardProps) {
  const posterUrl = getPosterUrl(movie.poster_path);
  const genres = movie.genres ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<MovieStatus>("wishlist");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const requiresPrice = status === "owned" || status === "watched";
  const canEditRating = status === "watched";
  const canEditReview = status === "watched";
  const isBusy = isAdding || isCollectionLoading;

  const resetForm = () => {
    setStatus("wishlist");
    setPrice("");
    setRating(0);
    setReview("");
    setFormError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      resetForm();
    } else {
      setFormError(null);
    }
  };

  useEffect(() => {
    if (!requiresPrice) {
      setPrice("");
    }
    if (!canEditRating) {
      setRating(0);
    }
    if (!canEditReview) {
      setReview("");
    }
  }, [requiresPrice, canEditRating, canEditReview]);

  const handleAdd = () => {
    if (isBusy) return;
    setFormError(null);

    let parsedPrice: number | null = null;

    if (requiresPrice) {
      const trimmedPrice = price.trim();
      if (!trimmedPrice) {
        setFormError("Please enter the purchase price for this status.");
        return;
      }
      parsedPrice = Number.parseFloat(trimmedPrice);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        setFormError("Enter a valid non-negative price.");
        return;
      }
    }

    onAdd(movie, {
      status,
      estimatedPrice: parsedPrice,
      rating: canEditRating && rating > 0 ? rating : null,
      personalReview: canEditReview && review.trim() ? review.trim() : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl lg:max-w-5xl">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="relative mx-auto aspect-3/4 w-44 overflow-hidden rounded-xl bg-muted sm:w-60 lg:mx-0 lg:w-72">
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
                Poster not available
              </div>
            )}
          </div>
          <div className="flex-1 space-y-5">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle>{movie.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Release date:
                </span>{" "}
                {formatReleaseDate(movie.release_date)}
              </p>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Synopsis
                </p>
                <p className="mt-1 leading-relaxed text-foreground">
                  {movie.overview || "No synopsis available."}
                </p>
              </div>

              {genres.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Genres
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <Badge
                        key={genre.id}
                        variant="secondary"
                        className="bg-muted text-muted-foreground"
                      >
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t border-border/60 pt-3 text-muted-foreground">
                {movie.original_language && (
                  <div>
                    <p className="text-xs uppercase tracking-wide">
                      Original language
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {movie.original_language.toUpperCase()}
                    </p>
                  </div>
                )}
                {typeof movie.vote_average === "number" && (
                  <div>
                    <p className="text-xs uppercase tracking-wide">
                      TMDB rating
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {movie.vote_average.toFixed(1)} ({movie.vote_count ?? 0}{" "}
                      {movie.vote_count === 1 ? "vote" : "votes"})
                    </p>
                  </div>
                )}
              </div>
            </div>

            {!showSuccess && (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/10 p-4">
                <div className="space-y-2">
                  <Label htmlFor={`status-${movie.id}`}>Add as</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as MovieStatus)}
                    disabled={isBusy}
                  >
                    <SelectTrigger id={`status-${movie.id}`}>
                      <SelectValue placeholder="Choose a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresPrice && (
                  <div className="space-y-2">
                    <Label htmlFor={`price-${movie.id}`}>Purchase price</Label>
                    <Input
                      id={`price-${movie.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="e.g. 24.99"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      disabled={isBusy}
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for owned or watched movies.
                    </p>
                  </div>
                )}

                {canEditRating && (
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {RATING_VALUES.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => !isBusy && setRating(value)}
                            className={`text-amber-500 ${
                              isBusy ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            aria-label={`Assign ${value} stars`}
                            disabled={isBusy}
                          >
                            <Star
                              className={`size-6 ${
                                value <= rating
                                  ? "fill-current"
                                  : "stroke-current"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setRating(0)}
                        disabled={isBusy || rating === 0}
                      >
                        Clear
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {rating > 0 ? `${rating}/5` : "No rating"}
                      </span>
                    </div>
                  </div>
                )}

                {canEditReview && (
                  <div className="space-y-2">
                    <Label htmlFor={`review-${movie.id}`}>Personal review</Label>
                    <textarea
                      id={`review-${movie.id}`}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      placeholder="Write your private notes"
                      value={review}
                      onChange={(event) => setReview(event.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-1">
              {showSuccess ? (
                <p className="text-sm text-emerald-600">
                  This movie is already in your collection.
                </p>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={isBusy}
                    className="w-full cursor-pointer sm:w-auto"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {isAdding ? "Adding…" : "Add to my collection"}
                  </Button>
                  {(formError || (addState?.status === "error" && addState.message)) && (
                    <div className="space-y-1">
                      {formError && (
                        <p className="text-sm text-destructive">{formError}</p>
                      )}
                      {addState?.status === "error" && addState.message && (
                        <p className="text-sm text-destructive">
                          {addState.message}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
