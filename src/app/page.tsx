import {
  getSortedPostsData,
  getPopularPostsData,
  getUniqueCategories,
} from "@/lib/posts"; // Import getPopularPostsData
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const popularPosts = await getPopularPostsData(5); // Fetch 5 popular posts
  const categories = await getUniqueCategories();

  return <BlogClient posts={posts} popularPosts={popularPosts} categories={categories} />; // Pass popularPosts
}
