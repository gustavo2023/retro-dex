"use client";

import {
  useMemo,
  useState,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Star, UploadCloud, LayoutGrid, List, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/utils/supabase/client";
import {
  STATUS_LABEL,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  getPosterUrl,
  type CollectionMovie,
  type MovieStatus,
  MOVIE_SELECT_FIELDS,
} from "@/lib/movies";

const STAR_VALUES = [1, 2, 3, 4, 5];
const STORAGE_BUCKET = "movie-posters";
const MAX_POSTER_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const STATUS_HOVER_BORDER: Record<MovieStatus, string> = {
  wishlist: "hover:border-amber-500",
  owned: "hover:border-emerald-500",
  watched: "hover:border-sky-500",
};

type CollectionGridProps = {
  initialMovies: CollectionMovie[];
};

export default function CollectionGrid({ initialMovies }: CollectionGridProps) {
  const [movies, setMovies] = useState(initialMovies);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isMobile = useIsMobile();

  const handleMovieUpdated = (updated: CollectionMovie) => {
    setMovies((prev) =>
      prev.map((movie) => (movie.id === updated.id ? updated : movie))
    );
  };

  const handleMovieDeleted = (deletedId: string) => {
    setMovies((prev) => prev.filter((movie) => movie.id !== deletedId));
  };

  if (!movies.length) {
    return null;
  }

  const effectiveLayout = isMobile ? "grid" : viewMode;

  return (
    <div className="space-y-4">
      {!isMobile && (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Grid view"
            title="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            aria-label="List view"
            title="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      )}

      <div
        className={
          effectiveLayout === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            : "flex flex-col gap-4"
        }
      >
        {movies.map((movie) => (
          <MovieEditDialog
            key={movie.id}
            movie={movie}
            onMovieUpdated={handleMovieUpdated}
            onMovieDeleted={handleMovieDeleted}
            layout={effectiveLayout}
          />
        ))}
      </div>
    </div>
  );
}

type MovieEditDialogProps = {
  movie: CollectionMovie;
  onMovieUpdated: (movie: CollectionMovie) => void;
  onMovieDeleted: (id: string) => void;
  layout: "grid" | "list";
};

function MovieEditDialog({
  movie,
  onMovieUpdated,
  onMovieDeleted,
  layout,
}: MovieEditDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<MovieStatus>(movie.status);
  const [review, setReview] = useState(movie.personal_review ?? "");
  const [rating, setRating] = useState<number>(movie.rating ?? 0);
  const [price, setPrice] = useState(
    movie.estimated_price ? String(movie.estimated_price) : ""
  );
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(
    getPosterUrl(movie)
  );
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Cleanup temporary previews when component unmounts
  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const resetFormState = () => {
    setStatus(movie.status);
    setReview(movie.personal_review ?? "");
    setRating(movie.rating ?? 0);
    setPrice(movie.estimated_price ? String(movie.estimated_price) : "");
    setPriceError(null);
    setPosterFile(null);
    setPosterPreview(getPosterUrl(movie));
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    if (nextOpen) {
      resetFormState();
    } else {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }
      setIsDeleteDialogOpen(false);
    }
  };

  const handlePosterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("The file must be a valid image.");
      return;
    }

    if (file.size > MAX_POSTER_SIZE) {
      setError("Poster must be smaller than 5MB.");
      return;
    }

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setPosterFile(file);
    setPosterPreview(objectUrl);
    setPreviewObjectUrl(objectUrl);
    setError(null);
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(event.target.value);
    setPriceError(null);
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleClearRating = () => {
    setRating(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isDeleting) return;
    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to save changes.");
      }

      let estimatedPrice: number | null = null;
      if (shouldShowPriceField) {
        const trimmedPrice = price.trim();
        if (!trimmedPrice) {
          setPriceError("Please enter the purchase price for this movie.");
          setIsSaving(false);
          return;
        }
        const parsedPrice = Number.parseFloat(trimmedPrice);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          setPriceError("Enter a valid non-negative purchase price.");
          setIsSaving(false);
          return;
        }
        estimatedPrice = parsedPrice;
      } else {
        setPriceError(null);
      }

      let userPosterUrl = movie.user_poster_url ?? null;
      if (posterFile) {
        const extension = posterFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${movie.id}-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, posterFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        if (!STORAGE_BASE_URL) {
          throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
        }

        userPosterUrl = `${STORAGE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
      }

      const payload = {
        status,
        rating: rating > 0 ? rating : null,
        personal_review: review.trim() ? review.trim() : null,
        user_poster_url: userPosterUrl,
        estimated_price: estimatedPrice,
        watched_at: status === "watched" ? new Date().toISOString() : null,
      };

      const { data, error: updateError } = await supabase
        .from("movies")
        .update(payload)
        .eq("id", movie.id)
        .select(MOVIE_SELECT_FIELDS)
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        // Supabase may return GenericStringError when row-level errors happen
        "error" in (data as Record<string, unknown>)
      ) {
        throw new Error("Supabase returned an invalid response.");
      }

      const updatedMovie = data as CollectionMovie;
      onMovieUpdated(updatedMovie);
      toast.success(`${movie.title} was updated successfully.`);
      handleOpenChange(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't save your changes.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isSaving || isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to delete movies.");
      }

      const { error: deleteError } = await supabase
        .from("movies")
        .delete()
        .eq("id", movie.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      onMovieDeleted(movie.id);
      toast.success(`${movie.title} was removed from your collection.`);
      setIsDeleteDialogOpen(false);
      handleOpenChange(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't delete this movie.";
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const posterUrlForCard = getPosterUrl(movie);
  const watchedDate = formatDate(movie.watched_at);
  const ratingValue = movie.rating ?? 0;
  const synopsisText = movie.synopsis ?? "No synopsis available.";
  const releaseYear = movie.release_year
    ? String(movie.release_year)
    : "Unknown release year";
  const genreNames = (movie.genres ?? [])
    .map((genre) => (typeof genre === "string" ? genre : genre?.name ?? null))
    .filter((name): name is string => Boolean(name));
  const gridVisibleGenres = genreNames.slice(0, 2);
  const remainingGenreCount = Math.max(
    genreNames.length - gridVisibleGenres.length,
    0
  );

  const isGridLayout = layout === "grid";
  const titleClass = isGridLayout ? "text-base" : "text-2xl";
  const metaTextClass = isGridLayout ? "text-xs" : "text-base";
  const synopsisClass = isGridLayout ? "text-sm" : "text-base";
  const detailsClass = isGridLayout ? "text-xs" : "text-sm";
  const badge = (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        STATUS_STYLES[movie.status]
      }`}
    >
      {STATUS_LABEL[movie.status]}
    </span>
  );
  const hoverBorderClass = STATUS_HOVER_BORDER[movie.status];
  const shouldShowPriceField = status === "owned" || status === "watched";
  const renderStaticStars = (sizeClass = "size-4", wrapperClassName = "") => (
    <div
      className={`flex gap-0.5 text-amber-500 ${wrapperClassName}`}
      aria-label={
        ratingValue > 0 ? `${ratingValue} out of 5 stars` : "No rating yet"
      }
    >
      {STAR_VALUES.map((value) => (
        <Star
          key={`readonly-${movie.id}-${value}-${sizeClass}`}
          className={`${sizeClass} ${
            value <= ratingValue
              ? "fill-current"
              : "stroke-current text-muted-foreground"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  const dialogContentId = useMemo(() => `movie-dialog-${movie.id}`, [movie.id]);
  const displayPoster = posterPreview ?? posterUrlForCard;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <button
        type="button"
        className="group w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogContentId}
        onClick={() => handleOpenChange(true)}
      >
        <Card
          className={`overflow-hidden transition ${hoverBorderClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            isGridLayout
              ? "flex h-full flex-col border gap-0! py-0! group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-primary"
              : "flex border"
          }`}
        >
          {isGridLayout ? (
            <>
              <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                {posterUrlForCard ? (
                  <Image
                    src={posterUrlForCard}
                    alt={`Poster for ${movie.title}`}
                    fill
                    sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, 60vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No poster
                  </div>
                )}
              </div>
              <CardContent className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className={`${titleClass} leading-tight`}>
                      {movie.title}
                    </CardTitle>
                    <CardDescription
                      className={`${metaTextClass} text-muted-foreground`}
                    >
                      {releaseYear}
                    </CardDescription>
                    {genreNames.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {gridVisibleGenres.map((name, index) => (
                          <Badge
                            key={`${movie.id}-grid-${name}-${index}`}
                            variant="secondary"
                            className="bg-muted text-muted-foreground"
                          >
                            {name}
                          </Badge>
                        ))}
                        {remainingGenreCount > 0 && (
                          <span className="text-[12px] font-medium text-muted-foreground">
                            +{remainingGenreCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {renderStaticStars("size-4")}
                </div>
                <div className="flex justify-end">{badge}</div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex w-full gap-5 px-5 py-0">
              <div className="relative h-56 w-40 shrink-0 overflow-hidden rounded-2xl bg-muted">
                {posterUrlForCard ? (
                  <Image
                    src={posterUrlForCard}
                    alt={`Poster for ${movie.title}`}
                    fill
                    sizes="(min-width: 1280px) 12vw, 40vw"
                    className="object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No poster
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className={`${titleClass} leading-tight`}>
                      {movie.title}
                    </CardTitle>
                    <CardDescription
                      className={`${metaTextClass} text-muted-foreground`}
                    >
                      {releaseYear}
                    </CardDescription>
                    {genreNames.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {genreNames.map((name, index) => (
                          <Badge
                            key={`${movie.id}-list-${name}-${index}`}
                            variant="secondary"
                            className="bg-muted text-muted-foreground"
                          >
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">{badge}</div>
                </div>
                {movie.synopsis && (
                  <CardDescription
                    className={`${synopsisClass} text-muted-foreground line-clamp-4`}
                  >
                    {movie.synopsis}
                  </CardDescription>
                )}
                <div
                  className={`flex flex-wrap gap-6 ${detailsClass} text-muted-foreground`}
                >
                  {ratingValue > 0 ? (
                    <div className="flex items-center">
                      {renderStaticStars("size-4")}
                    </div>
                  ) : (
                    <span>No rating yet</span>
                  )}
                  {watchedDate && <span>Watched: {watchedDate}</span>}
                  {movie.estimated_price && (
                    <span>Value: {formatCurrency(movie.estimated_price)}</span>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </button>

      <DialogContent
        id={dialogContentId}
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{movie.title}</DialogTitle>
          <DialogDescription>
            Update your personal review, status, rating, or upload your own
            poster.
          </DialogDescription>
          <div className="pt-2 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Release year
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {releaseYear}
            </p>
          </div>
        </DialogHeader>

        <div className="mt-6 flex justify-center">
          <div className="relative mx-auto aspect-3/4 w-48 overflow-hidden rounded-2xl bg-muted sm:w-60 lg:mx-0 lg:w-72">
            {displayPoster ? (
              <Image
                src={displayPoster}
                alt={`Poster for ${movie.title}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No poster
              </div>
            )}
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor={`poster-${movie.id}`}>Custom poster</Label>
            <Input
              id={`poster-${movie.id}`}
              type="file"
              accept="image/*"
              onChange={handlePosterChange}
            />
            <p className="text-xs text-muted-foreground">
              PNG or JPG files up to 5MB.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Synopsis
            </p>
            <p className="mt-1 leading-relaxed text-foreground/90">
              {synopsisText}
            </p>
            {genreNames.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {genreNames.map((name, index) => (
                  <Badge
                    key={`synopsis-genre-${movie.id}-${name}-${index}`}
                    variant="secondary"
                    className="bg-muted text-muted-foreground"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`status-${movie.id}`}>Status</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as MovieStatus)}
            >
              <SelectTrigger id={`status-${movie.id}`} className="w-full">
                <SelectValue />
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

          {shouldShowPriceField && (
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
                onChange={handlePriceChange}
                required={shouldShowPriceField}
              />
              {priceError ? (
                <p className="text-xs text-red-500">{priceError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  We&apos;ll store this as the estimated value for your
                  collection stats.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {STAR_VALUES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleRatingClick(value)}
                    className="text-amber-500"
                    aria-label={`Assign ${value} stars`}
                  >
                    <Star
                      className={`size-6 ${
                        value <= rating ? "fill-current" : "stroke-current"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearRating}
              >
                Clear
              </Button>
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating}/5` : "No rating"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-${movie.id}`}>Personal review</Label>
            <textarea
              id={`review-${movie.id}`}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Write your private notes"
              value={review}
              onChange={(event) => setReview(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </Button>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSaving || isDeleting}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove this movie?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{movie.title}&quot;
                      from your collection.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Keep movie
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="size-4" /> Deleting
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="size-4" /> Saving
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UploadCloud className="size-4" /> Save changes
                  </span>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
