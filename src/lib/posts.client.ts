import { supabaseClient } from "@/utils/supabase/client";

export async function incrementPostViews(slug: string) {
  const supabase = supabaseClient;
  const { data, error } = await supabase.rpc("increment_post_views_by_slug", {
    post_slug: slug,
  });

  if (error) {
    console.error("Error incrementing views:", error);
  } else {
    // Optional: You might not need this log in production
    // console.log("Views incremented successfully!");
  }
}
