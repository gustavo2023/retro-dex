"use client";

import { useMemo, useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Star, UploadCloud, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createClient } from "@/utils/supabase/client";
import {
  STATUS_LABEL,
  STATUS_STYLES,
  formatCurrency,
  formatDate,
  getGenresLabel,
  getPosterUrl,
  type CollectionMovie,
  type MovieStatus,
  MOVIE_SELECT_FIELDS,
} from "@/lib/movies";

const STAR_VALUES = [1, 2, 3, 4, 5];
const STORAGE_BUCKET = "movie-posters";
const MAX_POSTER_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type CollectionGridProps = {
  initialMovies: CollectionMovie[];
};

export default function CollectionGrid({ initialMovies }: CollectionGridProps) {
  const [movies, setMovies] = useState(initialMovies);

  const handleMovieUpdated = (updated: CollectionMovie) => {
    setMovies((prev) =>
      prev.map((movie) => (movie.id === updated.id ? updated : movie))
    );
  };

  if (!movies.length) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {movies.map((movie) => (
        <MovieEditDialog
          key={movie.id}
          movie={movie}
          onMovieUpdated={handleMovieUpdated}
        />
      ))}
    </div>
  );
}

type MovieEditDialogProps = {
  movie: CollectionMovie;
  onMovieUpdated: (movie: CollectionMovie) => void;
};

function MovieEditDialog({ movie, onMovieUpdated }: MovieEditDialogProps) {
  const supabase = useMemo(() => createClient(), []);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<MovieStatus>(movie.status);
  const [review, setReview] = useState(movie.personal_review ?? "");
  const [rating, setRating] = useState<number>(movie.rating ?? 0);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(
    getPosterUrl(movie)
  );
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
  };

  const handlePosterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen válida.");
      return;
    }

    if (file.size > MAX_POSTER_SIZE) {
      setError("El poster debe pesar menos de 5MB.");
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

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleClearRating = () => {
    setRating(0);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Necesitas iniciar sesión para guardar cambios.");
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
          throw new Error("Falta configurar NEXT_PUBLIC_SUPABASE_URL.");
        }

        userPosterUrl = `${STORAGE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
      }

      const payload = {
        status,
        rating: rating > 0 ? rating : null,
        personal_review: review.trim() ? review.trim() : null,
        user_poster_url: userPosterUrl,
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
        throw new Error("Supabase devolvió una respuesta inválida.");
      }

      const updatedMovie = data as CollectionMovie;
      onMovieUpdated(updatedMovie);
      toast.success(`${movie.title} se actualizó correctamente.`);
      handleOpenChange(false);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No pudimos guardar los cambios.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const posterUrlForCard = getPosterUrl(movie);
  const genres = getGenresLabel(movie);
  const watchedDate = formatDate(movie.watched_at);
  const ratingLabel = movie.rating ? `${movie.rating}/5` : null;
  const detailedGenres = genres ?? "Sin datos";
  const synopsisText = movie.synopsis ?? "No hay sinopsis disponible.";
  const releaseYear = movie.release_year ? String(movie.release_year) : "?";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="w-full text-left">
          <Card className="overflow-hidden transition hover:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <CardContent className="flex gap-4 p-4">
              <div className="relative h-40 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                {posterUrlForCard ? (
                  <Image
                    src={posterUrlForCard}
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
                    <p className="text-xs text-muted-foreground">{genres}</p>
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
                    <span>Value: {formatCurrency(movie.estimated_price)}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar "{movie.title}"</DialogTitle>
          <DialogDescription>
            Actualiza tu reseña personal, estado, rating o sube un poster propio.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Sinopsis</p>
            <p className="mt-1 leading-relaxed text-foreground/90">{synopsisText}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Año</p>
              <p className="mt-1 font-medium">{releaseYear}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Géneros</p>
              <p className="mt-1 font-medium">{detailedGenres}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado actual</p>
              <p className="mt-1 font-medium">{STATUS_LABEL[movie.status]}</p>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative h-48 w-full max-w-[180px] overflow-hidden rounded-xl bg-muted">
              {posterPreview ? (
                <Image
                  src={posterPreview}
                  alt={`Poster preview for ${movie.title}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="size-6" />
                  Sin poster
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor={`poster-${movie.id}`}>Poster personalizado</Label>
              <Input
                id={`poster-${movie.id}`}
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
              />
              <p className="text-xs text-muted-foreground">
                Formatos PNG o JPG. Tamaño máximo 5MB.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`status-${movie.id}`}>Estado</Label>
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
                    aria-label={`Asignar ${value} estrellas`}
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
                Limpiar
              </Button>
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating}/5` : "Sin rating"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`review-${movie.id}`}>Reseña personal</Label>
            <textarea
              id={`review-${movie.id}`}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              placeholder="Escribe tus notas privadas"
              value={review}
              onChange={(event) => setReview(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" /> Guardando
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadCloud className="size-4" /> Guardar cambios
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
