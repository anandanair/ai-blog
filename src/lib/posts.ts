import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PostData } from "@/types";
import { initSupabase } from "../../utils/database";

// Helper function to get author image based on model name
function getAuthorImage(authorName: string | null): string {
  if (!authorName) return "/images/authors/default.png";

  // Map of model names to their image paths
  const authorImages: Record<string, string> = {
    Gemini: "/images/authors/gemini.png",
    "GPT-4": "/images/authors/gpt4.png",
    Claude: "/images/authors/claude.png",
    // Add more models as needed
  };

  // Return the mapped image or default if not found
  return authorImages[authorName] || "/images/authors/default.png";
}

export async function getSortedPostsData(
  category?: string
): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, author, read_time, tags, views"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching sorted posts:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((post) => ({
    id: post.slug,
    title: post.title,
    description: post.description,
    created_at: post.created_at,
    image_url: post.image_url,
    category: post.category,
    author: post.author,
    author_image: getAuthorImage(post.author), // Add author image based on author name
    read_time: post.read_time,
    tags: post.tags,
    views: post.views,
  }));
}

export async function getPostData(id: string): Promise<PostData | null> {
  const supabase = await createSupabaseServerClient();

  // Fetch a single post by its slug
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, content, created_at, image_url, category, tags, author, read_time, research_details, views"
    )
    .eq("slug", id)
    .eq("status", "published") // Adjust status as needed
    .maybeSingle();

  if (error) {
    console.error(`Error fetching post data for slug ${id}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Return the combined data
  return {
    id: data.slug,
    content: data.content,
    title: data.title,
    description: data.description,
    created_at: data.created_at,
    image_url: data.image_url,
    category: data.category,
    tags: data.tags,
    author: data.author,
    author_image: getAuthorImage(data.author),
    read_time: data.read_time,
    research_details: data.research_details,
    views: data.views,
  };
}

export async function getAllPostIds() {
  const supabase = initSupabase();

  // Fetch slugs for all posts
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published"); // Adjust status as needed

  if (error) {
    console.error("Error fetching post IDs:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map slugs to the format expected by getStaticPaths
  return data.map((post) => ({
    id: post.slug,
  }));
}

// New function to get popular posts
export async function getPopularPostsData(
  limit: number = 5
): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, author, read_time, tags, views"
    )
    .eq("status", "published")
    .not("views", "is", null) // Ensure posts have views
    .order("views", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching popular posts:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((post) => ({
    id: post.slug,
    title: post.title,
    description: post.description,
    created_at: post.created_at,
    image_url: post.image_url,
    category: post.category,
    author: post.author,
    author_image: getAuthorImage(post.author),
    read_time: post.read_time,
    tags: post.tags,
    views: post.views,
  }));
}

export async function getUniqueCategories(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  // Fetch only the 'category' column for published posts
  const { data, error } = await supabase
    .from("posts")
    .select("category")
    .eq("status", "published");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // 1. Extract the category strings from the data array.
  // 2. Filter out any null or undefined category values.
  const categories = data
    .map((item) => item.category)
    .filter(Boolean) as string[];

  // 3. Use a Set to automatically handle uniqueness.
  // 4. Convert the Set back into an Array.
  const uniqueCategories = Array.from(new Set(categories));

  return uniqueCategories;
}

// New function to get trending posts
export async function getTrendingPostsData(
  limit: number = 10,
  timeWindowDays: number = 7
): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  // Calculate the date for the time window (e.g., last 7 days)
  const timeWindow = new Date();
  timeWindow.setDate(timeWindow.getDate() - timeWindowDays);
  const timeWindowStr = timeWindow.toISOString();

  // First, get posts created within the time window
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, author, read_time, tags, views"
    )
    .eq("status", "published")
    .not("views", "is", null) // Ensure posts have views
    .gte("created_at", timeWindowStr) // Only posts within the time window
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching trending posts:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Calculate trending score for each post
  const postsWithScore = data.map((post) => {
    // Calculate days since post creation
    const createdDate = new Date(post.created_at);
    const now = new Date();
    const daysSinceCreation = Math.max(
      1,
      Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    // Freshness factor - newer posts get higher weight
    const freshnessFactor = Math.exp(-0.1 * daysSinceCreation); // Exponential decay

    // Calculate trending score
    // Views per day × freshness factor
    const viewsPerDay = post.views / daysSinceCreation;
    const trendingScore = viewsPerDay * freshnessFactor;

    return {
      ...post,
      trendingScore,
    };
  });

  // Sort by trending score and limit results
  const trendingPosts = postsWithScore
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);

  // Map to the expected PostData format
  return trendingPosts.map((post) => ({
    id: post.slug,
    title: post.title,
    description: post.description,
    created_at: post.created_at,
    image_url: post.image_url,
    category: post.category,
    author: post.author,
    author_image: getAuthorImage(post.author),
    read_time: post.read_time,
    tags: post.tags,
    views: post.views,
  }));
}
