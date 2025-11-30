export type MovieStatus = "wishlist" | "owned" | "watched";

export type CollectionMovie = {
  id: string;
  title: string;
  release_year: number | null;
  status: MovieStatus;
  rating: number | null;
  synopsis: string | null;
  personal_review: string | null;
  genres: Array<{ name?: string } | string> | null;
  tmdb_poster_path: string | null;
  user_poster_url: string | null;
  estimated_price: number | string | null;
  watched_at: string | null;
};

export const MOVIE_SELECT_FIELDS = [
  "id",
  "title",
  "release_year",
  "status",
  "rating",
  "synopsis",
  "personal_review",
  "genres",
  "tmdb_poster_path",
  "user_poster_url",
  "estimated_price",
  "watched_at",
].join(",");

export const STATUS_LABEL: Record<MovieStatus, string> = {
  wishlist: "Wishlist",
  owned: "Owned",
  watched: "Watched",
};

export const STATUS_STYLES: Record<MovieStatus, string> = {
  wishlist: "bg-amber-50 text-amber-600 border border-amber-200",
  owned: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  watched: "bg-sky-50 text-sky-600 border border-sky-200",
};

export const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

export const formatCurrency = (
  value: number | string | null | undefined
) => {
  if (value === null || value === undefined) return "—";
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numericValue) || numericValue <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

export const getPosterUrl = (movie: CollectionMovie) =>
  movie.user_poster_url ??
  (movie.tmdb_poster_path
    ? `${TMDB_POSTER_BASE_URL}${movie.tmdb_poster_path}`
    : null);

export const getGenresLabel = (movie: CollectionMovie) => {
  if (!movie.genres?.length) return null;
  return movie.genres
    .map((genre) =>
      typeof genre === "string" ? genre : genre?.name ?? "Unknown genre"
    )
    .filter(Boolean)
    .slice(0, 3)
    .join(" • ");
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};
