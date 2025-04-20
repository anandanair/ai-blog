import { createSupabaseServerClient } from "@/utils/supabase/server";
import { PostData } from "@/types";
import { supabaseClient } from "@/utils/supabase/client";
import { AiTool } from "@/types";

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

export async function getSortedPostsData(): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, author, read_time"
    )
    .is("category", null)
    .eq("status", "published")
    .order("created_at", { ascending: false });

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
  }));
}

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

  return {
    id: data.slug,
    content: data.content,
    title: data.title,
    description: data.description,
    created_at: data.created_at,
    image_url: data.image_url,
    category: data.category,
    tool_name: data.tool_name,
  };
}

export async function getPostData(id: string): Promise<PostData | null> {
  const supabase = await createSupabaseServerClient();

  // Fetch a single post by its slug
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, content, created_at, image_url, category, author, read_time"
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
    author: data.author,
    author_image: getAuthorImage(data.author),
    read_time: data.read_time,
  };
}

export async function getAllPostIds() {
  const supabase = supabaseClient;

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
    params: {
      id: post.slug, // The route parameter is the slug
    },
  }));
}

export async function getSortedAiToolsData(): Promise<AiTool[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, description, created_at, image_url, category")
    .eq("category", "AI Tool of the Day")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sorted AI tools:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((tool) => ({
    id: tool.slug,
    title: tool.title,
    description: tool.description,
    created_at: tool.created_at,
    image_url: tool.image_url,
    category: tool.category,
  }));
}
