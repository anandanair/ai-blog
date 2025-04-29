import { getSortedPostsData } from "@/lib/posts";
import { Metadata } from "next";
import PostsClient from "@/components/PostsClient";

// Define the page props type to include searchParams
type PostsPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export const metadata: Metadata = {
  title: "Blog Posts | AutoTek",
  description: "Explore our collection of articles on AI and technology",
};

export default async function PostsPage({ searchParams }: PostsPageProps) {
  // Server-side data fetching
  const categoryParam = (await searchParams).category;
  const posts = await getSortedPostsData(categoryParam as number | undefined);

  // Pass data to client component
  return <PostsClient posts={posts} />;
}
