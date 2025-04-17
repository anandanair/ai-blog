import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
export function initSupabase(): SupabaseClient {
  const SUPABASE_URL = process.env.SUPABASE_URL;
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
    category: string | null;
    image_url: string | null;
    tool_name: string | null;
    read_time: number;
    tags: string[];
  }
): Promise<boolean> {
  console.log(`⏳ Saving post ${postData.slug} to Supabase database...`);

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
          tool_name: postData.tool_name,
          author: "Gemini",
          read_time: postData.read_time,
          tags: postData.tags,
          status: "published",
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

// Get previously used tools
export async function getPreviouslyUsedTools(
  supabase: SupabaseClient
): Promise<string[]> {
  const { data: previousTools, error: toolsError } = await supabase
    .from("posts")
    .select("tool_name")
    .eq("category", "AI Tool of the Day")
    .not("tool_name", "is", null);

  if (toolsError) {
    console.error("❌ Error fetching previously used tools:", toolsError);
    return [];
  }

  return previousTools.map((post) => post.tool_name).filter(Boolean);
}
