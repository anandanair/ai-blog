import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
export function initSupabase(): SupabaseClient {
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate Supabase credentials
  if (!SUPABASE_URL) {
    throw new Error("Missing environment variable: SUPABASE_URL");
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// Save post to Supabase
export async function savePostToDatabase(
  supabase: SupabaseClient,
  postData: {
    title: string;
    slug: string;
    description: string;
    content: string;
    category: number;
    image_url: string | null;
    read_time: number;
    tags: string[];
    research_details: Array<{ point: string; data: any }> | null;
  }
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          title: postData.title,
          slug: postData.slug,
          description: postData.description,
          content: postData.content,
          category: postData.category,
          image_url: postData.image_url,
          author: "Gemini",
          read_time: postData.read_time,
          tags: postData.tags,
          status: "published",
          research_details: postData.research_details,
        },
      ])
      .select();

    if (error) {
      // Check for unique constraint violation on slug
      if (error.code === "23505" && error.message.includes("posts_slug_key")) {
        console.error(
          `❌ Error saving post: Slug "${postData.slug}" already exists. Post "${postData.title}" not saved.`
        );
        return false;
      }
      throw error;
    }

    console.log(`✅ Post saved successfully to Supabase.`);
    return true;
  } catch (error) {
    console.error(
      `❌ Error saving post "${postData.title}" to Supabase:`,
      error
    );
    return false;
  }
}

// Add this function to fetch existing post titles from Supabase
export async function getExistingPostTitles(
  supabase: SupabaseClient
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("posts") // Replace with your actual table name if different
      .select("title")
      .order("created_at", { ascending: false })
      .limit(50); // Get the most recent 50 posts

    if (error) {
      console.error("Error fetching existing posts:", error);
      return [];
    }

    return data.map((post) => post.title);
  } catch (error) {
    console.error("Error in getExistingPostTitles:", error);
    return [];
  }
}

// Get all categories from post_categories table
export async function getAllCategories(
  supabase: SupabaseClient
): Promise<{ id: number; title: string }[]> {
  // Update return type here
  try {
    const { data, error } = await supabase
      .from("post_categories") // Assuming your table name is 'post_categories'
      .select("id, title"); // Select id instead of slug

    if (error) {
      console.error("❌ Error fetching categories:", error);
      throw error; // Re-throw the error to be handled by the caller if needed
    }

    // Ensure data is not null and is an array before returning
    // Supabase might return id as number, ensure it is
    const categories = (data || []).map((cat) => ({
      id: Number(cat.id), // Ensure id is a number
      title: cat.title,
    }));
    return categories;
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    return []; // Return an empty array in case of any error
  }
}

// Get post counts for each category
export async function getCategoryPostCounts(
  supabase: SupabaseClient
): Promise<{ id: number; title: string; count: number }[]> {
  try {
    // 1. Get all categories
    const categories = await getAllCategories(supabase);
    if (!categories || categories.length === 0) {
      console.log("No categories found to count posts for.");
      return [];
    }

    // 2. For each category, get the post count
    const countsPromises = categories.map(async (category) => {
      const { count, error } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true }) // Use head:true for efficiency
        .eq("category", category.id);

      if (error) {
        console.error(
          `❌ Error fetching post count for category "${category.title}" (ID: ${category.id}):`,
          error
        );
        // Return count as 0 or handle error as needed
        return { id: category.id, title: category.title, count: 0 };
      }

      return { id: category.id, title: category.title, count: count ?? 0 };
    });

    // 3. Wait for all count queries to complete
    const categoryCounts = await Promise.all(countsPromises);

    console.log("✅ Successfully fetched category post counts.");
    return categoryCounts;
  } catch (error) {
    console.error("❌ Error in getCategoryPostCounts:", error);
    return []; // Return empty array on failure
  }
}

// Fetch all published posts for the RSS feed
export async function getAllPostsForRss(supabase: SupabaseClient): Promise<
  {
    id: string; // Assuming id is UUID string, adjust if it's number
    title: string;
    slug: string;
    description: string;
    created_at: string; // Or Date, depending on how Supabase returns it
    author: string | null;
    image_url: string | null;
  }[]
> {
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, description, created_at, author, image_url")
      .eq("status", "published") // Only fetch published posts
      .order("created_at", { ascending: false }); // Latest posts first

    if (error) {
      console.error("❌ Error fetching posts for RSS:", error);
      throw error;
    }

    // Ensure data is not null and map if necessary (e.g., type casting)
    // Assuming Supabase returns types compatible with the return type promise
    return (data || []) as {
      id: string;
      title: string;
      slug: string;
      description: string;
      created_at: string;
      author: string | null;
      image_url: string | null;
    }[];
  } catch (error) {
    console.error("Error in getAllPostsForRss:", error);
    return []; // Return an empty array on failure
  }
}

export async function getAllPostsForSitemap(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select("slug, created_at") // Ensure 'updated_at' exists or use 'created_at'
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts for sitemap:", error);
    return [];
  }
  return data || [];
}
