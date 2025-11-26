import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

serve(async (req: Request) => {
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

    // 1. Auth Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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

    // 2. Parse Request
    const { endpoint, query, page = 1 } = await req.json();
    const normalizedPage = Number(page) > 0 ? Number(page) : 1;

    let url = "";

    // 3. Routing Logic
    switch (endpoint) {
      case "search":
        if (!query) throw new Error("Query is required for search");
        url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
          query
        )}&include_adult=false&language=en-US&page=${normalizedPage}`;
        break;

      case "popular":
        url = `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${normalizedPage}`;
        break;

      case "trending":
        url = `https://api.themoviedb.org/3/trending/movie/week?language=en-US`;
        break;

      default:
        throw new Error("Invalid endpoint specified");
    }

    // 4. Fetch from TMDB
    const tmdbResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        Accept: "application/json",
      },
    });

    if (!tmdbResponse.ok) {
      const errorText = await tmdbResponse.text();
      throw new Error(
        `TMDB request failed: ${tmdbResponse.status} ${errorText}`
      );
    }

    const data = await tmdbResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
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
