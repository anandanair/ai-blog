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

export async function getSortedPostsData(): Promise<PostData[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, created_at, image_url, category, author, read_time, tags"
    )
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
    tags: post.tags,
  }));
}

export async function getPostData(id: string): Promise<PostData | null> {
  const supabase = await createSupabaseServerClient();

  // Fetch a single post by its slug
  const { data, error } = await supabase
    .from("posts")
    .select(
      "slug, title, description, content, created_at, image_url, category, tags, author, read_time, research_details"
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
