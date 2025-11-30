import { createClient } from "@/utils/supabase/server";
import CollectionDashboard from "@/components/dashboard/collection-dashboard";
import { type CollectionMovie, MOVIE_SELECT_FIELDS } from "@/lib/movies";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let movies: CollectionMovie[] = [];
  let errorMessage: string | null = null;

  if (!user) {
    errorMessage = "We could not identify your user account.";
  } else {
    const { data, error } = await supabase
      .from("movies")
      .select(MOVIE_SELECT_FIELDS)
      .eq("profile_id", user.id)
      .order("title", { ascending: true });

    if (error) {
      errorMessage = error.message;
    } else {
      movies = (data ?? []) as unknown as CollectionMovie[];
    }
  }

  return (
    <CollectionDashboard initialMovies={movies} initialError={errorMessage} />
  );
}
