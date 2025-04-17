import { remark } from "remark";
import html from "remark-html";
import { createSupabaseServerClient } from "@/utils/supabase/server"; // Adjust path if necessary

interface PostData {
  id: string; // This will be the 'slug'
  title: string;
  description?: string | null;
  created_at: string; // Or published_at if you prefer
  image_url?: string | null;
  category?: string | null;
  tool_name?: string | null;
  contentHtml?: string; // Only included in getPostData/getAiToolData
  // Add other fields from your table if needed (e.g., tags)
}

// --- General Posts Functions ---

export async function getSortedPostsData(): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, description, created_at, image_url, category")
    .is("category", null)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sorted posts:", error);
    return [];
  }

  console.log("Fetched Posts Data:", data); // Log the fetched data

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
  }));
}

export async function getAllPostIds() {
  const supabase = await createSupabaseServerClient();

  // Fetch slugs for general posts
  const { data, error } = await supabase
    .from("posts")
    .select("slug") // Select only the slug
    .is("category", null) // Match the filter in getSortedPostsData
    .eq("status", "published");

  if (error) {
    console.error("Error fetching post IDs:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map slugs to the format expected by getStaticPaths
  return data.map((post) => ({
    params: {
      id: post.slug, // The route parameter is the slug
    },
  }));
}

export async function getPostData(id: string): Promise<PostData | null> {
  // id is the slug
  const supabase = await createSupabaseServerClient();

  // Fetch a single general post by its slug
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, content, created_at, image_url, category"
    ) // Select all needed fields including content
    .eq("slug", id) // Filter by slug
    .is("category", null) // Ensure it's a general post
    .eq("status", "published")
    .maybeSingle(); // Fetch one or null

  if (error) {
    console.error(`Error fetching post data for slug ${id}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Process markdown content to HTML
  const processedContent = await remark()
    .use(html, { sanitize: false }) // Assuming content is trusted or sanitized elsewhere if needed
    .process(data.content || ""); // Process markdown content, handle null case

  const contentHtml = processedContent.toString();

  // Return the combined data
  return {
    id: data.slug, // Use slug as id
    contentHtml,
    title: data.title,
    description: data.description,
    created_at: data.created_at,
    image_url: data.image_url,
    category: data.category,
  };
}

// --- AI Tool of the Day Functions ---

export async function getSortedAiToolsData(): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  // Fetch posts specifically marked as 'AI Tool of the Day'
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, tool_name"
    ) // Select tool-specific fields
    .eq("category", "AI Tool of the Day") // Filter by the specific category
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sorted AI tools:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map Supabase data
  return data.map((tool) => ({
    id: tool.slug,
    title: tool.title,
    description: tool.description,
    created_at: tool.created_at,
    image_url: tool.image_url,
    category: tool.category,
    tool_name: tool.tool_name,
  }));
}

/**
 * Gets the data for the most recent AI Tool post.
 */
export async function getLatestAiToolData(): Promise<PostData | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, tool_name"
    )
    .eq("category", "AI Tool of the Day")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching latest AI tool:", error);
    return null;
  }

  console.log("Fetched Latest AI Tool Data:", data); // Log the fetched data

  if (!data) {
    return null;
  }

  return {
    id: data.slug,
    title: data.title,
    description: data.description,
    created_at: data.created_at,
    image_url: data.image_url,
    category: data.category,
    tool_name: data.tool_name,
  };
}

export async function getAllAiToolIds() {
  const supabase = await createSupabaseServerClient();

  // Fetch slugs for AI tool posts
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("category", "AI Tool of the Day")
    .eq("status", "published");

  if (error) {
    console.error("Error fetching AI tool IDs:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Map slugs to the params format
  return data.map((tool) => ({
    params: {
      id: tool.slug,
    },
  }));
}

export async function getAiToolData(id: string): Promise<PostData | null> {
  // id is the slug
  const supabase = await createSupabaseServerClient();

  // Fetch a single AI tool post by its slug
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, content, created_at, image_url, category, tool_name"
    )
    .eq("slug", id)
    .eq("category", "AI Tool of the Day") // Ensure it's an AI tool post
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(`Error fetching AI tool data for slug ${id}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Process markdown content to HTML
  const processedContent = await remark()
    .use(html, { sanitize: false })
    .process(data.content || "");
  const contentHtml = processedContent.toString();

  // Return the combined data
  return {
    id: data.slug,
    contentHtml,
    title: data.title,
    description: data.description,
    created_at: data.created_at,
    image_url: data.image_url,
    category: data.category,
    tool_name: data.tool_name,
  };
}
