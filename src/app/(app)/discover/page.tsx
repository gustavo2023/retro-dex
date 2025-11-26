"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/utils/supabase/client";

type MovieResult = {
  id: number;
  title: string;
  release_date?: string;
  overview?: string;
};

const mockCollections = [
  {
    title: "Visionados recientes",
    description: "Historias que la comunidad está revisitando",
  },
  {
    title: "Clásicos que regresan",
    description: "Películas que no pasan de moda",
  },
  {
    title: "Listas colaborativas",
    description: "Construidas por curadores invitados",
  },
];

export default function DiscoverPage() {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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
      setResults(payload.results ?? []);
      setHasSearched(true);
    } catch (err) {
      setResults([]);
      setHasSearched(true);
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo completar la búsqueda."
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <section className="space-y-8">
      <Card className="border-dashed">
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Explora nuevas gemas retro</CardTitle>
            <CardDescription>
              Busca directamente en TMDB sin exponer el token desde el cliente.
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
                No encontramos resultados para &quot;{query}&quot;.
              </p>
            )}

          {results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((movie) => (
                <Card key={movie.id} className="border border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">{movie.title}</CardTitle>
                    <CardDescription>
                      {movie.release_date
                        ? new Date(movie.release_date).toLocaleDateString()
                        : "Sin fecha registrada"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {movie.overview || "Sin sinopsis disponible."}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
