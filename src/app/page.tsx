import {
  getSortedPostsData,
  getPopularPostsData,
  getUniqueCategories,
  getTrendingPostsData,
  getFeaturedPosts,
} from "@/lib/posts"; // Import getPopularPostsData
import BlogClient from "@/components/BlogClient";

export default async function Home() {
  const posts = await getSortedPostsData();
  const popularPosts = await getPopularPostsData(5);
  const trendingPosts = await getTrendingPostsData(10, 7);
  const featuredPosts = await getFeaturedPosts(3);
  const categories = await getUniqueCategories();

  return (
    <BlogClient
      posts={posts}
      featuredPosts={featuredPosts}
      popularPosts={popularPosts}
      trendingPosts={trendingPosts}
      categories={categories}
    />
  ); // Pass popularPosts
}
