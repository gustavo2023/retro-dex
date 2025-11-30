import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_LANGUAGE = "en-US";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

interface MovieListResponse {
  page?: number;
  results?: Array<
    {
      genre_ids?: number[];
      genres?: { id: number; name: string }[];
    } & Record<string, unknown>
  >;
}

interface GenreListResponse {
  genres?: { id: number; name: string }[];
}

const buildUrl = (
  endpoint: string,
  page: number,
  language: string,
  query?: string,
) => {
  switch (endpoint) {
    case "search":
      if (!query) {
        throw new Error("Query is required for search");
      }
      return `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=${language}&page=${page}`;
    case "popular":
      return `${TMDB_BASE_URL}/movie/popular?language=${language}&page=${page}`;
    case "top_rated":
      return `${TMDB_BASE_URL}/movie/top_rated?language=${language}&page=${page}`;
    case "upcoming":
      return `${TMDB_BASE_URL}/movie/upcoming?language=${language}&page=${page}`;
    case "trending":
      return `${TMDB_BASE_URL}/trending/movie/week?language=${language}`;
    default:
      throw new Error("Invalid endpoint specified");
  }
};

async function fetchJson<T>(url: string, tmdbToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TMDB request failed: ${response.status} ${errorText}`);
  }

  return (await response.json()) as T;
}

async function fetchGenreMap(tmdbToken: string, language: string) {
  const genreData = await fetchJson<GenreListResponse>(
    `${TMDB_BASE_URL}/genre/movie/list?language=${language}`,
    tmdbToken,
  );
  const map = new Map<number, string>();
  for (const genre of genreData.genres ?? []) {
    map.set(genre.id, genre.name);
  }
  return map;
}

function enrichWithGenres(
  payload: MovieListResponse,
  genreMap: Map<number, string> | null,
) {
  if (!genreMap || !payload.results) return payload;

  payload.results = payload.results.map((movie) => ({
    ...movie,
    genres: (movie.genre_ids ?? [])
      .map((genreId) =>
        genreMap.has(genreId)
          ? { id: genreId, name: genreMap.get(genreId)! }
          : null,
      )
      .filter(Boolean) as { id: number; name: string }[],
  }));

  return payload;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const tmdbToken = Deno.env.get("TMDB_ACCESS_TOKEN");
    if (!tmdbToken) {
      throw new Error("TMDB access token is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase project credentials are not configured");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userResponse.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      endpoint,
      query,
      page = 1,
      tmdbId,
      includeGenres = false,
      language = DEFAULT_LANGUAGE,
    } = await req.json();

    const normalizedPage = Number(page) > 0 ? Number(page) : 1;
    let responsePayload: unknown;

    if (endpoint === "details") {
      if (typeof tmdbId !== "number") {
        throw new Error("tmdbId is required for details endpoint");
      }

      responsePayload = await fetchJson(
        `${TMDB_BASE_URL}/movie/${tmdbId}?language=${language}`,
        tmdbToken,
      );
    } else {
      const url = buildUrl(endpoint, normalizedPage, language, query);
      const listPayload = await fetchJson<MovieListResponse>(url, tmdbToken);
      const genreMap = includeGenres
        ? await fetchGenreMap(tmdbToken, language)
        : null;
      responsePayload = enrichWithGenres(listPayload, genreMap);
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status =
      message === "Unauthorized"
        ? 401
        : message.startsWith("TMDB request failed")
        ? 502
        : 400;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
