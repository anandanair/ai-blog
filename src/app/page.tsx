import { getSortedPostsData, getPopularPostsData } from "@/lib/posts"; // Import getPopularPostsData
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const popularPosts = await getPopularPostsData(5); // Fetch 5 popular posts

  return <BlogClient posts={posts} popularPosts={popularPosts} />; // Pass popularPosts
}
