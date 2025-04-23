import {
  getSortedPostsData,
  getPopularPostsData,
  getUniqueCategories,
  getTrendingPostsData,
} from "@/lib/posts"; // Import getPopularPostsData
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const popularPosts = await getPopularPostsData(5);
  const trendingPosts = await getTrendingPostsData(10, 7);
  const categories = await getUniqueCategories();

  return (
    <BlogClient
      posts={posts}
      popularPosts={popularPosts}
      trendingPosts={trendingPosts}
      categories={categories}
    />
  ); // Pass popularPosts
}
