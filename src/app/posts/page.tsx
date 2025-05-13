import {
  getAllCategoriesSortedByPostCount,
  getSortedPostsData,
  getAllUniqueTags,
} from "@/lib/posts";
import { Metadata } from "next";
import PostsClient from "@/components/PostsClient";

// Define the page props type to include searchParams
type PostsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Blog Posts | AutoTek",
  description: "Explore our collection of articles on AI and technology",
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  // Server-side data fetching
  const params = await searchParams;

  // Extract all search parameters
  const categoryParam = params.category ? Number(params.category) : undefined;
  const queryParam = params.query as string | undefined;

  // Handle tags - could be a string or array of strings
  let tagsParam: string[] | undefined;
  if (params.tags) {
    tagsParam = Array.isArray(params.tags)
      ? params.tags
      : [params.tags as string];
  }

  // Handle read time
  const readTimeParam = params.readTime ? Number(params.readTime) : undefined;

  // Handle popularity
  const popularityParam = params.popularity as string | undefined;

  // Handle pagination parameters
  const pageParam = params.page ? Number(params.page) : 1;
  const pageSizeParam = params.pageSize ? Number(params.pageSize) : 9; // Default to 9 posts per page

  // Call getSortedPostsData with all parameters
  const posts = await getSortedPostsData({
    category: categoryParam,
    query: queryParam,
    tags: tagsParam,
    readTime: readTimeParam,
    popularity: popularityParam,
    page: pageParam,
    pageSize: pageSizeParam,
  });

  // Get total posts count for pagination
  const allPosts = await getSortedPostsData({
    category: categoryParam,
    query: queryParam,
    tags: tagsParam,
    readTime: readTimeParam,
    popularity: popularityParam,
  });

  const totalPosts = allPosts.length;
  const categories = await getAllCategoriesSortedByPostCount();
  const tags = await getAllUniqueTags(); // Fetch real tags from posts

  // Pass data to client component
  return (
    <PostsClient
      posts={posts}
      categories={categories}
      tags={tags}
      totalPosts={totalPosts}
      currentPage={pageParam}
      pageSize={pageSizeParam}
    />
  );
}
