import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Category, PostData } from "@/types";
import { initSupabase } from "../../utils/database";
import { cache } from "react";

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

export const getHomePostsData = cache(
  async (options?: { limit?: number }): Promise<PostData[]> => {
    const supabase = await createSupabaseServerClient();

    let queryBuilder = supabase
      .from("posts")
      .select(
        "slug, title, description, created_at, image_url, author, read_time, tags, views, post_categories!fk_category(title)"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });

    // Apply limit
    if (options?.limit) {
      queryBuilder = queryBuilder.limit(options?.limit);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching sorted posts:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((post) => {
      const category = post.post_categories as unknown as { title: string };
      return {
        id: post.slug,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        image_url: post.image_url,
        category: category.title,
        author: post.author,
        author_image: getAuthorImage(post.author), // Add author image based on author name
        read_time: post.read_time,
        tags: post.tags as string[] | null,
        views: post.views,
      };
    });
  }
);

export const getSortedPostsData = cache(
  async (options?: {
    category?: number;
    query?: string;
    tags?: string[];
    readTime?: number;
    popularity?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PostData[]> => {
    const supabase = await createSupabaseServerClient();

    let queryBuilder = supabase
      .from("posts")
      .select(
        "slug, title, description, created_at, image_url, author, read_time, tags, views, post_categories!fk_category(title)"
      )
      .eq("status", "published");
    // .order("created_at", { ascending: false });

    if (options?.category) {
      queryBuilder = queryBuilder.eq("category", options.category);
    }

    // Apply text search if provided
    if (options?.query && options.query.trim() !== "") {
      const searchTerm = options.query.trim();
      const ftsQuery = searchTerm
        .split(" ")
        .filter((s) => s)
        .join(" & "); // Example: 'hello world' -> 'hello & world'
      queryBuilder = queryBuilder.textSearch("fts_document", ftsQuery, {
        // type: 'plain', // or 'phrase' or 'websearch'
        // config: 'english' // if your tsvector column is language-specific
      });
      // query = query.or(
      //   `title.ilike.%${options.query}%,description.ilike.%${options.query}%`
      // );
    }

    // Apply tags filter if provided
    if (options?.tags && options.tags.length > 0) {
      // Using overlaps for array comparison - checks if tags column contains any of the provided tags
      queryBuilder = queryBuilder.overlaps("tags", options.tags);
    }

    // Apply read time filter if provided
    if (options?.readTime && options.readTime > 0) {
      queryBuilder = queryBuilder.lte("read_time", options.readTime);
    }

    // Apply sorting
    // Default sort order
    let primarySortColumn = "created_at";
    let primarySortAscending = false;
    let secondarySortColumn: string | null = null;
    let secondarySortAscending = false;

    // Apply sorting based on popularity
    if (options?.popularity) {
      switch (options.popularity) {
        case "trending":
          // For trending, we might want to get posts from the last 7 days with high views
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          queryBuilder = queryBuilder.gte(
            "created_at",
            sevenDaysAgo.toISOString()
          );
          // .order("views", { ascending: false });
          primarySortColumn = "views";
          primarySortAscending = false;
          secondarySortColumn = "created_at";
          secondarySortAscending = false;
          break;
          break;
        case "most_viewed":
          // query = query.order("views", { ascending: false });
          primarySortColumn = "views";
          primarySortAscending = false;
          secondarySortColumn = "created_at"; // As a tie-breaker
          secondarySortAscending = false;
          break;
        case "most_recent":
          // query = query.order("created_at", { ascending: false });
          // Default is already most_recent
          primarySortColumn = "created_at";
          primarySortAscending = false;
          secondarySortColumn = null; // No specific secondary needed beyond DB's internal tie-breaking
          break;
        // default:
        // Default sorting by creation date
        // query = query.order("created_at", { ascending: false });
      }
    }

    // else {
    //   // Default sorting by creation date
    //   query = query.order("created_at", { ascending: false });
    // }

    queryBuilder = queryBuilder.order(primarySortColumn, {
      ascending: primarySortAscending,
    });
    if (secondarySortColumn) {
      queryBuilder = queryBuilder.order(secondarySortColumn, {
        ascending: secondarySortAscending,
      });
    }

    // Apply pagination
    if (
      options?.page &&
      options?.pageSize &&
      options.page > 0 &&
      options.pageSize > 0
    ) {
      const from = (options?.page - 1) * options?.pageSize;
      const to = from + options?.pageSize - 1;
      queryBuilder = queryBuilder.range(from, to);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Error fetching sorted posts:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((post) => {
      const category = post.post_categories as unknown as { title: string };
      return {
        id: post.slug,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        image_url: post.image_url,
        category: category.title,
        author: post.author,
        author_image: getAuthorImage(post.author), // Add author image based on author name
        read_time: post.read_time,
        tags: post.tags as string[] | null,
        views: post.views,
      };
    });
  }
);

export const getPostData = cache(
  async (id: string): Promise<PostData | null> => {
    // const supabase = await createSupabaseServerClient();
    const supabase = initSupabase();

    // Fetch a single post by its slug
    const { data, error } = await supabase
      .from("posts")
      .select(
        "slug, title, description, content, created_at, image_url, post_categories!fk_category(title), tags, author, read_time, research_details, views"
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

    const category = data.post_categories as unknown as { title: string };

    // Return the combined data
    return {
      id: data.slug,
      content: data.content,
      title: data.title,
      description: data.description,
      created_at: data.created_at,
      image_url: data.image_url,
      category: category.title,
      tags: data.tags,
      author: data.author,
      author_image: getAuthorImage(data.author),
      read_time: data.read_time,
      research_details: data.research_details,
      views: data.views,
    };
  }
);

export async function getAllPostIds() {
  const supabase = initSupabase();

  // Fetch slugs for all posts
  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published")
    .limit(500);

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
export const getPopularPostsData = cache(
  async (limit: number = 5): Promise<PostData[]> => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(
        "slug, title, description, created_at, image_url, post_categories!fk_category(title), author, read_time, tags, views"
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

    return data.map((post) => {
      const category = post.post_categories as unknown as { title: string };
      return {
        id: post.slug,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        image_url: post.image_url,
        category: category.title,
        author: post.author,
        author_image: getAuthorImage(post.author),
        read_time: post.read_time,
        tags: post.tags,
        views: post.views,
      };
    });
  }
);

// New function to get trending posts
export const getTrendingPostsData = cache(
  async (
    limit: number = 10,
    timeWindowDays: number = 7
  ): Promise<PostData[]> => {
    const supabase = await createSupabaseServerClient();

    // Calculate the date for the time window (e.g., last 7 days)
    const timeWindow = new Date();
    timeWindow.setDate(timeWindow.getDate() - timeWindowDays);
    const timeWindowStr = timeWindow.toISOString();

    // First, get posts created within the time window
    const { data, error } = await supabase
      .from("posts")
      .select(
        "slug, title, description, created_at, image_url, post_categories!fk_category(title), author, read_time, tags, views"
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
    return trendingPosts.map((post) => {
      const category = post.post_categories as unknown as { title: string };
      return {
        id: post.slug,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        image_url: post.image_url,
        category: category.title,
        author: post.author,
        author_image: getAuthorImage(post.author),
        read_time: post.read_time,
        tags: post.tags,
        views: post.views,
      };
    });
  }
);

export const getFeaturedPosts = cache(
  async (limit: number = 3): Promise<PostData[]> => {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(
        "slug, title, description, created_at, image_url, post_categories!fk_category(title), author, read_time, tags, views"
      )
      .eq("status", "published")
      .not("views", "is", null);

    if (error || !data) {
      console.error("Error fetching featured posts:", error);
      return [];
    }

    const postsWithScore = data.map((post) => {
      const createdDate = new Date(post.created_at);
      const now = new Date();
      const daysSinceCreation = Math.max(
        1,
        Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      const featuredScore = post.views - daysSinceCreation * 5;

      return {
        ...post,
        featuredScore,
      };
    });

    const featuredPosts = postsWithScore
      .sort((a, b) => b.featuredScore - a.featuredScore)
      .slice(0, limit);

    return featuredPosts.map((post) => {
      const category = post.post_categories as unknown as { title: string };
      return {
        id: post.slug,
        title: post.title,
        description: post.description,
        created_at: post.created_at,
        image_url: post.image_url,
        category: category.title,
        author: post.author,
        author_image: getAuthorImage(post.author),
        read_time: post.read_time,
        tags: post.tags,
        views: post.views,
      };
    });
  }
);

export const getAllCategoriesSortedByPostCount = cache(
  async (): Promise<{ id: number; title: string; post_count: number }[]> => {
    const supabase = await createSupabaseServerClient();

    try {
      // Call the database function created in Supabase
      const { data, error } = await supabase.rpc(
        "get_categories_sorted_by_post_count"
      );

      if (error) {
        console.error("Error fetching categories sorted by post count:", error);
        return []; // Return empty array on error
      }

      if (!data) {
        return []; // Return empty array if no data
      }

      // The RPC function returns data in the format: { id: number, title: string, post_count: bigint }
      // Convert any bigint values to number if needed
      return data.map((category: any) => ({
        id: Number(category.id),
        title: category.title,
        post_count: Number(category.post_count),
      }));
    } catch (error) {
      console.error("Unexpected error fetching categories:", error);
      return [];
    }
  }
);

// Function to get all unique tags from posts
export const getAllUniqueTags = cache(
  async (): Promise<{ id: string; name: string }[]> => {
    const supabase = await createSupabaseServerClient();

    // Fetch all tags from published posts
    const { data, error } = await supabase
      .from("posts")
      .select("tags")
      .eq("status", "published")
      .not("tags", "is", null);

    if (error) {
      console.error("Error fetching tags:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Extract and flatten all tags from posts
    const allTags = data.flatMap((post) => post.tags || []);

    // Create a map to handle case-insensitive uniqueness
    const tagMap = new Map<string, string>();

    // For each tag, store the lowercase version as key and keep the best capitalization as value
    allTags.forEach((tag) => {
      if (!tag || tag.trim() === "") return;

      const lowerTag = tag.toLowerCase();

      // If this tag doesn't exist yet or the current one has a better capitalization, store it
      if (
        !tagMap.has(lowerTag) ||
        (tag !== tag.toLowerCase() && tag !== tag.toUpperCase())
      ) {
        tagMap.set(lowerTag, tag);
      }
    });

    // Convert map to array of objects
    return Array.from(tagMap.entries())
      .map(([lowerTag, displayTag]) => ({
        id: `tag-${lowerTag.replace(/\s+/g, "-")}`,
        name: displayTag,
      }))
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())); // Sort alphabetically
  }
);
